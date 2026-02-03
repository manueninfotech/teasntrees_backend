import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, ChevronRight, User } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// --- Components ---

const StatCardSkeleton = () => (
    <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm h-[140px] animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="w-16 h-6 rounded-full bg-gray-100" />
        </div>
        <div className="h-8 w-24 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
    </div>
);

const OrderItemSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-100" />
            <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
        </div>
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
    </div>
);

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="glass-card p-6 relative overflow-hidden group bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-${color}-500/10`} />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${color}-50 text-${color}-600 border border-${color}-100`}>
                    {change}
                </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
        </div>
    </motion.div>
);

const OrderItem = ({ order }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_-4px_rgba(0,166,126,0.12)] hover:border-brand-primary/20 transition-all duration-300 cursor-pointer"
    >
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-primary rounded-r-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-700 font-bold border border-gray-100 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-primary tracking-wide bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/10">
                        {order.orderNumber || `#${order._id?.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-xs text-gray-500 font-medium">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {order.customerId?.name || 'Guest Customer'}
                </h4>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1 pl-6">
                    {order.items?.length || 0} items • <span className="text-gray-900 font-bold">₹{order.total}</span>
                </p>
            </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm
                ${order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    order.status === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        order.status === 'ready' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {order.status}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-brand-primary transition-colors font-medium">
                View Details <ChevronRight className="w-3 h-3" />
            </div>
        </div>
    </motion.div>
);

const RecentOrders = ({ orders, loading }) => (
    <div className="glass-card p-6 h-[500px] flex flex-col bg-white border border-gray-100 shadow-sm col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Live Orders</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                    </span>
                    <p className="text-xs font-medium text-gray-500">Real-time feed</p>
                </div>
            </div>
            <button className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-4 py-2.5 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-brand-primary/25">
                View All Orders
            </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2 relative z-10">
            {loading ? (
                <>
                    <OrderItemSkeleton />
                    <OrderItemSkeleton />
                    <OrderItemSkeleton />
                </>
            ) : (
                <AnimatePresence mode="popLayout">
                    {orders && orders.length > 0 ? (
                        orders.map((order) => (
                            <OrderItem key={order._id || order.id} order={order} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center opacity-50"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">No active orders</p>
                            <p className="text-xs text-gray-500 mt-1">New orders will pop up here instantly</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    </div>
);

// --- Main Component ---

const DashboardHome = () => {
    const { socket, isConnected } = useSocket();
    const { token } = useAuth();

    // 1. Initialize with COMPLETE DEFAULT OBJECT (No nulls)
    const [stats, setStats] = useState({
        overview: { salesToday: 0, ordersToday: 0, pendingOrders: 0 },
        riders: { list: [], active: 0, online: 0 },
        inventory: { lowStock: 0 },
        recentOrders: []
    });

    // 2. Explicit Loading State for initial fetch
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Initial Fetch
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/manager/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch initial stats:", err);
            } finally {
                // Ensure loading is set to false regardless of success/fail
                setIsLoading(false);
            }
        };

        if (token) fetchStats();
        // If no token (unlikely in this protected route), we might want to ensure 'isLoading' goes false eventually or redirect.
        // But for now, user flow guarantees token.
    }, [token]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        // 1. New Order (Optimistic)
        socket.on('order:new', (newOrder) => {
            console.log("New Order Received:", newOrder);
            setStats(prev => {
                // Prevent duplicate orders
                if (prev.recentOrders.some(o => o._id === newOrder._id)) return prev;

                return {
                    ...prev,
                    overview: {
                        ...prev.overview,
                        ordersToday: (prev.overview.ordersToday || 0) + 1,
                        pendingOrders: (prev.overview.pendingOrders || 0) + 1,
                        salesToday: (prev.overview.salesToday || 0) + (newOrder.total || 0)
                    },
                    recentOrders: [newOrder, ...prev.recentOrders].slice(0, 10)
                };
            });
        });

        // 2. Rider Online (Optimistic)
        socket.on('rider:online', (data) => {
            console.log("Rider Online:", data);
            setStats(prev => {
                // Add rider to list if not present
                const exists = prev.riders.list.some(r => r._id === data.riderId);
                let newList = prev.riders.list;
                if (!exists && data.name) {
                    newList = [{ _id: data.riderId, name: data.name, isOnline: true }, ...prev.riders.list];
                } else if (exists) {
                    // Update online status
                    newList = prev.riders.list.map(r => r._id === data.riderId ? { ...r, isOnline: true } : r);
                }

                return {
                    ...prev,
                    riders: {
                        ...prev.riders,
                        online: prev.riders.online + (exists ? 0 : 1), // Only increment if new? Or if formerly offline?
                        // Simplified: Just increment for now or trust the list length
                        list: newList
                    }
                }
            })
            // Background Re-fetch to sync counts perfectly
            delayedRefetch();
        });

        // 3. Rider Offline (Optimistic)
        socket.on('rider:offline', (data) => {
            console.log("Rider Offline:", data);
            setStats(prev => ({
                ...prev,
                riders: {
                    ...prev.riders,
                    // Mark as offline in list
                    list: prev.riders.list.map(r => r._id === data.riderId ? { ...r, isOnline: false } : r),
                    online: Math.max(0, prev.riders.online - 1)
                }
            }));
            delayedRefetch();
        });

        const delayedRefetch = () => {
            setTimeout(() => {
                fetch('http://localhost:5000/api/manager/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()).then(data => {
                    if (data.success) setStats(data.data);
                }).catch(e => console.error(e));
            }, 2000); // 2 second delay to safely sync
        }

        return () => {
            socket.off('order:new');
            socket.off('rider:online');
            socket.off('rider:offline');
        };
    }, [socket, token]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!isConnected && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-600 font-medium">Connecting to Live Stream...</span>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-500">Overview</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-3xl font-mono text-gray-900 tracking-tight">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Revenue" value={`₹${stats.overview.salesToday || 0}`} change="Today" icon={TrendingUp} color="emerald" />
                        <StatCard title="Orders Today" value={stats.overview.ordersToday || 0} change="Today" icon={ShoppingBag} color="blue" />
                        <StatCard title="Pending" value={stats.overview.pendingOrders || 0} change="Action Needed" icon={Clock} color="purple" />
                        <StatCard title="Low Stock" value={stats.inventory?.lowStock || 0} change="Items" icon={AlertTriangle} color="red" />
                    </>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <RecentOrders orders={stats.recentOrders} loading={isLoading} />

                {/* Side Widget (Riders) */}
                <div className="glass-card p-6 h-[500px] bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Riders</h2>
                        <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                            {stats.riders.online || 0} Online
                        </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar pr-2">
                        {isLoading ? (
                            // Rider Skeletons
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                        <div className="w-10 h-10 rounded-full bg-gray-100" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-20 bg-gray-100 rounded" />
                                            <div className="h-2 w-16 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            stats.riders.list && stats.riders.list.length > 0 ? (
                                stats.riders.list.map((rider) => (
                                    <div key={rider._id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold border border-gray-100 shadow-sm">
                                                {rider.name ? rider.name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{rider.name || 'Unknown Rider'}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${rider.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {rider.isOnline ? 'Online' : 'Offline'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ring-4 ring-white ${rider.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                    <p className="text-sm">No active riders</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
