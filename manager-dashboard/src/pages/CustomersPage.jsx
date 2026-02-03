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
    MapPin,
    X,
    Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CustomerDetailsModal = ({ customer, onClose, orders }) => {
    if (!customer) return null;

    // Calculate Stats
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const lastOrder = orders.length > 0 ? orders[0] : null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            {/* Slide-over Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-2xl font-bold">
                            {customer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{customer.name}</h2>
                            <p className="text-sm text-gray-500">Customer since {new Date(customer.createdAt).getFullYear()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.mobile}</span>
                            </div>
                            {customer.email && (
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                            <p className="text-2xl font-bold text-emerald-600">₹{totalSpent.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Order History</h3>
                        {orders.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No orders yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.map(order => (
                                    <div key={order._id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-900">#{order.orderNumber}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                                    ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
                                                `}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                                <span className="mx-1">•</span>
                                                {order.items?.length || 0} items
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">₹{order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const CustomersPage = () => {
    const { token } = useAuth();

    // State
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current: 1, totalPages: 1 });

    // Selected Customer & their orders
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

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
    }, [search, token]);

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
    }, [selectedCustomer, token]);

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 text-sm">Manage users and view history</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 max-w-2xl">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, mobile, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
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
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                        {customer.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{customer.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {customer.mobile}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary transition-colors" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Joined {new Date(customer.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination controls could go here */}

            {/* Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <CustomerDetailsModal
                        customer={selectedCustomer}
                        orders={customerOrders}
                        onClose={() => setSelectedCustomer(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomersPage;
