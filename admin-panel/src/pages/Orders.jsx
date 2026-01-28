import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, Filter, Eye, Calendar, DollarSign, Clock, TrendingUp, User, MapPin, Package } from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderDetailsModal from '../components/OrderDetailsModal';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function Orders() {
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        paymentMethod: '',
        paymentStatus: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        limit: 12
    });
    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('order:new', (data) => {
                console.log('New order received:', data);
                fetchOrders(true); // Background refresh
                fetchStats(true); // Background refresh
            });

            socket.on('order:status-updated', (data) => {
                console.log('Order status updated:', data);
                fetchOrders(true); // Background refresh
                fetchStats(true); // Background refresh
            });

            return () => {
                socket.off('order:new');
                socket.off('order:status-updated');
            };
        }
    }, [socket]);

    useEffect(() => {
        fetchStats();

        // 30s polling fallback for stats (background refresh)
        const interval = setInterval(() => fetchStats(true), 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchOrders();

        // 30s polling fallback for orders (background refresh)
        const interval = setInterval(() => fetchOrders(true), 30000);
        return () => clearInterval(interval);
    }, [pagination.currentPage, filters, searchTerm]);

    const fetchStats = async (isBackground = false) => {
        try {
            const response = await api.get('/admin/orders/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchOrders = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit
            });

            if (filters.status) params.append('status', filters.status);
            if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/admin/orders?${params.toString()}`);
            setOrders(response.data.data || []);

            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination.totalPages || 1,
                    totalOrders: response.data.pagination.totalItems || 0
                }));
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setOrders([]);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const handleOrderUpdate = () => {
        fetchOrders(true);
        fetchStats(true);
        setShowDetailsModal(false);
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            paymentMethod: '',
            paymentStatus: '',
            startDate: '',
            endDate: ''
        });
        setSearchTerm('');
    };

    if (loading && !orders.length) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                    <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Orders</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalOrders || 0}</p>
                            </div>
                            <ShoppingBag className="w-12 h-12 text-blue-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Pending</p>
                                <p className="text-3xl font-bold mt-1">{stats.pendingOrders || 0}</p>
                            </div>
                            <Clock className="w-12 h-12 text-orange-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">In Progress</p>
                                <p className="text-3xl font-bold mt-1">{stats.inProgressOrders || 0}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-purple-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Today's Revenue</p>
                                <p className="text-3xl font-bold mt-1">₹{stats.todayRevenue || 0}</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-green-200" />
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order number or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="input"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="out-for-delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Payment Method Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                            className="input"
                        >
                            <option value="">All Methods</option>
                            <option value="COD">Cash on Delivery</option>
                            <option value="Online">Online Payment</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                            className="input"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="input"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>

                {/* Clear Filters */}
                {(filters.status || filters.paymentMethod || filters.paymentStatus || filters.startDate || filters.endDate || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        {/* Order Header */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                        </div>

                        {/* Order Content */}
                        <div className="p-4 space-y-3">
                            {/* Customer Info */}
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{order.customerId?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">{order.customerId?.mobile || ''}</p>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <p className="text-sm text-gray-600 line-clamp-2">{order.deliveryAddress?.address || 'N/A'}</p>
                            </div>

                            {/* Order Items */}
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-400" />
                                <p className="text-sm text-gray-600">{order.items?.length || 0} items</p>
                            </div>

                            {/* Payment Info */}
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Total Amount</span>
                                    <span className="text-lg font-bold text-green-600">₹{order.total}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Payment</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{order.paymentMethod}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.paymentStatus === 'refunded' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => handleViewDetails(order)}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {orders.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No orders found</p>
                    <p className="text-gray-400 text-sm mt-1">Orders will appear here once customers place them</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalOrders} total orders
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                            disabled={pagination.currentPage === 1}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                order={selectedOrder}
                onSuccess={handleOrderUpdate}
            />
        </div>
    );
}
