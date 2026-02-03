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

    // Determine color based on status for the strip
    const getColor = (status) => {
        const col = COLUMNS.find(c => c.id === status);
        return col ? col.color : 'gray';
    };

    const color = getColor(order.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group mb-3
                ${order.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : ''}
            `}
        >
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500`} />

            {/* Header */}
            <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                    <span className="text-xs font-bold text-gray-500">#{order.orderNumber}</span>
                    <h4 className="text-sm font-bold text-gray-900">{order.customerId?.name || 'Guest'}</h4>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {timeElapsed}m
                </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-1 mb-4 pl-2">
                <p className="text-xs text-gray-600 line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.productName || 'Item'}`).join(', ')}
                </p>
                <p className="text-sm font-bold text-gray-900">₹{order.total}</p>
            </div>

            {/* Rider Info (Visible if assigned) */}
            {order.riderId && (
                <div className="flex items-center gap-2 mb-3 pl-2 bg-gray-50 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Rider</p>
                        <p className="text-xs font-bold text-gray-800">{order.riderId.name || 'Unknown'}</p>
                    </div>
                </div>
            )}

            {/* Actions - Context Aware */}
            <div className="flex gap-2 pl-2">
                {/* Manager Workflow Actions */}
                {order.status === 'pending' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'confirmed')}
                        className="flex-1 text-xs font-bold py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Confirm
                    </button>
                )}
                {order.status === 'confirmed' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'preparing')}
                        className="flex-1 text-xs font-bold py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Cook
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'ready')}
                        className="flex-1 text-xs font-bold py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                        Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <button
                        // Ideally opens a modal to assign rider, but for now just a placeholder or manual status push if testing
                        onClick={() => onUpdateStatus(order._id, 'assigned')} // Just for flow testing
                        className="flex-1 text-xs font-bold py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                    >
                        Assign
                    </button>
                )}

                {/* Rider Managed Stages - Read Only Indicator */}
                {['assigned', 'picked_up', 'out-for-delivery', 'in_transit'].includes(order.status) && (
                    <div className="flex-1 text-[10px] text-center font-medium text-gray-400 italic py-1">
                        Waiting for Rider Update...
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
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-500 text-sm">Full Lifecycle View</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90">
                        <ShoppingBag className="w-4 h-4" /> New Order
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
                                <div className={`p-3 border-b border-gray-200/60 flex justify-between items-center bg-gray-100/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md bg-${col.color}-100 text-${col.color}-700`}>
                                            <col.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-${col.color}-200 bg-${col.color}-50 text-${col.color}-600`}>
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
