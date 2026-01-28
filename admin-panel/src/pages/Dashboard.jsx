import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    TrendingUp,
    ShoppingCart,
    Users,
    Package,
    Bike,
    DollarSign,
    Clock
} from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useSocket } from '../context/SocketContext';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { socket } = useSocket();
    const fetchTimeoutRef = useRef(null);
    const isSocketActive = useRef(false); // BLOCK FETCH DURING SOCKET

    const debounceFetch = () => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
            if (!isSocketActive.current) {
                fetchStats(true);
            }
        }, 8000); // 8s delay
    };

    useEffect(() => {
        console.log('🔌 Socket status:', socket ? 'CONNECTED' : 'NO SOCKET');

        if (socket) {
            socket.on('connect', () => console.log('✅ SOCKET CONNECTED'));
            socket.on('disconnect', () => console.log('❌ SOCKET DISCONNECTED'));
        }
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        // **INSTANT UPDATES - BLOCK FETCH**
        const handleUserRegistered = (data) => {
            console.log('🎉 USER REGISTERED:', data);
            isSocketActive.current = true;
            const isCustomer = !data?.role || data.role.toLowerCase().includes('customer');
            if (isCustomer) {
                setStats(prev => {
                    console.log('👆 BEFORE:', prev?.totalCustomers);
                    const newCount = (prev?.totalCustomers || 3) + 1;
                    console.log('➕ NEW COUNT:', newCount);
                    return {
                        ...prev,
                        totalCustomers: newCount
                    };
                });
            }
            setTimeout(() => { isSocketActive.current = false; }, 10000);
        };

        const handleUserDeleted = (data) => {
            console.log('🎉 USER DELETED:', data);
            isSocketActive.current = true;
            const isCustomer = !data?.role || data.role.toLowerCase().includes('customer');
            if (isCustomer) {
                setStats(prev => {
                    console.log('👆 BEFORE:', prev?.totalCustomers);
                    const newCount = Math.max((prev?.totalCustomers || 3) - 1, 0);
                    console.log('➖ NEW COUNT:', newCount);
                    return {
                        ...prev,
                        totalCustomers: newCount
                    };
                });
            }
            setTimeout(() => { isSocketActive.current = false; }, 10000);
        };

        const handleProductCreated = () => {
            console.log('🎉 PRODUCT CREATED');
            isSocketActive.current = true;
            setStats(prev => ({
                ...prev,
                totalProducts: (prev?.totalProducts || 240) + 1
            }));
            setTimeout(() => { isSocketActive.current = false; }, 10000);
        };

        const handleProductDeleted = () => {
            console.log('🎉 PRODUCT DELETED');
            isSocketActive.current = true;
            setStats(prev => ({
                ...prev,
                totalProducts: Math.max((prev?.totalProducts || 240) - 1, 0)
            }));
            setTimeout(() => { isSocketActive.current = false; }, 10000);
        };

        socket.on('user:registered', handleUserRegistered);
        socket.on('user:deleted', handleUserDeleted);
        socket.on('product:created', handleProductCreated);
        socket.on('product:deleted', handleProductDeleted);

        socket.on('order:new', (data) => {
            console.log('🛒 NEW ORDER');
            setStats(prev => ({
                ...prev,
                totalOrders: (prev?.totalOrders || 0) + 1,
                todayOrders: (prev?.todayOrders || 0) + 1,
                pendingOrders: (prev?.pendingOrders || 0) + 1,
                totalRevenue: (prev?.totalRevenue || 0) + (data.total || 0),
                todayRevenue: (prev?.todayRevenue || 0) + (data.total || 0),
                recentOrders: [{
                    _id: data.orderId,
                    orderNumber: data.orderNumber,
                    total: data.total || 0,
                    status: 'pending',
                    customerId: { name: data.customerName || 'Customer' },
                    items: []
                }, ...(prev?.recentOrders || [])].slice(0, 5)
            }));
            debounceFetch();
        });

        socket.on('order:status-updated', () => debounceFetch());
        socket.on('delivery:status-updated', () => debounceFetch());
        socket.on('product:updated', () => debounceFetch());

        return () => {
            socket.off('user:registered', handleUserRegistered);
            socket.off('user:deleted', handleUserDeleted);
            socket.off('product:created', handleProductCreated);
            socket.off('product:deleted', handleProductDeleted);
            socket.off('order:new');
            socket.off('order:status-updated');
            socket.off('delivery:status-updated');
            socket.off('product:updated');
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        };
    }, [socket]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => {
            if (!isSocketActive.current) {
                fetchStats(true);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        if (isSocketActive.current) {
            console.log('⏳ Socket active - skipping fetch');
            if (!isBackground) setLoading(false);
            return;
        }
        try {
            const response = await api.get('/admin/dashboard/stats');
            console.log('📊 Server stats:', response.data.data);
            setStats(response.data.data);
        } catch (error) {
            console.error('❌ Fetch failed:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { title: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'green', subtitle: `₹${stats?.todayRevenue || 0} today`, path: '/orders' },
        { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'blue', subtitle: `${stats?.todayOrders || 0} today`, path: '/orders' },
        { title: 'Active Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'purple', subtitle: 'Registered users', path: '/customers' },
        { title: 'Products', value: stats?.totalProducts || 0, icon: Package, color: 'orange', subtitle: 'In catalog', path: '/products' },
        { title: 'Active Riders', value: `${stats?.activeRiders || 0}/${stats?.totalRiders || 0}`, icon: Bike, color: 'teal', subtitle: 'Online now', path: '/riders' },
        { title: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, color: 'red', subtitle: 'Need attention', path: '/orders?status=pending' }
    ];

    const colorClasses = {
        green: 'from-green-500 to-emerald-500', blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-pink-500', orange: 'from-orange-500 to-amber-500',
        teal: 'from-teal-500 to-cyan-500', red: 'from-red-500 to-rose-500'
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} onClick={() => navigate(stat.path)} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer active:scale-95 group">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{stat.value}</h3>
                                <p className="text-sm text-gray-500">{stat.subtitle}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                        <button onClick={() => navigate('/orders')} className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
                    </div>
                    <div className="space-y-3">
                        {stats?.recentOrders?.length > 0 ? (
                            stats.recentOrders.map((order) => (
                                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate('/orders')}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                                            <p className="text-sm text-gray-500">{order.customerId?.name || 'Customer'} • {order.items?.length || 0} items • ₹{order.total}</p>
                                        </div>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">No recent orders</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
                        <button onClick={() => navigate('/products')} className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
                    </div>
                    <div className="space-y-3">
                        {stats?.topProducts?.length > 0 ? (
                            stats.topProducts.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate(`/products/${product._id}`)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Package className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.orderCount || 0} sold</p>
                                        </div>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">No products data</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
