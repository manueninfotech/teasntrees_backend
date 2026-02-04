import React, { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, TrendingUp, Users, Clock,
    ChevronRight, ArrowRight, RefreshCw, Eye,
    ShoppingBag, AlertCircle, Calendar, ExternalLink, Download,
    Activity, DollarSign
} from 'lucide-react';
import api from '../utils/api';
import CartDetailsModal from '../components/CartDetailsModal';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const PopularSkeleton = () => (
    <div className="p-4 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);

const CartAnalytics = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [page, setPage] = useState(1);
    const [selectedCart, setSelectedCart] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch Stats
    const { data: stats, isLoading: statsLoading, isFetching: statsFetching, refetch: refetchStats } = useQuery({
        queryKey: ['cart-analytics-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/cart-analytics');
            return response.data.data;
        }
    });

    // Fetch Abandoned Carts
    const { data: abandonedData, isLoading: tableLoading, isFetching: tableFetching, refetch: refetchAbandoned } = useQuery({
        queryKey: ['cart-abandoned', page],
        queryFn: async () => {
            const response = await api.get(`/admin/cart-analytics/abandoned?page=${page}&limit=10`);
            return response.data.data;
        }
    });

    const isSyncing = statsFetching || tableFetching;
    const handleSync = () => { refetchStats(); refetchAbandoned(); };

    const abandonedCarts = abandonedData?.abandonedCarts || [];
    const totalPages = abandonedData?.pagination?.totalPages || 1;

    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        if (!abandonedCarts.length) return [];
        // Group by days abandoned usually makes sense, or just map the top 10 carts by value for visualization
        // Let's create a "Value Distribution" chart from the current page data (or ideal full data if available, but page data is fast)
        // Better: Mock a timeline based on "lastUpdated"
        const timeline = abandonedCarts
            .sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated))
            .map(c => ({
                date: new Date(c.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: c.subtotal,
                items: c.itemCount
            }));
        return timeline;
    }, [abandonedCarts]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['cart-analytics-stats'] });
            queryClient.invalidateQueries({ queryKey: ['cart-abandoned'] });
        };
        socket.on('cart:updated', handleUpdate);
        socket.on('cart:deleted', handleUpdate);
        return () => {
            socket.off('cart:updated', handleUpdate);
            socket.off('cart:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/admin/cart-analytics/abandoned?limit=1000');
            if (response.data.success) {
                const data = response.data.data.abandonedCarts;
                const csvContent = "data:text/csv;charset=utf-8,Customer Name,Mobile,Cart Value,Items,Days Abandoned,Last Active\n" +
                    data.map(c => `"${c.userName}","${c.userMobile}",${c.subtotal},${c.itemCount},${c.daysAbandoned},"${new Date(c.lastUpdated).toLocaleDateString()}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `abandoned_carts_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
            }
        } catch (error) { console.error('Export failed:', error); } finally { setIsExporting(false); }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 uppercase tracking-tighter">
                        Cart Analytics
                    </h1>
                    <p className="text-gray-500 font-bold tracking-tight mt-1 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Real-time abandonment insights
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 hover:bg-gray-900">
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button onClick={handleSync} disabled={isSyncing} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all disabled:opacity-50 hover:-translate-y-1 group">
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    label="Active Carts"
                    value={stats?.totalActiveCarts || 0}
                    icon={ShoppingCart}
                    theme="indigo"
                    desc="Currently Shopping"
                    loading={statsLoading}
                />
                <StatCard
                    label="Abandoned"
                    value={stats?.totalAbandonedCarts || 0}
                    icon={AlertCircle}
                    theme="orange"
                    desc="Action Required"
                    loading={statsLoading}
                />
                <StatCard
                    label="Potential Revenue"
                    value={`₹${stats?.totalAbandonedValue || (stats?.totalActiveCarts * stats?.averageCartValue) || 0}`}
                    icon={DollarSign}
                    theme="emerald"
                    desc="Locked in carts"
                    loading={statsLoading}
                />
                <StatCard
                    label="Avg. Cart Size"
                    value={`₹${stats?.averageCartValue || 0}`}
                    icon={TrendingUp}
                    theme="rose"
                    desc="Per customer"
                    loading={statsLoading}
                />
            </div>

            {/* Analytics Section - Charts & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Abandonment Trend</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Value over time</p>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">Last 10 Carts</div>
                    </div>

                    <div className="h-[300px] w-full relative z-10">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        hide={true}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                                        labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <Activity className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-xs font-black uppercase tracking-widest">Not enough data</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hot Items Sidebar */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Trending Items</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Most added to carts</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {statsLoading ? (
                            <PopularSkeleton />
                        ) : stats?.popularCartItems?.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                                <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-widest">No active items</span>
                            </div>
                        ) : (
                            stats?.popularCartItems?.map((item, index) => (
                                <div key={item.productId} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group cursor-default">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-orange-100 text-orange-600' : index === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-400'}`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-gray-900 uppercase truncate">{item.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.inCartsCount} Active</p>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600">
                                        {item.totalQuantity}x
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Abandoned Carts Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Recovery Priority
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Carts idle for 24h+</p>
                    </div>
                    {abandonedCarts.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{abandonedCarts.length} At Risk</span>
                        </div>
                    )}
                </div>

                {tableLoading && abandonedCarts.length === 0 ? (
                    <div className="p-12 text-center text-gray-300">
                        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin grayscale opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest">Loading data...</p>
                    </div>
                ) : abandonedCarts.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">All Clear</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">No abandoned carts requiring attention</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50">
                                    <th className="px-8 py-6">Customer</th>
                                    <th className="px-8 py-6">Cart Value</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Last Activity</th>
                                    <th className="px-8 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {abandonedCarts.map((cart) => (
                                    <tr key={cart.userId} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black text-white flex items-center justify-center text-xs font-black uppercase shadow-lg shadow-gray-200">
                                                    {cart.userName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{cart.userName}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 tracking-wider font-mono mt-0.5">{cart.userMobile}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 text-sm">₹{cart.subtotal}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{cart.itemCount} Items</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cart.daysAbandoned > 7
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : cart.daysAbandoned > 3
                                                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                <Clock className="w-3 h-3" />
                                                {cart.daysAbandoned === 0 ? 'Today' : `${cart.daysAbandoned}d Ago`}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                {new Date(cart.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">
                                                {new Date(cart.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedCart(cart)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all shadow-sm transform group-hover:scale-105"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-50 flex justify-center gap-2 bg-gray-50/10">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === p
                                        ? 'bg-black text-white shadow-lg scale-110'
                                        : 'bg-white text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedCart && <CartDetailsModal cart={selectedCart} onClose={() => setSelectedCart(null)} />}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        indigo: 'from-indigo-500 to-violet-600 shadow-indigo-200 text-indigo-600 bg-indigo-50',
        orange: 'from-orange-400 to-red-500 shadow-orange-200 text-orange-600 bg-orange-50',
        emerald: 'from-emerald-400 to-teal-500 shadow-emerald-200 text-emerald-600 bg-emerald-50',
        rose: 'from-rose-400 to-pink-500 shadow-rose-200 text-rose-600 bg-rose-50',
    };

    // Default to indigo if theme not found
    const style = themes[theme] || themes.indigo;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');

    // Manual gradient construction because splitting string classes is tricky with Tailwind compiler sometimes, 
    // but assuming these are standard utility classes it works.

    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            {/* Background Decor */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:scale-150 transition-transform duration-500`} />

            <div className="relative flex items-start justify-between">
                <div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${bgColor} mb-4`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${textColor} animate-pulse`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${textColor}`}>{label}</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mb-1" />
                    ) : (
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{value}</h3>
                    )}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        {desc}
                    </p>
                </div>

                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg transform group-hover:rotate-12 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

export default CartAnalytics;
