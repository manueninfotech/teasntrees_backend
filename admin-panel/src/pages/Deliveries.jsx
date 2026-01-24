import React, { useState, useEffect } from 'react';
import {
    Truck, Package, User, Bike, Clock,
    CheckCircle2, XCircle, Search, Filter,
    RefreshCw, Eye, Calendar, MapPin, TrendingUp
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import DeliveryDetailsModal from '../components/DeliveryDetailsModal';

const Deliveries = () => {
    const { socket } = useSocket();
    const [deliveries, setDeliveries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchDeliveries();
    }, [page, statusFilter]);

    useEffect(() => {
        if (!socket) return;

        socket.on('delivery:status-updated', (data) => {
            console.log('Delivery Update Received:', data);
            fetchStats();
            fetchDeliveries();
        });

        socket.on('order:status-updated', (data) => {
            console.log('Order Update Received:', data);
            fetchStats();
            fetchDeliveries();
        });

        return () => {
            socket.off('delivery:status-updated');
            socket.off('order:status-updated');
        };
    }, [socket, statusFilter]); // statusFilter included to ensure fresh data for current view

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const response = await api.get('/admin/deliveries/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 10,
                sortBy: 'createdAt',
                order: 'desc'
            });
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await api.get(`/admin/deliveries?${params.toString()}`);
            if (response.data.success) {
                setDeliveries(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'picked_up': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'in_transit': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'failed': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'assigned': return <Clock className="w-3 h-3" />;
            case 'picked_up': return <Package className="w-3 h-3" />;
            case 'in_transit': return <Truck className="w-3 h-3" />;
            case 'delivered': return <CheckCircle2 className="w-3 h-3" />;
            case 'failed': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const handleViewDetails = (delivery) => {
        setSelectedDelivery(delivery);
        setShowModal(true);
    };

    const filteredDeliveries = deliveries.filter(d =>
        d.orderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.riderId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Tracking</h1>
                    <p className="text-gray-500 mt-1">Monitor real-time delivery status and rider performance</p>
                </div>
                <button
                    onClick={() => { fetchStats(); fetchDeliveries(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                >
                    <RefreshCw className={`w-4 h-4 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
                    Refresh Data
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Active Deliveries"
                    value={stats?.activeDeliveries || 0}
                    icon={Truck}
                    theme="indigo"
                    desc="Currently on road"
                />
                <StatCard
                    label="Completed Today"
                    value={stats?.completedDeliveries || 0}
                    icon={CheckCircle2}
                    theme="emerald"
                    desc="Successfully delivered"
                />
                <StatCard
                    label="Total Earnings"
                    value={`₹${stats?.totalEarnings || 0}`}
                    icon={TrendingUp}
                    theme="amber"
                    desc="Rider commissions"
                />
                <StatCard
                    label="Failed/Delayed"
                    value={stats?.failedDeliveries || 0}
                    icon={XCircle}
                    theme="rose"
                    desc="Needs attention"
                />
            </div>

            {/* Filters & Actions */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Order #, Customer, or Rider..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap border ${statusFilter === status
                                ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100'
                                : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Delivery Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                <th className="px-8 py-5">Delivery Details</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Rider</th>
                                <th className="px-8 py-5">Location</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-sans">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-12 bg-gray-50 rounded-2xl w-48"></div></td>
                                        <td className="px-8 py-6"><div className="h-8 bg-gray-50 rounded-full w-24"></div></td>
                                        <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-32"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 bg-gray-50 rounded w-16"></div></td>
                                        <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-10 float-right"></div></td>
                                    </tr>
                                ))
                            ) : filteredDeliveries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Truck className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <p className="text-gray-500 font-bold">No deliveries found</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase font-black">Try changing filters or search terms</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeliveries.map((delivery) => (
                                    <tr key={delivery._id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                                    #{delivery.orderId?.orderNumber?.slice(-4) || '---'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{delivery.customerId?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight border ${getStatusColor(delivery.status)}`}>
                                                {getStatusIcon(delivery.status)}
                                                {delivery.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white transition-colors border border-transparent group-hover:border-indigo-100">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">{delivery.riderId?.name || 'Unassigned'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {delivery.currentLocation?.coordinates ? 'Live' : 'Last Station'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleViewDetails(delivery)}
                                                className="p-3 bg-gray-100 hover:bg-black hover:text-white text-gray-500 rounded-2xl transition-all shadow-sm border border-transparent hover:-translate-y-1 active:scale-95"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-8 border-t border-gray-50 flex items-center justify-center bg-gray-50/30">
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-2xl text-xs font-black transition-all shadow-sm ${page === p
                                        ? 'bg-black text-white shadow-lg scale-110'
                                        : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Details Modal */}
            <DeliveryDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                delivery={selectedDelivery}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
        rose: 'from-rose-600 to-rose-700 shadow-rose-100 text-rose-600 bg-rose-50'
    };

    const style = themes[theme] || themes.indigo;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');

    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-[0.03] rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`}></div>

            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 py-1 px-2 ${bgColor} rounded-lg w-fit transition-all group-hover:translate-x-1`}>
                        <TrendingUp className={`w-3 h-3 ${textColor}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${textColor}`}>{desc}</span>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all duration-300`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};

export default Deliveries;
