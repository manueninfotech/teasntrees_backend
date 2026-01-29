import { useState, useEffect } from 'react';
import { Users, Clock, Search, Filter, ShieldCheck, UserCog } from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function Managers() {
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
    const [managers, setManagers] = useState([]);
    const [pendingManagers, setPendingManagers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [managerToReject, setManagerToReject] = useState(null);
    const [filters, setFilters] = useState({
        status: '', // all, active, inactive, approved, unapproved
    });
    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
        fetchManagers();
        fetchPendingManagers();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleManagerChange = (data) => {
                console.log('Real-time manager change:', data);
                fetchStats();
                fetchManagers(true);
                fetchPendingManagers(true);
            };

            socket.on('manager:status-updated', handleManagerChange);

            return () => {
                socket.off('manager:status-updated', handleManagerChange);
            };
        }
    }, [socket]);

    const fetchStats = async () => {
        // Quick stats calculation from list if dedicated endpoint doesn't exist yet
        try {
            const response = await api.get('/admin/managers?limit=1000');
            const all = response.data.data?.managers || [];

            setStats({
                total: all.length,
                pending: all.filter(m => !m.isApproved).length,
                active: all.filter(m => m.isActive).length
            });
        } catch (error) {
            console.error('Stats error', error);
        }
    };

    const fetchManagers = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const params = new URLSearchParams({ limit: 100 });

            if (filters.status === 'active') params.append('isActive', 'true');
            if (filters.status === 'inactive') params.append('isActive', 'false');
            if (filters.status === 'approved') params.append('isApproved', 'true');
            if (filters.status === 'unapproved') params.append('isApproved', 'false');

            const response = await api.get(`/admin/managers?${params.toString()}`);
            setManagers(response.data.data?.managers || []);
        } catch (error) {
            console.error('Failed to fetch managers:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const fetchPendingManagers = async () => {
        try {
            const response = await api.get('/admin/managers/pending');
            setPendingManagers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch pending managers:', error);
        }
    };

    const handleApprove = async (manager) => {
        if (!confirm(`Approve ${manager.name} as a Manager?`)) return;
        try {
            await api.put(`/admin/managers/${manager._id}/approve`);
            alert('Manager approved successfully');
            fetchManagers();
            fetchPendingManagers();
            fetchStats();
        } catch (error) {
            console.error(error);
            alert('Failed to approve manager');
        }
    };

    const handleReject = (manager) => {
        setManagerToReject(manager);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        try {
            await api.put(`/admin/managers/${managerToReject._id}/reject`, { reason: rejectReason });
            alert('Manager rejected');
            setShowRejectModal(false);
            setRejectReason('');
            setManagerToReject(null);
            fetchManagers();
            fetchPendingManagers();
            fetchStats();
        } catch (error) {
            console.error(error);
            alert('Failed to reject manager');
        }
    };

    const handleToggleStatus = async (manager) => {
        try {
            await api.put(`/admin/managers/${manager._id}/status`, { isActive: !manager.isActive });
            fetchManagers();
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (manager) => {
        if (!confirm(`Delete ${manager.name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/managers/${manager._id}`);
            fetchManagers();
            fetchPendingManagers();
            fetchStats();
        } catch (error) {
            console.error(error);
            alert('Failed to delete manager');
        }
    };

    const displayData = activeTab === 'all' ? managers : pendingManagers;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manager Management</h1>
                    <p className="text-gray-500 mt-1">Manage system managers and approvals</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Managers</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <Users className="w-10 h-10 text-teal-500" />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Pending Approvals</p>
                            <p className="text-2xl font-bold">{stats.pending}</p>
                        </div>
                        <Clock className="w-10 h-10 text-orange-500" />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active Now</p>
                            <p className="text-2xl font-bold">{stats.active}</p>
                        </div>
                        <ShieldCheck className="w-10 h-10 text-green-500" />
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
                        All Managers
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'pending'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pending Requests ({pendingManagers.length})
                    </button>
                </div>

                {activeTab === 'all' && (
                    <div className="p-4 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search managers..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="input w-40"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="approved">Approved</option>
                            <option value="unapproved">Unapproved</option>
                        </select>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayData.map(manager => (
                    <div key={manager._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <UserCog className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{manager.name}</h3>
                                    <p className="text-sm text-gray-500">{manager.role}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                ${manager.isApproved === true ? 'bg-green-100 text-green-700' :
                                    manager.isApproved === false ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {manager.isApproved === true ? 'Approved' :
                                    manager.isApproved === false ? 'Rejected' : 'Pending'}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                            <p>📱 {manager.mobile}</p>
                            <p>📧 {manager.email}</p>
                            <p>📅 Joined: {new Date(manager.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex gap-2">
                            {manager.isApproved === null ? (
                                <>
                                    <button
                                        onClick={() => handleApprove(manager)}
                                        className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(manager)}
                                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 text-sm font-medium"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <>
                                    {manager.isApproved === true && (
                                        <button
                                            onClick={() => handleToggleStatus(manager)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border
                                            ${manager.isActive
                                                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    : 'bg-green-600 text-white hover:bg-green-700'}`}
                                        >
                                            {manager.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(manager)}
                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {displayData.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No managers found.
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">Reject Manager Request</h3>
                        <textarea
                            className="input w-full h-32 mb-4"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={confirmReject} className="bg-red-600 text-white px-4 py-2 rounded-lg">Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
