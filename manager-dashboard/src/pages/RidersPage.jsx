import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Bike,
    ShieldCheck,
    CreditCard,
    FileText,
    TrendingUp,
    Star,
    X
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// --- Rider Details Modal ---
const RiderDetailsModal = ({ rider, onClose, onApprove }) => {
    if (!rider) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/50 backdrop-blur-md z-10 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[1.8rem] bg-gray-50 flex items-center justify-center text-gray-400 text-3xl font-black uppercase tracking-tighter shadow-inner border border-gray-100">
                            {rider.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] leading-none mb-1 block">Rider Info</span>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{rider.name}</h2>
                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mt-2 uppercase tracking-widest">
                                <Phone className="w-3.5 h-3.5" /> +91 {rider.mobile}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Status Section */}
                    <div className="flex gap-6">
                        <div className={`flex-1 p-6 rounded-[2rem] border-2 shadow-sm ${rider.isOnline ? 'bg-emerald-50/50 border-emerald-100 ring-4 ring-emerald-500/5' : 'bg-gray-50/50 border-gray-100'}`}>
                            <p className="text-[9px] font-black text-gray-400 font-bold uppercase tracking-[0.2em] mb-2 leading-none">Online Status</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${rider.isOnline ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-gray-400'}`} />
                                <span className={`text-lg font-black uppercase tracking-tight ${rider.isOnline ? 'text-emerald-700' : 'text-gray-600'}`}>
                                    {rider.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 rounded-[2rem] bg-orange-50/50 border-2 border-orange-100 shadow-sm">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 leading-none">Work Status</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${rider.isBusy ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="text-lg font-black uppercase tracking-tight text-orange-700">
                                    {rider.isBusy ? 'Delivering' : 'Ready'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'DELIVERIES', value: rider.totalDeliveries || 0, icon: TrendingUp, color: 'text-brand-primary', bg: 'bg-emerald-50' },
                            { label: 'WALLET', value: `₹${rider.totalEarnings || 0}`, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'RATING', value: rider.averageRating?.toFixed(1) || 'N/A', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                            { label: 'TENURE', value: new Date(rider.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' }
                        ].map((stat, i) => (
                            <div key={i} className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-center">{stat.label}</p>
                                <p className="text-lg font-black text-gray-900 uppercase tracking-tight text-center">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                        <h3 className="text-[10px] font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <Bike className="w-5 h-5" /> Vehicle Logistics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { l: 'VEHICLE', v: rider.vehicleModel || 'N/A' },
                                { l: 'BIKE NUMBER', v: rider.vehicleNumber || 'N/A' },
                                { l: 'VEHICLE TYPE', v: rider.vehicleType || 'N/A' },
                                { l: 'LICENSE NUMBER', v: rider.licenseNumber || 'N/A' }
                            ].map((d, i) => (
                                <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{d.l}</p>
                                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{d.v}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg shadow-gray-100/50">
                        <h3 className="text-[10px] font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <CreditCard className="w-5 h-5" /> Bank Details
                        </h3>
                        <div className="space-y-4">
                            {[
                                { l: 'ACCOUNT NAME', v: rider.accountHolderName || 'N/A' },
                                { l: 'ACCOUNT NUMBER', v: rider.bankAccountNumber || 'N/A' },
                                { l: 'IFSC CODE', v: rider.ifscCode || 'N/A' }
                            ].map((d, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{d.l}</span>
                                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{d.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 bg-gray-50 rounded-b-[2.5rem] flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100"
                    >
                        Close
                    </button>
                    {!rider.isApproved && (
                        <button
                            onClick={() => { onApprove(rider._id); onClose(); }}
                            className="px-10 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2"
                        >
                            <ShieldCheck className="w-5 h-5" /> Approve Rider
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Page ---
const RidersPage = () => {
    const { socket } = useSocket();
    const { token } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ online: 0, total: 0, pending: 0 });
    const [selectedRider, setSelectedRider] = useState(null); // For Modal

    // Fetch Riders
    const fetchRiders = async () => {
        setLoading(true);
        try {
            // Fetch Active
            const resActive = await fetch('http://localhost:5000/api/manager/riders?type=assigned', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataActive = await resActive.json();

            // Fetch Pending
            const resPending = await fetch('http://localhost:5000/api/manager/riders?type=pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataPending = await resPending.json();

            if (dataActive.success && dataPending.success) {
                const activeList = dataActive.data || [];
                const pendingList = dataPending.data || [];

                const combined = [
                    ...activeList.map(r => ({ ...r, tab: 'active' })),
                    ...pendingList.map(r => ({ ...r, tab: 'pending' }))
                ];

                setRiders(combined);

                // Calc stats
                setStats({
                    online: activeList.filter(r => r.isOnline).length,
                    total: activeList.length,
                    pending: pendingList.length
                });
            }
        } catch (err) {
            console.error("Failed to fetch riders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiders();
    }, [token]);

    // Socket Listeners for Real-time Status
    useEffect(() => {
        if (!socket) return;

        const handleOnline = (data) => {
            setRiders(prev => prev.map(r =>
                r._id === data.riderId ? { ...r, isOnline: true } : r
            ));
            setStats(prev => ({ ...prev, online: prev.online + 1 }));
        };

        const handleOffline = (data) => {
            setRiders(prev => prev.map(r =>
                r._id === data.riderId ? { ...r, isOnline: false } : r
            ));
            setStats(prev => ({ ...prev, online: Math.max(0, prev.online - 1) }));
        };

        socket.on('rider:online', handleOnline);
        socket.on('rider:offline', handleOffline);

        return () => {
            socket.off('rider:online', handleOnline);
            socket.off('rider:offline', handleOffline);
        };
    }, [socket]);

    // Actions
    const handleApprove = async (riderId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/manager/riders/${riderId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                // Optimistic UI Update
                setRiders(prev => prev.map(r =>
                    r._id === riderId ? { ...r, tab: 'active', isApproved: true } : r
                ));
                setStats(prev => ({
                    ...prev,
                    pending: prev.pending - 1,
                    total: prev.total + 1
                }));
            }
        } catch (err) {
            console.error("Failed to approve rider", err);
        }
    };

    const handleReject = async (riderId) => {
        if (!confirm('Are you sure you want to reject this rider? This action cannot be undone.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/manager/riders/${riderId}/reject`, {
                method: 'DELETE', // Assuming DELETE for reject as implemented
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setRiders(prev => prev.filter(r => r._id !== riderId));
                setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
                if (selectedRider && selectedRider._id === riderId) setSelectedRider(null);
            }
        } catch (err) {
            console.error("Failed to reject rider", err);
        }
    };

    // Filtering
    const displayedRiders = riders.filter(r => r.tab === activeTab);

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Riders</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Manage riders and new signups</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-8 py-5 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-6 group hover:-translate-y-1 transition-all">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100 group-hover:scale-110 transition-transform duration-500">
                            <Bike className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-2">Riders Online</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{stats.online} <span className="text-gray-200 text-xl mx-1">/</span> {stats.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'active' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Active Riders
                    {activeTab === 'active' && (
                        <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    New Signups
                    {stats.pending > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {stats.pending}
                        </span>
                    )}
                    {activeTab === 'pending' && (
                        <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                    )}
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {displayedRiders.map(rider => (
                                <RiderCard
                                    key={rider._id}
                                    rider={rider}
                                    isPending={activeTab === 'pending'}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onViewDetails={setSelectedRider}
                                />
                            ))}
                        </AnimatePresence>

                        {displayedRiders.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                <p>No {activeTab} riders found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedRider && (
                    <RiderDetailsModal
                        rider={selectedRider}
                        onClose={() => setSelectedRider(null)}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-component for individual card
const RiderCard = ({ rider, isPending, onApprove, onReject, onViewDetails }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm transition-all group relative overflow-hidden
            ${!rider.isApproved ? 'border-amber-200 bg-amber-50/10' : 'border-gray-50 hover:border-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/10 hover:-translate-y-1'}
        `}
    >
        {/* Connection Status Indicator */}
        {!isPending && (
            <div className={`absolute top-6 right-6 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm backdrop-blur-md
                ${rider.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}
            `}>
                <div className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                {rider.isOnline ? 'Online' : 'Offline'}
            </div>
        )}

        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-black uppercase shadow-inner border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                {rider.name?.charAt(0) || 'R'}
            </div>
            <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-base leading-none group-hover:text-emerald-600 transition-colors uppercase">
                    {rider.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {rider.mobile}
                </p>
            </div>
        </div>

        {/* Logistics Summary */}
        <div className="space-y-4 mb-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-50/50">
            <div className="flex justify-between items-center transition-all group-hover:translate-x-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Work Status</span>
                <span className={`text-[11px] font-black uppercase tracking-tight flex items-center gap-2 ${rider.isBusy ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${rider.isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {rider.isBusy ? 'Delivering' : 'Ready'}
                </span>
            </div>
            <div className="flex justify-between items-start transition-all group-hover:translate-x-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Vehicle</span>
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight text-right flex-1 ml-4 leading-tight">{rider.vehicleModel || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center transition-all group-hover:translate-x-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plate No.</span>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{rider.vehicleNumber || 'N/A'}</span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
            {isPending ? (
                <>
                    <button
                        onClick={() => onReject(rider._id)}
                        className="flex-1 py-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 hover:text-white transition-all order-2"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => onApprove(rider._id)}
                        className="flex-[1.5] py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 order-1"
                    >
                        <ShieldCheck className="w-4 h-4" /> Approve
                    </button>
                </>
            ) : (
                <button
                    onClick={() => onViewDetails(rider)}
                    className="w-full py-4 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 hover:text-white hover:shadow-xl hover:shadow-emerald-200 transition-all border border-transparent hover:border-emerald-600"
                >
                    View Details
                </button>
            )}
        </div>
    </motion.div>
);

export default RidersPage;
