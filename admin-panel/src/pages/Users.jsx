import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Shield,
    User, Bike, Briefcase
} from 'lucide-react';
import api from '../utils/api';
import UserCard from '../components/UserCard';
import UserDetailsModal from '../components/UserDetailsModal';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        customers: 0,
        riders: 0,
        admins: 0,
        managers: 0
    });

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, search]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/users/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12, // Increased for grid
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(search && { search })
            };
            const response = await api.get('/admin/users', { params });
            if (response.data.success) {
                setUsers(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (user) => {
        const currentStatus = user.isActive !== false;
        try {
            const endpoint = currentStatus
                ? `/admin/users/${user._id}/deactivate`
                : `/admin/users/${user._id}/activate`;

            const response = await api.put(endpoint);
            if (response.data.success) {
                setUsers(users.map(u =>
                    u._id === user._id ? { ...u, isActive: !currentStatus } : u
                ));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Failed to update user status');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data.success) {
                setUsers(users.filter(u => u._id !== userId));
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">All Accounts</h1>
                    <p className="text-gray-500 mt-1">View and manage all users, riders, and staff</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Accounts" value={stats.totalUsers} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Customers" value={stats.customers} icon={User} color="text-green-600" bg="bg-green-50" />
                <StatCard label="Riders" value={stats.riders} icon={Bike} color="text-orange-600" bg="bg-orange-50" />
                <StatCard label="Admin & Managers" value={stats.admins + stats.managers} icon={Shield} color="text-purple-600" bg="bg-purple-50" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex overflow-x-auto w-full md:w-auto gap-2 bg-gray-50 p-1 rounded-lg no-scrollbar">
                    {['all', 'customer', 'rider', 'admin', 'manager'].map(role => (
                        <button
                            key={role}
                            onClick={() => { setRoleFilter(role); setPage(1); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap ${roleFilter === role
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 mt-4 font-medium animate-pulse">Fetching users...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                    <p className="text-red-500 font-medium">{error}</p>
                    <button onClick={fetchUsers} className="mt-4 text-sm text-red-600 underline">Try again</button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <UserCard
                                key={user._id}
                                user={user}
                                onToggleStatus={toggleStatus}
                                onDelete={handleDelete}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No users found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your role or search filters</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${page === p
                                        ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <UserDetailsModal
                isOpen={showDetailsModal}
                user={selectedUser}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                }}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
);

export default UsersPage;
