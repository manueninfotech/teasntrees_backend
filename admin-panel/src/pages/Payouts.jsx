import React, { useState, useEffect } from 'react';
import {
    Wallet, IndianRupee, Clock, CheckCircle2,
    ArrowRight, Loader2, RefreshCw, AlertCircle,
    User, Bike, Calendar
} from 'lucide-react';
import api from '../utils/api';

const Payouts = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/payouts/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching payout stats:', error);
            showNotification('error', 'Failed to load payout statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (riderId) => {
        setProcessingId(riderId);
        try {
            const response = await api.post('/admin/payouts/process', { riderId });
            if (response.data.success) {
                showNotification('success', response.data.message);
                fetchStats(); // Refresh data
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payouts Management</h1>
                    <p className="text-gray-500 mt-1">Review and process unpaid earnings for delivery riders</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Stats
                </button>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${notification.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{notification.message}</p>
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Unpaid"
                    value={`₹${totalUnpaid.toLocaleString()}`}
                    icon={Wallet}
                    theme="amber"
                    desc="Pending payments"
                />
                <StatCard
                    label="Active Riders"
                    value={activeRiders}
                    icon={Bike}
                    theme="indigo"
                    desc="With unpaid earnings"
                />
            </div>

            {/* Rider Payout Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                <th className="px-8 py-5">Rider Details</th>
                                <th className="px-8 py-5">Deliveries</th>
                                <th className="px-8 py-5">Total Earnings</th>
                                <th className="px-8 py-5">Last Delivery</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-sans">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-12 bg-gray-50 rounded-2xl w-48"></div></td>
                                        <td className="px-8 py-6"><div className="h-8 bg-gray-50 rounded-full w-16"></div></td>
                                        <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-32"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 bg-gray-50 rounded w-24"></div></td>
                                        <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-32 float-right"></div></td>
                                    </tr>
                                ))
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                                        </div>
                                        <p className="text-gray-500 font-bold">All riders are paid up!</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">No pending payouts found</p>
                                    </td>
                                </tr>
                            ) : (
                                stats.map((rider) => (
                                    <tr key={rider.riderId} className="group hover:bg-indigo-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 border border-transparent group-hover:border-indigo-100 transition-all">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{rider.riderName || 'Anonymous Rider'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{rider.riderMobile || 'No Mobile'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">
                                                {rider.count} Orders
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-lg font-black text-indigo-600 tracking-tight">₹{rider.totalAmount.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(rider.lastDeliveryDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleProcessPayout(rider.riderId)}
                                                disabled={processingId === rider.riderId}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 shadow-sm hover:shadow-lg disabled:opacity-50 group/btn"
                                            >
                                                {processingId === rider.riderId ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <IndianRupee className="w-3 h-3 transition-transform group-hover/btn:rotate-12" />
                                                )}
                                                Pay Rider
                                                <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
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
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
    };

    const style = themes[theme] || themes.indigo;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');

    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-[0.03] rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`}></div>

            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 py-1 px-2 ${bgColor} rounded-lg w-fit transition-all group-hover:translate-x-1`}>
                        <Clock className={`w-3 h-3 ${textColor}`} />
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
