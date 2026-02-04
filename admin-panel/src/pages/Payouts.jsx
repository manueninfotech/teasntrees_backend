import { useState } from 'react';
import {
    Wallet, IndianRupee, Clock, CheckCircle2,
    ArrowRight, Loader2, RefreshCw, AlertCircle,
    User, Bike, Calendar
} from 'lucide-react';
import api from '../utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse p-8">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
        ))}
    </div>
);

const Payouts = () => {
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState(null);
    const [notification, setNotification] = useState(null);

    const { data: stats = [], isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['payouts-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/payouts/stats');
            const data = response.data.data || [];
            localStorage.setItem('payouts-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('payouts-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    const isSyncing = isFetching;

    const handleProcessPayout = async (riderId) => {
        setProcessingId(riderId);
        try {
            const response = await api.post('/admin/payouts/process', { riderId });
            if (response.data.success) {
                showNotification('success', response.data.message);
                queryClient.invalidateQueries({ queryKey: ['payouts-stats'] });
            }
        } catch (error) {
            console.error('Error processing payout:', error);
            showNotification('error', error.response?.data?.message || 'Failed to process payout');
        } finally {
            setProcessingId(null);
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const totalUnpaid = stats.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const activeRiders = stats.length;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Rider Payments</h1>
                    <p className="text-gray-500 mt-1 font-bold">Manage payments and earnings for riders</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Treasury'}
                </button>
            </div>

            {notification && (
                <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top duration-300 shadow-xl ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    <div className={`p-2 rounded-xl ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <p className="text-sm font-black uppercase tracking-tight">{notification.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Pending Payments" value={`₹${totalUnpaid.toLocaleString()}`} icon={Wallet} theme="amber" desc="Money to be paid" loading={loading} />
                <StatCard label="Riders to Pay" value={activeRiders} icon={Bike} theme="indigo" desc="Waiting for payment" loading={loading} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Payable Accounts</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stats.length} entities tracked</span>
                </div>

                <div className="flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/30">
                                    <th className="px-8 py-6">Rider Name</th>
                                    <th className="px-8 py-6">Orders Delivered</th>
                                    <th className="px-8 py-6">Amount to Pay</th>
                                    <th className="px-8 py-6">Last Order</th>
                                    <th className="px-8 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center text-gray-200 font-black uppercase tracking-[0.2em]">All accounts balanced</td>
                                    </tr>
                                ) : (
                                    stats.map((rider) => (
                                        <tr key={rider.riderId} className="group hover:bg-indigo-50/20 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-gray-900 uppercase mb-0.5">{rider.riderName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-gray-400 font-black tracking-tight">{rider.riderMobile}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">{rider.count} Orders</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xl font-black text-indigo-600">₹{rider.totalAmount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-widest"><Calendar className="w-3.5 h-3.5" /> {new Date(rider.lastDeliveryDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleProcessPayout(rider.riderId)}
                                                    disabled={processingId === rider.riderId}
                                                    className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 shadow-xl shadow-black/10 disabled:opacity-50 group/btn active:scale-95"
                                                >
                                                    {processingId === rider.riderId ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
                                                    Process <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
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
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all duration-300`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};

export default Payouts;
