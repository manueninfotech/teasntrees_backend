import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    ShoppingBag,
    ChefHat,
    MapPin,
    Phone,
    Filter,
    XCircle,
    Package,
    Navigation,
    UserCheck,
    ClipboardCheck,
    Search,
    ChevronDown,
    Check
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../context/RefreshContext';

// --- Kanban Column Utilities ---
const COLUMNS = [
    { id: 'pending', label: 'Pending', icon: AlertCircle, color: 'amber' },
    { id: 'confirmed', label: 'Confirmed', icon: ClipboardCheck, color: 'blue' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'orange' },
    { id: 'ready', label: 'Ready', icon: Package, color: 'emerald' },
    { id: 'waiting_for_rider', label: 'Waiting for Rider', icon: Navigation, color: 'cyan' },
    { id: 'assigned', label: 'Assigned', icon: UserCheck, color: 'cyan' },
    { id: 'out-for-delivery', label: 'Out for Delivery', icon: Truck, color: 'purple' },
    { id: 'in_transit', label: 'In Transit', icon: Navigation, color: 'violet' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
];

// --- Order Card Component ---
const OrderCard = ({ order, onUpdateStatus }) => {
    const timeElapsed = Math.floor((new Date() - new Date(order.createdAt)) / 60000);

    const findColumn = (status) => COLUMNS.find(c => c.id === status) || { color: 'gray', icon: AlertCircle };
    const col = findColumn(order.status);
    const color = col.color;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-3xl bg-white border shadow-sm hover:shadow-md transition-all relative overflow-hidden group mb-4
                ${order.status === 'pending' ? 'border-amber-100 bg-amber-50/10' : 'border-gray-100/60 hover:border-emerald-500/30'}
            `}
        >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500 opacity-70`} />

            {/* Header: ID and Time */}
            <div className="flex justify-between items-start mb-3">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                        {order.orderNumber || `#${order._id?.slice(-4).toUpperCase()}`}
                    </span>
                    <h4 className="text-[13px] font-bold text-gray-800 tracking-tight leading-tight mt-1">
                        {order.customerId?.name || 'GUEST USER'}
                    </h4>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500/70 bg-gray-50/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" />
                    {timeElapsed}m ago
                </div>
            </div>

            {/* Items List - Clean & Breathable */}
            <div className="mb-4">
                <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                    {order.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-[9px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100/50">
                            {item.quantity} × {item.productName}
                        </span>
                    ))}
                    {order.items.length > 3 && (
                        <span className="text-[9px] font-medium text-gray-400 px-1 py-1">+{order.items.length - 3} more</span>
                    )}
                </div>
            </div>

            {/* Footer: Price and Rider */}
            <div className="flex items-center justify-between pt-1 mb-4 border-t border-gray-50/60">
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <p className="text-base font-extrabold text-gray-900 leading-none">₹{order.total}</p>
                </div>
                {order.riderId && (
                    <div className="flex items-center gap-1.5 bg-emerald-50/40 px-2.5 py-1.5 rounded-xl border border-emerald-100/30">
                        <UserCheck className="w-3 h-3 text-emerald-600/80" />
                        <span className="text-[9px] font-bold text-emerald-800/80 uppercase tracking-tight">{order.riderId.name?.split(' ')[0]}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div>
                {['pending', 'confirmed', 'preparing', 'ready'].includes(order.status) ? (
                    <button
                        onClick={() => {
                            const nextMap = {
                                'pending': 'confirmed',
                                'confirmed': 'preparing',
                                'preparing': 'ready',
                                'ready': 'waiting_for_rider'
                            };
                            onUpdateStatus(order._id, nextMap[order.status]);
                        }}
                        className={`w-full py-2.5 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2
                            ${order.status === 'pending' ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' :
                                order.status === 'confirmed' ? 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600' :
                                    order.status === 'preparing' ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' :
                                        'bg-cyan-600 text-white shadow-cyan-100 hover:bg-cyan-700'}
                        `}
                    >
                        {order.status === 'pending' && <><ClipboardCheck className="w-3.5 h-3.5" /> Confirm</>}
                        {order.status === 'confirmed' && <><ChefHat className="w-3.5 h-3.5" /> Prepare</>}
                        {order.status === 'preparing' && <><Package className="w-3.5 h-3.5" /> Ready</>}
                        {order.status === 'ready' && <><Navigation className="w-3.5 h-3.5" /> Call Rider</>}
                    </button>
                ) : (
                    <div className="w-full py-2.5 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2">
                        {col.icon && <col.icon className="w-3 h-3 text-gray-300" />}
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">{col.label}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// --- Main Kanban Board ---
const OrdersPage = () => {
    const { socket } = useSocket();
    const { token } = useAuth();
    const { tick } = useRefresh();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleStages, setVisibleStages] = useState(COLUMNS.map(c => c.id));
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Fetch Initial Orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Fetch ALL orders (limit 100 for now to ensure we see them spread out)
                const res = await fetch('http://localhost:5000/api/manager/orders?limit=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setOrders(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token, tick]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('order:new', (newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
        });

        socket.on('order:status_update', (updatedOrder) => {
            // Update local state based on socket event
            setOrders(prev => prev.map(o => o._id === updatedOrder.orderId
                ? { ...o, status: updatedOrder.status, ...updatedOrder } // Merge in case full object or just partial
                : o
            ));
            // If the event provided full object use distinct ID check if available
            if (updatedOrder._id) {
                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            }
        });

        return () => {
            socket.off('order:new');
            socket.off('order:status_update');
        };
    }, [socket]);

    // Update Handler
    const handleUpdateStatus = async (orderId, status) => {
        // Optimistic Update
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));

        try {
            await fetch(`http://localhost:5000/api/manager/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
        } catch (err) {
            console.error("Failed to update status", err);
            // Revert on failure logic could go here
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const filteredOrders = orders.filter(o => {
        const matchesSearch =
            (o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (o.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const activeColumns = COLUMNS.filter(col => visibleStages.includes(col.id));

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Live Orders</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Track order progress here</p>
                </div>

                <div className="flex gap-3 items-center flex-1 max-w-2xl justify-end">
                    {/* Search Bar */}
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Order ID / Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all shadow-sm"
                        />
                    </div>

                    {/* Filter Stages Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:shadow-lg transition-all shadow-sm active:scale-95"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Stages ({visibleStages.length}/{COLUMNS.length})</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showFilterDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-50 z-[100] max-h-[400px] overflow-hidden flex flex-col"
                                >
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter Stages</span>
                                            <button
                                                onClick={() => setVisibleStages(visibleStages.length === COLUMNS.length ? [] : COLUMNS.map(c => c.id))}
                                                className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700"
                                            >
                                                {visibleStages.length === COLUMNS.length ? 'Clear All' : 'Select All'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {COLUMNS.map(col => (
                                            <button
                                                key={col.id}
                                                onClick={() => {
                                                    setVisibleStages(prev =>
                                                        prev.includes(col.id)
                                                            ? prev.filter(id => id !== col.id)
                                                            : [...prev, col.id]
                                                    );
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${visibleStages.includes(col.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-500'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${visibleStages.includes(col.id) ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                                        <col.icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{col.label}</span>
                                                </div>
                                                {visibleStages.includes(col.id) && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 bg-gray-50/30 rounded-xl border border-gray-100">
                {/* 
                   Width Calculation: 
                   12 columns * 280px min-width = ~3360px. 
                */}
                <div className="flex h-full min-w-max p-2 gap-3" style={{ minWidth: `${activeColumns.length * 280}px` }}>
                    {activeColumns.map(col => {
                        // Strict filtering: Only show orders exactly matching the column ID
                        // This ensures every stage is distinct as requested
                        const colOrders = filteredOrders.filter(o => o.status === col.id);

                        return (
                            <div key={col.id} className="flex-1 flex flex-col min-w-[280px] bg-gray-50/50 rounded-xl border border-gray-200/60 h-full">
                                {/* Column Header */}
                                <div className={`p-5 border-b-2 border-gray-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10 shadow-sm`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl bg-${col.color}-50 text-${col.color}-600 shadow-sm border border-${col.color}-100`}>
                                            <col.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-black text-gray-900 uppercase tracking-widest text-[11px] leading-none">{col.label}</span>
                                    </div>
                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border-2 border-${col.color}-100 bg-${col.color}-50 text-${col.color}-600 shadow-sm`}>
                                        {colOrders.length}
                                    </span>
                                </div>

                                {/* Column Content */}
                                <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                                    <AnimatePresence mode="popLayout">
                                        {colOrders.map(order => (
                                            <OrderCard
                                                key={order._id}
                                                order={order}
                                                onUpdateStatus={handleUpdateStatus}
                                            />
                                        ))}
                                    </AnimatePresence>

                                    {colOrders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-24 text-gray-300">
                                            <div className="w-1 h-1 bg-gray-300 rounded-full mb-1" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
