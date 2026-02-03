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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold">
                            {rider.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{rider.name}</h2>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {rider.mobile}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Section */}
                    <div className="flex gap-4">
                        <div className={`flex-1 p-4 rounded-xl border ${rider.isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                <span className={`font-bold ${rider.isOnline ? 'text-emerald-700' : 'text-gray-600'}`}>
                                    {rider.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-4 rounded-xl bg-orange-50 border border-orange-100">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Current Activity</p>
                            <span className="font-bold text-orange-700">
                                {rider.isBusy ? 'On Delivery' : 'Idle'}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-brand-primary mb-2" />
                            <p className="text-xs text-gray-500">Total Deliveries</p>
                            <p className="text-lg font-bold text-gray-900">{rider.totalDeliveries || 0}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <CreditCard className="w-4 h-4 text-brand-primary mb-2" />
                            <p className="text-xs text-gray-500">Earnings</p>
                            <p className="text-lg font-bold text-gray-900">₹{rider.totalEarnings || 0}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 mb-2" />
                            <p className="text-xs text-gray-500">Rating</p>
                            <p className="text-lg font-bold text-gray-900">{rider.averageRating?.toFixed(1) || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Clock className="w-4 h-4 text-blue-500 mb-2" />
                            <p className="text-xs text-gray-500">Joined</p>
                            <p className="text-sm font-bold text-gray-900">
                                {new Date(rider.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Bike className="w-4 h-4" /> Vehicle Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <p className="text-xs text-gray-500">Model</p>
                                <p className="font-medium">{rider.vehicleModel || 'N/A'}</p>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <p className="text-xs text-gray-500">Vehicle Number</p>
                                <p className="font-medium">{rider.vehicleNumber || 'N/A'}</p>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="font-medium capitalize">{rider.vehicleType || 'N/A'}</p>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <p className="text-xs text-gray-500">License Number</p>
                                <p className="font-medium">{rider.licenseNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Bank Details
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Account Holder</span>
                                <span className="font-medium">{rider.accountHolderName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Account Number</span>
                                <span className="font-medium">{rider.bankAccountNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">IFSC Code</span>
                                <span className="font-medium">{rider.ifscCode || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    >
                        Close
                    </button>
                    {!rider.isApproved && (
                        <button
                            onClick={() => { onApprove(rider._id); onClose(); }}
                            className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                        >
                            <ShieldCheck className="w-4 h-4" /> Approve Rider
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
            {/* Header & Stats */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rider Management</h1>
                    <p className="text-gray-500 text-sm">Monitor fleet and approvals</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Bike className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Online</p>
                            <p className="text-lg font-bold text-gray-900">{stats.online}/{stats.total}</p>
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
                    Active Fleet
                    {activeTab === 'active' && (
                        <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Pending Approval
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                    {/* Avatar placeholder or image if available */}
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{rider.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {rider.mobile}
                    </p>
                </div>
            </div>
            {!isPending && (
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1
                    ${rider.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {rider.isOnline ? 'Online' : 'Offline'}
                </div>
            )}
        </div>

        {/* Details - Updated with correct fields */}
        <div className="space-y-2 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-50 text-xs">
            <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium text-gray-800">{rider.vehicleModel || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="font-medium text-gray-800">{rider.vehicleNumber || 'N/A'}</span>
            </div>
            {!isPending && (
                <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold ${rider.isBusy ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {rider.isBusy ? 'Busy (Delivering)' : 'Available'}
                    </span>
                </div>
            )}
        </div>

        {/* Actions */}
        {isPending ? (
            <div className="flex gap-2">
                <button
                    onClick={() => onViewDetails(rider)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200"
                >
                    View
                </button>
                <button
                    onClick={() => onReject(rider._id)}
                    className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                >
                    Reject
                </button>
                <button
                    onClick={() => onApprove(rider._id)}
                    className="flex-1 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90 flex items-center justify-center gap-2"
                >
                    <ShieldCheck className="w-3 h-3" /> Approve
                </button>
            </div>
        ) : (
            <button
                onClick={() => onViewDetails(rider)}
                className="w-full py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
            >
                View Details
            </button>
        )}
    </motion.div>
);

export default RidersPage;
