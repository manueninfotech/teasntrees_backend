import { useState, useEffect } from 'react';
import { Bike, Users, Clock, TrendingUp, Search, Filter } from 'lucide-react';
import RiderCard from '../components/RiderCard';
import RiderDetailsModal from '../components/RiderDetailsModal';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function Riders() {
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
    const [riders, setRiders] = useState([]);
    const [pendingRiders, setPendingRiders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRider, setSelectedRider] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [riderToReject, setRiderToReject] = useState(null);
    const [filters, setFilters] = useState({
        status: '', // all, active, inactive, online, onDelivery
    });
    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
        fetchRiders();
        fetchPendingRiders();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleRiderChange = (data) => {
                console.log('Real-time rider change:', data);
                fetchStats();
                fetchRiders(true); // Background refresh
                fetchPendingRiders(true); // Background refresh
            };

            socket.on('rider:status-updated', handleRiderChange);
            socket.on('rider:new', handleRiderChange); // For new applications

            return () => {
                socket.off('rider:status-updated', handleRiderChange);
                socket.off('rider:new', handleRiderChange);
            };
        }
    }, [socket]);

    useEffect(() => {
        if (activeTab === 'all') {
            fetchRiders();
        }
    }, [filters, searchTerm]);

    const fetchStats = async () => {
        try {
            // Get total riders
            const allResponse = await api.get('/admin/riders?limit=1000');
            const allRiders = allResponse.data.data?.riders || [];

            const totalRiders = allRiders.length;
            const activeRiders = allRiders.filter(r => r.isOnline).length;
            const pendingCount = allRiders.filter(r => !r.isApproved).length;
            const totalDeliveries = allRiders.reduce((sum, r) => sum + (r.totalDeliveries || 0), 0);

            setStats({
                totalRiders,
                activeRiders,
                pendingApprovals: pendingCount,
                totalDeliveries
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchRiders = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const params = new URLSearchParams({
                isApproved: 'true',
                limit: 100
            });

            if (filters.status === 'active') params.append('isActive', 'true');
            if (filters.status === 'inactive') params.append('isActive', 'false');

            const response = await api.get(`/admin/riders?${params.toString()}`);
            let ridersData = response.data.data?.riders || [];

            console.log('Fetched riders:', ridersData.length, ridersData);

            // Apply client-side filters
            if (filters.status === 'online') {
                ridersData = ridersData.filter(r => r.isOnline);
            }
            if (filters.status === 'onDelivery') {
                ridersData = ridersData.filter(r => r.isOnDelivery);
            }
            if (searchTerm) {
                ridersData = ridersData.filter(r =>
                    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.mobile?.includes(searchTerm) ||
                    r.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            console.log('After filters:', ridersData.length);
            setRiders(ridersData);
        } catch (error) {
            console.error('Failed to fetch riders:', error);
            setRiders([]);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const fetchPendingRiders = async (isBackground = false) => {
        try {
            const response = await api.get('/admin/riders/pending');
            setPendingRiders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch pending riders:', error);
            setPendingRiders([]);
        }
    };

    const handleApprove = async (rider) => {
        if (!confirm(`Approve ${rider.name} as a rider?`)) return;

        try {
            await api.put(`/admin/riders/${rider._id}/approve`);
            alert('Rider approved successfully!');
            fetchStats();
            fetchRiders();
            fetchPendingRiders();
        } catch (error) {
            console.error('Failed to approve rider:', error);
            alert(error.response?.data?.message || 'Failed to approve rider');
        }
    };

    const handleReject = (rider) => {
        setRiderToReject(rider);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await api.put(`/admin/riders/${riderToReject._id}/reject`, { reason: rejectReason });
            alert('Rider rejected successfully!');
            setShowRejectModal(false);
            setRejectReason('');
            setRiderToReject(null);
            fetchStats();
            fetchRiders();
            fetchPendingRiders();
        } catch (error) {
            console.error('Failed to reject rider:', error);
            alert(error.response?.data?.message || 'Failed to reject rider');
        }
    };

    const handleToggleStatus = async (rider) => {
        const action = rider.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${rider.name}?`)) return;

        try {
            await api.put(`/admin/riders/${rider._id}/status`, { isActive: !rider.isActive });
            alert(`Rider ${action}d successfully!`);
            fetchStats();
            fetchRiders();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert(error.response?.data?.message || 'Failed to update rider status');
        }
    };

    const handleDelete = async (rider) => {
        if (!confirm(`Are you sure you want to delete ${rider.name}? This action cannot be undone.`)) return;

        try {
            await api.delete(`/admin/riders/${rider._id}`);
            alert('Rider deleted successfully!');
            fetchStats();
            fetchRiders();
        } catch (error) {
            console.error('Failed to delete rider:', error);
            alert(error.response?.data?.message || 'Failed to delete rider');
        }
    };

    const handleViewDetails = (rider) => {
        setSelectedRider(rider);
        setShowDetailsModal(true);
    };

    const clearFilters = () => {
        setFilters({ status: '' });
        setSearchTerm('');
    };

    if (loading && riders.length === 0 && pendingRiders.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayRiders = activeTab === 'all' ? riders : pendingRiders;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Riders Management</h1>
                    <p className="text-gray-500 mt-1">Manage delivery riders and approvals</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-teal-100 text-sm">Total Riders</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalRiders || 0}</p>
                            </div>
                            <Users className="w-12 h-12 text-teal-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Active Now</p>
                                <p className="text-3xl font-bold mt-1">{stats.activeRiders || 0}</p>
                            </div>
                            <Bike className="w-12 h-12 text-green-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Pending Approvals</p>
                                <p className="text-3xl font-bold mt-1">{stats.pendingApprovals || 0}</p>
                            </div>
                            <Clock className="w-12 h-12 text-orange-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Total Deliveries</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalDeliveries || 0}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-purple-200" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'all'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        All Riders ({riders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-4 font-medium transition-colors relative ${activeTab === 'pending'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pending Approvals
                        {pendingRiders.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                {pendingRiders.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search and Filters (Only for All Riders tab) */}
                {activeTab === 'all' && (
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, mobile, or vehicle number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="input flex-1"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="online">Online Now</option>
                                <option value="onDelivery">On Delivery</option>
                            </select>

                            {(filters.status || searchTerm) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Riders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRiders.map((rider) => (
                    <RiderCard
                        key={rider._id}
                        rider={rider}
                        isPending={activeTab === 'pending'}
                        onViewDetails={handleViewDetails}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Empty State */}
            {displayRiders.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        {activeTab === 'pending' ? 'No pending approvals' : 'No riders found'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        {activeTab === 'pending'
                            ? 'New rider applications will appear here'
                            : 'Riders will appear here once approved'}
                    </p>
                </div>
            )}

            {/* Rider Details Modal */}
            <RiderDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                rider={selectedRider}
                onApprove={handleApprove}
                onReject={handleReject}
                onToggleStatus={handleToggleStatus}
            />

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Reject Rider</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting {riderToReject?.name}
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="input resize-none mb-4"
                            rows="3"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setRiderToReject(null);
                                }}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="flex-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
