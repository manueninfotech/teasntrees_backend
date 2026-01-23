import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, TrendingUp, Users, Clock,
    ChevronRight, ArrowRight, RefreshCw, Eye,
    ShoppingBag, AlertCircle, Calendar, ExternalLink, Download
} from 'lucide-react';
import api from '../utils/api';
import CartDetailsModal from '../components/CartDetailsModal';

const CartAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCart, setSelectedCart] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchOverview();
    }, []);

    useEffect(() => {
        fetchAbandoned();
    }, [page]);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/cart-analytics');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching cart stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAbandoned = async () => {
        setTableLoading(true);
        try {
            const response = await api.get(`/admin/cart-analytics/abandoned?page=${page}&limit=10`);
            if (response.data.success) {
                setAbandonedCarts(response.data.data.abandonedCarts);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching abandoned carts:', error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/admin/cart-analytics/abandoned?limit=1000');
            if (response.data.success) {
                const data = response.data.data.abandonedCarts;
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Customer Name,Mobile,Cart Value,Items,Days Abandoned,Last Active\n"
                    + data.map(c => `"${c.userName}","${c.userMobile}",${c.subtotal},${c.itemCount},${c.daysAbandoned},"${new Date(c.lastUpdated).toLocaleDateString()}"`).join("\n");

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `abandoned_carts_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-sans">Cart Analytics</h1>
                    <p className="text-gray-500 mt-1 font-medium">Monitor customer shopping behavior and abandoned carts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm"
                    >
                        <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button
                        onClick={() => { fetchOverview(); fetchAbandoned(); }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    >
                        <RefreshCw className={`w-4 h-4 ${(loading || tableLoading) ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Feature Dashboard Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Active Carts"
                    value={stats?.totalActiveCarts || 0}
                    icon={ShoppingCart}
                    theme="indigo"
                    desc="Carts with items"
                />
                <StatCard
                    label="Abandoned Carts"
                    value={stats?.totalAbandonedCarts || 0}
                    icon={Clock}
                    theme="orange"
                    desc="7+ days inactivity"
                />
                <StatCard
                    label="Avg. Cart Value"
                    value={`₹${stats?.averageCartValue || 0}`}
                    icon={TrendingUp}
                    theme="emerald"
                    desc="Active carts mean"
                />
                <StatCard
                    label="Empty Carts"
                    value={stats?.emptyCartsCount || 0}
                    icon={ShoppingBag}
                    theme="gray"
                    desc="Initial sessions"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Item List */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Popular in Carts
                        </h2>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-2 py-1 rounded-lg border border-gray-100">Top 10</span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="animate-pulse p-4 flex gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : stats?.popularCartItems?.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-sm text-gray-400 font-medium">No popular items found</p>
                            </div>
                        ) : (
                            stats?.popularCartItems?.map((item, index) => (
                                <div key={item.productId} className="flex items-center gap-4 p-4 hover:bg-indigo-50/50 rounded-2xl transition-all group">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-indigo-100">
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{item.name}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{item.inCartsCount} Active Carts</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{item.totalQuantity} Qty</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Abandoned Carts Details */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Abandoned Recoveries</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Carts with items (7+ days old)</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Cart Value</th>
                                    <th className="px-6 py-4">Inactivity</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-sans">
                                {tableLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-16 float-right"></div></td>
                                        </tr>
                                    ))
                                ) : abandonedCarts.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                            <p className="text-gray-500 font-bold">No recovery opportunities</p>
                                            <p className="text-xs text-gray-400 mt-1 uppercase font-black">All active or empty carts</p>
                                        </td>
                                    </tr>
                                ) : (
                                    abandonedCarts.map((cart) => (
                                        <tr key={cart.userId} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-gray-900 text-sm">{cart.userName}</p>
                                                <p className="text-xs text-gray-500 font-medium">{cart.userMobile}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-black text-indigo-600 text-sm">₹{cart.subtotal}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{cart.itemCount} Items</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${cart.daysAbandoned > 30 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                    <Clock className="w-3 h-3" />
                                                    {cart.daysAbandoned} Days
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedCart(cart)}
                                                    className="p-2.5 bg-gray-100 hover:bg-black hover:text-white rounded-xl text-gray-500 transition-all shadow-sm border border-transparent"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-50 flex justify-center bg-gray-50/30">
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all shadow-sm ${page === p
                                            ? 'bg-black text-white shadow-lg scale-110'
                                            : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Details Modal */}
            {selectedCart && (
                <CartDetailsModal
                    cart={selectedCart}
                    onClose={() => setSelectedCart(null)}
                />
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc }) => {
    const themes = {
        indigo: {
            bg: 'bg-indigo-600',
            light: 'bg-indigo-500/10',
            text: 'text-indigo-600',
            border: 'border-indigo-100',
            shadow: 'shadow-indigo-100',
            gradient: 'from-indigo-600 to-indigo-700'
        },
        orange: {
            bg: 'bg-orange-500',
            light: 'bg-orange-500/10',
            text: 'text-orange-600',
            border: 'border-orange-100',
            shadow: 'shadow-orange-100',
            gradient: 'from-orange-500 to-orange-600'
        },
        emerald: {
            bg: 'bg-emerald-600',
            light: 'bg-emerald-500/10',
            text: 'text-emerald-600',
            border: 'border-emerald-100',
            shadow: 'shadow-emerald-100',
            gradient: 'from-emerald-600 to-emerald-700'
        },
        gray: {
            bg: 'bg-slate-700',
            light: 'bg-slate-500/10',
            text: 'text-slate-700',
            border: 'border-slate-200',
            shadow: 'shadow-slate-100',
            gradient: 'from-slate-700 to-slate-800'
        }
    };

    const style = themes[theme] || themes.indigo;

    return (
        <div className={`relative overflow-hidden bg-white p-6 rounded-3xl border ${style.border} shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group duration-300`}>
            {/* Background Accent Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.gradient} opacity-[0.03] rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`}></div>

            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 py-1 px-2 ${style.light} rounded-lg w-fit transition-all group-hover:translate-x-1`}>
                        <ArrowRight className={`w-3 h-3 ${style.text}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${style.text}`}>
                            {desc}
                        </span>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg ${style.shadow} transform group-hover:rotate-12 transition-all duration-300`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>

            {/* Glass effect shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
    );
};

export default CartAnalytics;
