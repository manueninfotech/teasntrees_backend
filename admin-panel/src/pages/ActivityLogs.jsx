import React, { useState, useEffect } from 'react';
import {
    History, Search, Filter, Calendar,
    ArrowRight, Eye, Shield, User,
    FileText, Download, RefreshCw,
    Terminal, MoreHorizontal
} from 'lucide-react';
import api from '../utils/api';
import LogDetailsModal from '../components/LogDetailsModal';
import { useSocket } from '../context/SocketContext';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Filter Stats
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    const { socket, isConnected } = useSocket();
    const [debugInfo, setDebugInfo] = useState({
        lastEvent: null,
        lastEventTime: null,
        socketId: null
    });

    useEffect(() => {
        if (socket && isConnected) {
            setDebugInfo(prev => ({ ...prev, socketId: socket.id }));

            const handleNewLog = (newLog) => {
                setDebugInfo(prev => ({
                    ...prev,
                    lastEvent: newLog,
                    lastEventTime: new Date().toLocaleTimeString()
                }));

                // OPTIMISTIC UPDATE: Prepend new log immediately
                setLogs(prevLogs => {
                    // Only prepend if we are on page 1 and not filtering deeply
                    // (Simplification: Just prepend, user can refresh if order looks off,
                    // but usually new logs belong at top)
                    if (page === 1) {
                        // Keep list size reasonable, e.g., 20 items
                        const updated = [newLog, ...prevLogs].slice(0, 20);
                        return updated;
                    }
                    return prevLogs;
                });

                // Update stats locally
                setStats(prevStats => {
                    if (!prevStats) return prevStats;
                    return {
                        ...prevStats,
                        totalLogs: prevStats.totalLogs + 1,
                        todayLogs: prevStats.todayLogs + 1
                    };
                });
            };

            socket.on('activity-log:new', handleNewLog);

            return () => {
                socket.off('activity-log:new', handleNewLog);
            };
        }
    }, [socket, isConnected, page, filters]);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [page, filters.action, filters.resource, filters.startDate, filters.endDate, filters.search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...filters
            };
            const response = await api.get('/admin/activity-logs', { params });
            if (response.data.success) {
                setLogs(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/activity-logs/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const getActionBadge = (action) => {
        const styles = {
            create: 'bg-green-50 text-green-700 border-green-100',
            update: 'bg-blue-50 text-blue-700 border-blue-100',
            delete: 'bg-red-50 text-red-700 border-red-100',
            login: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            activate: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            deactivate: 'bg-orange-50 text-orange-700 border-orange-100'
        };
        return styles[action] || 'bg-gray-50 text-gray-700 border-gray-100';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleExport = async () => {
        try {
            const params = { ...filters };
            const response = await api.get('/admin/activity-logs/export', { params });
            if (response.data.success) {
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export logs');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${isConnected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                            }`}>
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                    <p className="text-gray-500 mt-1">Audit trail of all administrative actions</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { fetchLogs(); fetchStats(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Actions</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalLogs || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Activity</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.todayLogs || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 overflow-hidden">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Most Active Admin</p>
                        <p className="text-base font-bold text-gray-900 truncate">{stats?.topAdmins?.[0]?.admin?.name || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Advanced Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Action Type</label>
                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
                        >
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="activate">Activate</option>
                            <option value="deactivate">Deactivate</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Resource</label>
                        <select
                            name="resource"
                            value={filters.resource}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
                        >
                            <option value="">All Resources</option>
                            <option value="user">User</option>
                            <option value="product">Product</option>
                            <option value="category">Category</option>
                            <option value="order">Order</option>
                            <option value="delivery">Delivery</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                <th className="px-6 py-5">Admin</th>
                                <th className="px-6 py-5">Activity</th>
                                <th className="px-6 py-5">Time</th>
                                <th className="px-6 py-5 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 uppercase">
                                                {log.admin?.name?.charAt(0) || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{log.admin?.name || 'Administrator'}</p>
                                                <p className="text-xs text-gray-400 font-medium capitalize">{log.admin?.role || 'Staff'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-gray-400"><ArrowRight className="w-3 h-3" /></span>
                                                <span className="text-xs font-bold text-gray-800 capitalize flex items-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5 text-gray-300" />
                                                    {log.resource}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium italic">
                                                {log.action === 'login' ? 'System authentication' : `Modified ${log.resource} entry`}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{formatDate(log.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setSelectedLog(log); setShowModal(true); }}
                                            className="p-2 bg-gray-100 hover:bg-indigo-600 hover:text-white rounded-xl text-gray-400 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                            <History className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">No activity logs found</h3>
                        <p className="text-sm text-gray-400 mt-1">Try expanding your search parameters or date range</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-5 border-t border-gray-50 flex justify-center bg-gray-50/30">
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all shadow-sm ${page === p
                                        ? 'bg-indigo-600 text-white shadow-indigo-100 scale-110'
                                        : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <LogDetailsModal
                isOpen={showModal}
                log={selectedLog}
                onClose={() => { setShowModal(false); setSelectedLog(null); }}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
    </div>
);

export default ActivityLogs;
