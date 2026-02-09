import { useState, useEffect } from 'react';
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
                <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/50 backdrop-blur-md z-10 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[1.8rem] bg-gray-50 flex items-center justify-center text-gray-400 text-3xl font-black uppercase tracking-tighter shadow-inner border border-gray-100">
                            {customer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] leading-none mb-1 block">Customer Info</span>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{customer.name}</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                Member since {new Date(customer.createdAt).getFullYear()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Contact Info Header */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 leading-none">Contact Info</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-black text-gray-800 tracking-tight">
                                    <Phone className="w-4 h-4 text-emerald-600" />
                                    <span>+91 {customer.mobile}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-3 text-sm font-black text-gray-800 tracking-tight truncate">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center justify-between group">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Total Orders</p>
                                    <p className="text-2xl font-black text-gray-900 tracking-tighter">{orders.length}</p>
                                </div>
                                <ShoppingBag className="w-8 h-8 text-emerald-200 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-8 bg-black rounded-[2.5rem] text-white shadow-xl shadow-gray-200 flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Total Spent</p>
                            <p className="text-5xl font-black tracking-tighter">₹{totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-600/20 transition-all duration-700" />
                        <CreditCard className="w-16 h-16 text-white/10 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                    </div>

                    {/* Order History */}
                    <div>
                        <h3 className="text-[10px] font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <Clock className="w-5 h-5" /> Past Orders
                        </h3>
                        {orders.length === 0 ? (
                            <div className="p-12 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No past orders found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div
                                        key={order._id}
                                        onClick={() => onOrderClick(order)}
                                        className="p-5 bg-white border border-gray-100 rounded-[1.8rem] hover:border-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/5 transition-all flex justify-between items-center group cursor-pointer border-2"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">#{order.orderNumber || order._id?.slice(-4).toUpperCase()}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                                                        ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}
                                                    `}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                    {order.items?.length || 0} Items
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-gray-900 tracking-tighter group-hover:text-emerald-600 transition-colors">₹{order.total}</p>
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
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                ...(searchQuery && { search: searchQuery })
            });
            const res = await fetch(`http://localhost:5000/api/manager/customers?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCustomers(data.data.customers);
                setPagination(data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
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
                    const res = await fetch(`http://localhost:5000/api/manager/customers/${selectedCustomer._id}/orders`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
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
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Customers</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">View customer info and orders</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] border-2 border-gray-50 shadow-xl shadow-gray-200/50 flex items-center gap-4 max-w-2xl group focus-within:border-emerald-600/20 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-600 transition-colors">
                    <Search className="w-6 h-6" />
                </div>
                <input
                    type="text"
                    placeholder="SEARCH BY NAME, MOBILE OR EMAIL..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-300 font-black uppercase text-xs tracking-widest"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {customers.map(customer => (
                            <motion.div
                                key={customer._id}
                                layout
                                onClick={() => setSelectedCustomer(customer)}
                                className="bg-white p-6 rounded-[2.2rem] border-2 border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-emerald-600/10 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-gray-400 font-black text-2xl uppercase group-hover:scale-110 transition-transform duration-500 shadow-inner border border-gray-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100">
                                        {customer.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] leading-none mb-1 block">Customer</span>
                                        <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg leading-tight group-hover:text-emerald-600 transition-colors truncate">{customer.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5 leading-none">
                                            <Phone className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" /> +91 {customer.mobile}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">EST. {new Date(customer.createdAt).getFullYear()}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 pb-10">
                    <button
                        onClick={() => fetchCustomers(pagination.current - 1, search)}
                        disabled={pagination.current === 1}
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <div className="flex items-center px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-900">
                        Page {pagination.current} of {pagination.totalPages}
                    </div>

                    <button
                        onClick={() => fetchCustomers(pagination.current + 1, search)}
                        disabled={pagination.current === pagination.totalPages}
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm flex items-center gap-2"
                    >
                        Next <ChevronRight className="w-4 h-4" />
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
