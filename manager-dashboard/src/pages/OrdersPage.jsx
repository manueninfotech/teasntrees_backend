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
    ClipboardCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// --- Kanban Column Utilities ---
// Exact mapping of all 11 statuses
const COLUMNS = [
    { id: 'pending', label: 'Pending', icon: AlertCircle, color: 'amber' },
    { id: 'confirmed', label: 'Confirmed', icon: ClipboardCheck, color: 'blue' },
    { id: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'indigo' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'orange' },
    { id: 'ready', label: 'Ready', icon: Package, color: 'emerald' },
    { id: 'assigned', label: 'Assigned', icon: UserCheck, color: 'cyan' },
    { id: 'picked_up', label: 'Picked Up', icon: ShoppingBag, color: 'teal' },
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
            className={`p-6 rounded-[2.2rem] bg-white border-2 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group mb-4
                ${order.status === 'pending' ? 'border-amber-200 bg-amber-50/20 ring-4 ring-amber-500/5' : 'border-gray-50 hover:border-emerald-600/20'}
            `}
        >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${color}-500 shadow-[2px_0_8px_rgba(0,0,0,0.05)]`} />

            {/* Header: ID and Time */}
            <div className="flex justify-between items-start mb-4 pl-2">
                <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {order.orderNumber || `#${order._id?.slice(-4).toUpperCase()}`}
                    </span>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">
                        {order.customerId?.name || 'GUEST USER'}
                    </h4>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-inner">
                    <Clock className="w-3 h-3" />
                    {timeElapsed}M AGO
                </div>
            </div>

            {/* Content: Summary and Price */}
            <div className="space-y-3 mb-6 pl-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest line-clamp-2 leading-relaxed">
                    {order.items.map(i => `${i.quantity}X ${i.productName || 'ITEM'}`).join(', ')}
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Amount</span>
                        <p className="text-xl font-black text-gray-900 tracking-tighter">₹{order.total}</p>
                    </div>
                    {order.riderId && (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">{order.riderId.name?.split(' ')[0]}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions: Bold Professional Controls */}
            <div className="pl-2">
                {['pending', 'confirmed', 'preparing', 'ready'].includes(order.status) ? (
                    <button
                        onClick={() => {
                            const nextMap = {
                                'pending': 'confirmed',
                                'confirmed': 'preparing',
                                'preparing': 'ready',
                                'ready': 'assigned'
                            };
                            onUpdateStatus(order._id, nextMap[order.status]);
                        }}
                        className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                            ${order.status === 'pending' ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' :
                                order.status === 'confirmed' ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600' :
                                    order.status === 'preparing' ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' :
                                        'bg-cyan-600 text-white shadow-cyan-200 hover:bg-cyan-700'}
                        `}
                    >
                        {order.status === 'pending' && <><ClipboardCheck className="w-4 h-4" /> Confirm Order</>}
                        {order.status === 'confirmed' && <><ChefHat className="w-4 h-4" /> Start Cooking</>}
                        {order.status === 'preparing' && <><Package className="w-4 h-4" /> Order Ready</>}
                        {order.status === 'ready' && <><Navigation className="w-4 h-4" /> Send to Rider</>}
                    </button>
                ) : (
                    <div className="w-full py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">With Rider</span>
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
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
    }, [token]);

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

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 mb-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Live Orders</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Track order progress here</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:shadow-lg transition-all">
                        <Filter className="w-5 h-5" /> Filter Stages
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-105 transition-all">
                        <ShoppingBag className="w-5 h-5" /> New Order
                    </button>
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 bg-gray-50/30 rounded-xl border border-gray-100">
                {/* 
                   Width Calculation: 
                   11 columns * 280px min-width = ~3080px. 
                   Set min-w to ensure they don't squash.
                */}
                <div className="flex h-full min-w-[3200px] p-2 gap-3">
                    {COLUMNS.map(col => {
                        // Strict filtering: Only show orders exactly matching the column ID
                        // This ensures every stage is distinct as requested
                        const colOrders = orders.filter(o => o.status === col.id);

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
