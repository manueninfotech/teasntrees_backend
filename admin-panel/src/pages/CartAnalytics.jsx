import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, TrendingUp, Users, Clock,
    ChevronRight, ArrowRight, RefreshCw, Eye,
    ShoppingBag, AlertCircle, Calendar, ExternalLink, Download
} from 'lucide-react';
import api from '../utils/api';
import CartDetailsModal from '../components/CartDetailsModal';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const PopularSkeleton = () => (
    <div className="p-2 space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 flex gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-50 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);

const TableSkeleton = () => (
    <div className="p-4 space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Cart Analysis</h1>
                    <p className="text-gray-500 mt-1 font-bold">Understand what customers are adding to their carts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50">
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button onClick={handleSync} disabled={isSyncing} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Active Carts" value={stats?.totalActiveCarts || 0} icon={ShoppingCart} theme="indigo" desc="In use right now" loading={statsLoading} />
                <StatCard label="Abandoned Carts" value={stats?.totalAbandonedCarts || 0} icon={Clock} theme="orange" desc="Inactive for 7+ days" loading={statsLoading} />
                <StatCard label="Avg. Cart Value" value={`₹${stats?.averageCartValue || 0}`} icon={TrendingUp} theme="emerald" desc="Theoretical average" loading={statsLoading} />
                <StatCard label="Empty Carts" value={stats?.emptyCartsCount || 0} icon={ShoppingBag} theme="gray" desc="Carts with 0 items" loading={statsLoading} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Hot Items</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Most added products</p>
                        </div>
                    </div>
                    {statsLoading && !stats ? (
                        <PopularSkeleton />
                    ) : (
                        <div className="p-4 flex-1 overflow-y-auto">
                            {stats?.popularCartItems?.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-200 font-black uppercase tracking-widest opacity-20 py-10"><ShoppingCart className="w-12 h-12 mb-3" /> No items active</div>
                            ) : (
                                <div className="space-y-4">
                                    {stats?.popularCartItems?.map((item, index) => (
                                        <div key={item.productId} className="flex items-center gap-4 p-5 hover:bg-indigo-50/30 rounded-[1.5rem] transition-all group">
                                            <div className="w-12 h-12 bg-white border border-gray-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">#{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight mb-0.5">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.inCartsCount} Active Carts</span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{item.totalQuantity} Qty</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Abandoned Carts</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Recovery Opportunities</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-tight"><AlertCircle className="w-4 h-4" /> Priority List</div>
                    </div>
                    {tableLoading && abandonedCarts.length === 0 ? (
                        <TableSkeleton />
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/10">
                                        <th className="px-8 py-6">Customer</th>
                                        <th className="px-8 py-6">Cart Value</th>
                                        <th className="px-8 py-6">Days Abandoned</th>
                                        <th className="px-8 py-6 text-right">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-sans">
                                    {abandonedCarts.length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-32 text-center text-gray-200 font-black uppercase tracking-[0.2em]">Zero leakage detected</td></tr>
                                    ) : (
                                        abandonedCarts.map((cart) => (
                                            <tr key={cart.userId} className="hover:bg-indigo-50/20 transition-all group">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-gray-900 text-xs uppercase mb-0.5">{cart.userName}</p>
                                                    <p className="text-[10px] text-gray-400 font-black">{cart.userMobile}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-indigo-600 text-sm">₹{cart.subtotal}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{cart.itemCount} Items Stacked</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${cart.daysAbandoned > 30 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        <Clock className="w-4 h-4" /> {cart.daysAbandoned} Days
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => setSelectedCart(cart)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm group-hover:scale-110"><Eye className="w-5 h-5" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex justify-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === p ? 'bg-black text-white shadow-xl translate-y-[-2px]' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'}`}>{p}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedCart && <CartDetailsModal cart={selectedCart} onClose={() => setSelectedCart(null)} />}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        gray: 'from-slate-700 to-slate-800 shadow-slate-100 text-slate-700 bg-slate-50'
    };
    const style = themes[theme] || themes.indigo;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-3xl font-black text-gray-900 tracking-tighter ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                    <div className={`flex items-center gap-1 py-1 px-3 ${bgColor} rounded-full w-fit`}>
                        <ArrowRight className={`w-3 h-3 ${textColor}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${textColor}`}>{desc}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};

export default CartAnalytics;
