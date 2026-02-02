import { useQuery } from '@tanstack/react-query';
import { dashboardService, ordersService } from '../services/managerService';
import { GlassCard } from '../components/ui/GlassCard';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import {
    TrendingUp,
    ShoppingCart,
    Clock,
    AlertTriangle,
    Users,
    Package
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';

export const DashboardHome = () => {
    // Fetch dashboard stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats,
    });

    // Fetch recent orders
    const { data: ordersData, isLoading: ordersLoading } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: () => ordersService.getOrders({ limit: 10, page: 1 }),
    });

    const stats = statsData?.data;
    const orders = ordersData?.data || [];

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="xl" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'Orders Today',
            value: stats?.overview?.ordersToday || 0,
            icon: ShoppingCart,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            title: 'Sales Today',
            value: formatCurrency(stats?.overview?.salesToday || 0),
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            title: 'Pending Orders',
            value: stats?.overview?.pendingOrders || 0,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            title: 'Delayed Orders',
            value: stats?.overview?.delayedOrders || 0,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
        },
        {
            title: 'Active Riders',
            value: stats?.riders?.active || 0,
            icon: Users,
            color: 'text-teal-600',
            bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        },
        {
            title: 'Low Stock',
            value: stats?.inventory?.lowStock || 0,
            icon: Package,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Welcome back! Here's what's happening today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((stat, index) => (
                    <GlassCard key={index} hover className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {stat.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Recent Orders */}
            <GlassCard>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Recent Orders
                    </h2>
                    <a
                        href="/orders"
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        View All →
                    </a>
                </div>

                {ordersLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No orders yet
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Order #
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Customer
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Total
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                            #{order.orderNumber || order._id.slice(-6)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                            {order.customerId?.name || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(order.total || 0)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge status={order.status}>{order.status}</Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {formatDateTime(order.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
