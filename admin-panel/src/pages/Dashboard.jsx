import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
    TrendingUp,
    ShoppingCart,
    Users,
    Package,
    Bike,
    DollarSign,
    ArrowUp,
    ArrowDown,
    Clock
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Revenue',
            value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`,
            icon: DollarSign,
            color: 'green',
            trend: '+12.5%',
            trendUp: true
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'blue',
            trend: '+8.2%',
            trendUp: true
        },
        {
            title: 'Active Customers',
            value: stats?.totalCustomers || 0,
            icon: Users,
            color: 'purple',
            trend: '+15.3%',
            trendUp: true
        },
        {
            title: 'Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            color: 'orange',
            trend: '+5',
            trendUp: true
        },
        {
            title: 'Active Riders',
            value: stats?.activeRiders || 0,
            icon: Bike,
            color: 'teal',
            trend: '3 online',
            trendUp: true
        },
        {
            title: 'Pending Orders',
            value: stats?.pendingOrders || 0,
            icon: Clock,
            color: 'red',
            trend: '-2',
            trendUp: false
        }
    ];

    const colorClasses = {
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-pink-500',
        orange: 'from-orange-500 to-amber-500',
        teal: 'from-teal-500 to-cyan-500',
        red: 'from-red-500 to-rose-500'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                                <div className="flex items-center gap-1">
                                    {stat.trendUp ? (
                                        <ArrowUp className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.trend}
                                    </span>
                                    <span className="text-sm text-gray-500">vs last month</span>
                                </div>
                            </div>
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <ShoppingCart className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Order #{1000 + i}</p>
                                        <p className="text-sm text-gray-500">2 items • ₹250</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Pending
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
                    <div className="space-y-3">
                        {['Masala Chai', 'Green Tea', 'Iced Coffee', 'Lemon Tea'].map((product, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{product}</p>
                                        <p className="text-sm text-gray-500">{120 - i * 20} sold</p>
                                    </div>
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}