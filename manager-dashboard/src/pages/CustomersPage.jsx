import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    User,
    Phone,
    Mail,
    Calendar,
    ShoppingBag,
    ChevronRight,
    Clock,
    X,
    MapPin,
    Filter,
    CreditCard,
    ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';
import OrderDetailsModal from '../components/OrderDetailsModal';

const CustomerDetailsModal = ({ customer, onClose, orders, onOrderClick }) => {
    if (!customer) return null;

    // Calculate Stats
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white"
            >
                {/* Header */}
                <div className="p-10 border-b-2 border-gray-50 flex justify-between items-center sticky top-0 bg-white/70 backdrop-blur-xl z-10 transition-all">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-400 text-4xl font-black uppercase tracking-tighter shadow-inner border-2 border-gray-100 group-hover:bg-emerald-50 transition-all duration-500">
                            {customer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] leading-none mb-2 block">Client Profile</span>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{customer.name}</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Member since {new Date(customer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-5 hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-200 group">
                        <X className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Contact Info Header */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border-2 border-gray-100/50 shadow-inner">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 leading-none">Contact Details</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-[13px] font-black text-gray-800 tracking-tight">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span>+91 {customer.mobile}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-4 text-[13px] font-black text-gray-800 tracking-tight truncate">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border-2 border-emerald-100/30 shadow-sm flex items-center justify-between group overflow-hidden relative">
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1.5">Loyalty Status</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
                                        {orders.length} <span className="text-xs font-bold text-emerald-600/50 tracking-widest">ORDERS</span>
                                    </p>
                                </div>
                                <ShoppingBag className="w-12 h-12 text-emerald-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10 opacity-50" />
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-200/40 transition-all duration-700" />
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-10 bg-black rounded-[3rem] text-white shadow-2xl shadow-gray-300 flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Total Engagement</p>
                            <p className="text-6xl font-black tracking-tighter flex items-baseline gap-2">
                                <span className="text-2xl text-emerald-400">₹</span>
                                {totalSpent.toLocaleString()}
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-600/30 transition-all duration-700" />
                        <CreditCard className="w-20 h-20 text-white/10 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700" />
                    </div>

                    {/* Order History */}
                    <div className="pt-4">
                        <h3 className="text-[10px] font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-[0.3em]">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                <Clock className="w-4 h-4" />
                            </div>
                            Purchase History
                        </h3>
                        {orders.length === 0 ? (
                            <div className="p-16 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No purchase history found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div
                                        key={order._id}
                                        onClick={() => onOrderClick(order)}
                                        className="p-6 bg-white border-2 border-gray-50 rounded-[2.2rem] hover:border-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/5 transition-all flex justify-between items-center group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-500 shadow-inner">
                                                <ShoppingBag className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">#{order.orderNumber || '0000'}</span>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm
                                                        ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}
                                                    `}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                    {order.items?.length || 0} ITEMS
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900 tracking-tighter group-hover:text-emerald-600 transition-colors">₹{order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50 rounded-b-[2.5rem] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const CustomersPage = () => {
    const { token } = useAuth();
    const { tick } = useRefresh();

    // State
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const initialLoadRef = useRef(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current: 1, totalPages: 1 });

    // Selected Customer & their orders
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Order Details Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    // Fetch Customers
    const fetchCustomers = async (page = 1, searchQuery = '') => {
        if (initialLoadRef.current) {
            setLoading(true);
        }
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                ...(searchQuery && { search: searchQuery })
            });
            const res = await api.get(`/manager/customers?${params}`);
            const data = res.data;
            if (data.success) {
                setCustomers(data.data.customers);
                setPagination(data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
            initialLoadRef.current = false;
        }
    };

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(1, search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, token, tick]);

    // Fetch Customer Orders when selected
    useEffect(() => {
        if (selectedCustomer) {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const res = await api.get(`/manager/customers/${selectedCustomer._id}/orders`);
                    const data = res.data;
                    if (data.success) {
                        setCustomerOrders(data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch customer orders", err);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        } else {
            setCustomerOrders([]);
        }
    }, [selectedCustomer, token, tick]);

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Customers</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage your boutique's customer database</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-gray-200/50 flex items-center gap-6 group transition-all">
                <div className="flex-1 flex items-center gap-4 bg-white rounded-[1.8rem] p-4 border border-gray-100 focus-within:border-emerald-600 transition-all shadow-sm">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-300 font-bold"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="bg-emerald-600 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 shadow-lg shadow-emerald-200/50">
                        <User className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white leading-none">
                            {pagination.totalResults || customers.length} Clients
                        </span>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <User className="w-12 h-12 mb-3 opacity-20" />
                        <p>No customers found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {customers.map(customer => (
                            <div
                                key={customer._id}
                                onClick={() => setSelectedCustomer(customer)}
                                className="card group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105 duration-500">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tight">{customer.name}</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mt-1">
                                                Since {new Date(customer.createdAt).getFullYear()}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors mt-2" />
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-gray-500 bg-gray-50/50 p-4 rounded-2xl transition-all group-hover:bg-white border border-transparent group-hover:border-emerald-100 shadow-inner group-hover:shadow-none">
                                        <Phone className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-bold">{customer.mobile}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 bg-gray-50/50 p-4 rounded-2xl transition-all group-hover:bg-white border border-transparent group-hover:border-emerald-100 shadow-inner group-hover:shadow-none">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold truncate">{customer.email || 'No email provided'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                            {customer.totalOrders || 0} Orders
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-12 pb-12">
                    <button
                        onClick={() => fetchCustomers(pagination.current - 1, search)}
                        disabled={pagination.current === 1}
                        className="px-8 py-4 bg-white/50 backdrop-blur-md border-2 border-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-emerald-600 hover:border-emerald-600/20 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm flex items-center gap-3 group active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Previous
                    </button>

                    <div className="flex items-center px-8 py-4 bg-white/80 backdrop-blur-md border-2 border-gray-50 rounded-2xl shadow-inner text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 border-emerald-100/30">
                        Page <span className="mx-2 text-emerald-600">{pagination.current}</span> of {pagination.totalPages}
                    </div>

                    <button
                        onClick={() => fetchCustomers(pagination.current + 1, search)}
                        disabled={pagination.current === pagination.totalPages}
                        className="px-8 py-4 bg-white/50 backdrop-blur-md border-2 border-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-emerald-600 hover:border-emerald-600/20 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm flex items-center gap-3 group active:scale-95"
                    >
                        Next <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <CustomerDetailsModal
                        customer={selectedCustomer}
                        orders={customerOrders}
                        onClose={() => setSelectedCustomer(null)}
                        onOrderClick={(order) => {
                            setSelectedOrder(order);
                            setIsOrderModalOpen(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Order Details Modal Overlay */}
            <OrderDetailsModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                order={selectedOrder}
                token={token}
            />
        </div>
    );
};

export default CustomersPage;
