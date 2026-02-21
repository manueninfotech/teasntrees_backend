import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, Filter, Eye, Calendar, DollarSign, Clock, TrendingUp, User, MapPin, Package, ArrowRight, RefreshCw } from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderDetailsModal from '../components/OrderDetailsModal';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const OrderCardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-64"></div>
        ))}
    </div>
);

export default function Orders() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [filters, setFilters] = useState({
        brand: searchParams.get('brand') || '',  // Add brand filtering
        status: searchParams.get('status') || '',
        paymentMethod: '',
        paymentStatus: '',
        startDate: '',
        endDate: ''
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        limit: 12
    });

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['orders-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/orders/stats');
            const data = response.data.data;
            localStorage.setItem('orders-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('orders-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    // Fetch Orders
    const { data: ordersData, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['orders', pagination.currentPage, filters, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit
            });
            if (filters.brand) params.append('brand', filters.brand);
            if (filters.status) params.append('status', filters.status);
            if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/admin/orders?${params.toString()}`);
            const data = response.data;
            // Cache with filter key to maintain different caches for different filters
            const cacheKey = `orders-cache-${pagination.currentPage}-${filters.brand}-${filters.status}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cacheKey = `orders-cache-${pagination.currentPage}-${filters.brand}-${filters.status}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const isSyncing = isFetching;

    const orders = ordersData?.data || [];
    const paginationInfo = ordersData?.pagination || { totalPages: 1, totalItems: 0 };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
        };
        socket.on('order:new', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        return () => {
            socket.off('order:new', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const handleOrderUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
        setShowDetailsModal(false);
    };

    const clearFilters = () => {
        setFilters({ brand: '', status: '', paymentMethod: '', paymentStatus: '', startDate: '', endDate: '' });
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Order Management</h1>
                    <p className="text-gray-500 mt-1 font-bold">Track and manage all customer orders</p>
                </div>
                <button
                    onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
                        refetch();
                    }}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Orders'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} theme="blue" desc="All time" loading={statsLoading} />
                <StatCard label="Pending" value={stats?.pendingOrders || 0} icon={Clock} theme="orange" desc="Needs confirmation" loading={statsLoading} />
                <StatCard label="Preparing" value={stats?.inProgressOrders || 0} icon={TrendingUp} theme="purple" desc="Being prepared" loading={statsLoading} />
                <StatCard label="Today's Revenue" value={`₹${stats?.todayRevenue || 0}`} icon={DollarSign} theme="green" desc="Success orders today" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <select value={filters.brand} onChange={(e) => setFilters({ ...filters, brand: e.target.value })} className="input text-xs font-bold uppercase border-indigo-200 bg-indigo-50 text-indigo-700">
                        <option value="">All Brands</option>
                        <option value="teasntrees">Teas N Trees</option>
                        <option value="littleh">LittleH Bakery</option>
                    </select>
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-xs font-bold uppercase">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="waiting_for_rider">Waiting for Rider</option>
                        <option value="assigned">Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })} className="input text-xs font-bold uppercase">
                        <option value="">All Payments</option>
                        <option value="COD">Cash on Delivery</option>
                        <option value="Online">Online</option>
                    </select>
                    <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} className="input text-xs font-bold uppercase">
                        <option value="">Pay Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                    </select>
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="input text-xs font-bold" />
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="input text-xs font-bold" />
                </div>
            </div>

            <div className="min-h-[400px]">
                {orders.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                    <p className="font-black text-gray-900 uppercase text-sm">#{order.orderNumber}</p>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><User className="w-5 h-5" /></div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-800 text-sm truncate uppercase">{order.customerId?.name || '---'}</p>
                                            <p className="text-[10px] text-gray-500 font-bold tracking-wider">{order.brand === 'littleh' ? 'LITTLEH BAKERY' : 'TEAS N TREES'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" /></div>
                                        <p className="text-xs text-gray-500 font-bold line-clamp-2 leading-relaxed">{order.deliveryAddress?.address || 'Pickup from store'}</p>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase">Grand Total</p>
                                            <p className="text-xl font-black text-indigo-600">₹{order.total}</p>
                                        </div>
                                        <button onClick={() => handleViewDetails(order)} className="p-3 bg-gray-100 text-gray-400 rounded-2xl group-hover:bg-black group-hover:text-white transition-all"><Eye className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 font-black text-gray-200">
                        <ShoppingBag className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <h3 className="text-2xl uppercase tracking-widest">No matching orders</h3>
                    </div>
                )}
            </div>

            {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))} disabled={pagination.currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 disabled:opacity-30"><Clock className="w-5 h-5 rotate-180" /></button>
                    <span className="bg-white px-6 py-3 rounded-2xl border border-gray-100 font-black text-gray-500">Page {pagination.currentPage} / {paginationInfo.totalPages}</span>
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.min(paginationInfo.totalPages, p.currentPage + 1) }))} disabled={pagination.currentPage === paginationInfo.totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black text-white disabled:opacity-30"><ArrowRight className="w-5 h-5" /></button>
                </div>
            )}

            <OrderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} order={selectedOrder} onSuccess={handleOrderUpdate} />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-blue-700 shadow-blue-100 text-blue-600 bg-blue-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50',
        purple: 'from-purple-600 to-purple-700 shadow-purple-100 text-purple-600 bg-purple-50',
        green: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50'
    };
    const style = themes[theme] || themes.blue;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');

    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-3xl font-black text-gray-900 tracking-tight ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                    <div className={`flex items-center gap-1.5 py-1 px-2 ${bgColor} rounded-lg w-fit`}>
                        <ArrowRight className={`w-3 h-3 ${textColor}`} />
                        <span className={`text-[10px] font-black uppercase ${textColor}`}>{desc}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};
