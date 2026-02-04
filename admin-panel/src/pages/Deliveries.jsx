import { useState, useEffect } from 'react';
import {
    Truck, Package, User, Bike, Clock,
    CheckCircle2, XCircle, Search, Filter,
    RefreshCw, Eye, Calendar, MapPin, TrendingUp, ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import DeliveryDetailsModal from '../components/DeliveryDetailsModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse p-8">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
        ))}
    </div>
);

const Deliveries = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['deliveries-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/deliveries/stats');
            const data = response.data.data;
            localStorage.setItem('deliveries-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('deliveries-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Deliveries
    const { data: deliveryData, isLoading: loading, isFetching: deliveriesFetching, refetch: refetchDeliveries } = useQuery({
        queryKey: ['deliveries', page, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 10, sortBy: 'createdAt', order: 'desc' });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const response = await api.get(`/admin/deliveries?${params.toString()}`);
            const data = response.data;
            const cacheKey = `deliveries-cache-${page}-${statusFilter}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cacheKey = `deliveries-cache-${page}-${statusFilter}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const isSyncing = deliveriesFetching;

    const handleSync = () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries-stats'] });
        refetchDeliveries();
    };

    const deliveries = deliveryData?.data || [];
    const totalPages = deliveryData?.pagination?.totalPages || 1;

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['deliveries-stats'] });
            queryClient.invalidateQueries({ queryKey: ['deliveries'] });
        };
        socket.on('delivery:status-updated', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        return () => {
            socket.off('delivery:status-updated', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
        };
    }, [socket, queryClient]);

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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Delivery Tracking</h1>
                    <p className="text-gray-500 mt-1 font-bold">Track deliveries and riders in real-time</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Fleet'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Live Missions" value={stats?.activeDeliveries || 0} icon={Truck} theme="indigo" desc="Currently active" loading={statsLoading} />
                <StatCard label="Goals Reached" value={stats?.completedDeliveries || 0} icon={CheckCircle2} theme="emerald" desc="Landed today" loading={statsLoading} />
                <StatCard label="Fleet Revenue" value={`₹${stats?.totalEarnings || 0}`} icon={TrendingUp} theme="amber" desc="Total payouts" loading={statsLoading} />
                <StatCard label="Lost signals" value={stats?.failedDeliveries || 0} icon={XCircle} theme="rose" desc="Failed/Returned" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Rider, or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12 text-sm font-bold uppercase"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setPage(1); }}
                                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${statusFilter === status ? 'bg-black text-white border-transparent shadow-lg shadow-black/20' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/30">
                                    <th className="px-8 py-6">Order ID</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Rider</th>
                                    <th className="px-8 py-6">Location</th>
                                    <th className="px-8 py-6 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDeliveries.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center text-gray-200 font-black uppercase tracking-[0.2em]">Zero transmissions found</td>
                                    </tr>
                                ) : (
                                    filteredDeliveries.map((delivery) => (
                                        <tr key={delivery._id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform">#{delivery.orderId?.orderNumber?.slice(-4)}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-gray-900 uppercase mb-0.5">{delivery.customerId?.name || '---'}</p>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Initiated {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${getStatusColor(delivery.status)}`}>
                                                    {getStatusIcon(delivery.status)} {delivery.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center"><Bike className="w-3 h-3 text-gray-400" /></div>
                                                    <span className="text-xs font-black text-gray-700 uppercase">{delivery.riderId?.name || 'WAITING'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black uppercase text-[10px] text-gray-400 tracking-widest">
                                                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> LIVE SECTOR</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => handleViewDetails(delivery)} className="p-3 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-2xl transition-all shadow-sm">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {totalPages > 1 && (
                    <div className="p-6 bg-gray-50/20 border-t border-gray-50 flex justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 disabled:opacity-30"><ArrowRight className="w-5 h-5 rotate-180 text-gray-400" /></button>
                        <span className="bg-white px-6 py-3 rounded-2xl border border-gray-100 font-black text-[10px] text-gray-400 flex items-center tracking-widest uppercase">PAGE {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black text-white disabled:opacity-30"><ArrowRight className="w-5 h-5 text-white" /></button>
                    </div>
                )}
            </div>

            <DeliveryDetailsModal isOpen={showModal} onClose={() => setShowModal(false)} delivery={selectedDelivery} />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
        rose: 'from-rose-600 to-rose-700 shadow-rose-100 text-rose-600 bg-rose-50'
    };
    const style = themes[theme] || themes.indigo;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-3xl font-black text-gray-900 tracking-tighter ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                    <div className={`flex items-center gap-1 py-1 px-3 ${bgColor} rounded-full w-fit`}>
                        <ArrowRight className={`w-3 h-3 ${textColor}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${textColor}`}>{desc}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};

export default Deliveries;
