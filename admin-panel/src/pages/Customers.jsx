import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserPlus, TrendingUp, UserCheck, UserX } from 'lucide-react';
import api from '../utils/api';
import CustomerCard from '../components/CustomerCard';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import { useSocket } from '../context/SocketContext';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        limit: 20,
        totalCustomers: 0
    });

    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            const handleUserUpdate = () => {
                console.log('User update received, refreshing customers...');
                fetchStats();
                fetchCustomers();
            };

            socket.on('user:registered', handleUserUpdate);
            socket.on('user:deleted', handleUserUpdate);
            socket.on('user:activated', handleUserUpdate);
            socket.on('user:deactivated', handleUserUpdate);

            return () => {
                socket.off('user:registered', handleUserUpdate);
                socket.off('user:deleted', handleUserUpdate);
                socket.off('user:activated', handleUserUpdate);
                socket.off('user:deactivated', handleUserUpdate);
            };
        }
    }, [socket, pagination.currentPage, searchTerm, filterStatus]);

    useEffect(() => {
        fetchStats();
        fetchCustomers();
    }, [pagination.currentPage, searchTerm, filterStatus]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/customers/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit
            });

            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus !== 'all') {
                params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
            }

            const response = await api.get(`/admin/customers?${params.toString()}`);
            setCustomers(response.data.data || []);

            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination.totalPages || 1,
                    totalCustomers: response.data.pagination.totalItems || 0
                }));
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
    };

    const handleToggleStatus = async (customer) => {
        const action = customer.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${customer.name}?`)) {
            return;
        }

        try {
            await api.put(`/admin/customers/${customer._id}/status`);
            alert(`Customer ${action}d successfully`);
            fetchCustomers();
            fetchStats();
        } catch (error) {
            console.error(`Failed to ${action} customer:`, error);
            alert(error.response?.data?.message || `Failed to ${action} customer`);
        }
    };

    const handleDelete = async (customer) => {
        if (!confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/admin/customers/${customer._id}`);
            alert('Customer deleted successfully');
            fetchCustomers();
            fetchStats();
        } catch (error) {
            console.error('Failed to delete customer:', error);
            alert(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="w-8 h-8" />
                    Customers Management
                </h1>
                <p className="text-gray-500 mt-1">Manage and view all customer accounts</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 opacity-80" />
                        <span className="text-2xl font-bold">{stats.totalCustomers || 0}</span>
                    </div>
                    <p className="text-blue-100">Total Customers</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-8 h-8 opacity-80" />
                        <span className="text-2xl font-bold">{stats.activeCustomers || 0}</span>
                    </div>
                    <p className="text-green-100">Active Customers</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 opacity-80" />
                        <span className="text-2xl font-bold">{stats.customersWithOrders || 0}</span>
                    </div>
                    <p className="text-purple-100">With Orders</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <UserPlus className="w-8 h-8 opacity-80" />
                        <span className="text-2xl font-bold">{stats.newCustomersToday || 0}</span>
                    </div>
                    <p className="text-orange-100">New Today</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleFilterChange('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => handleFilterChange('inactive')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'inactive'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Inactive
                        </button>
                    </div>
                </div>

                {/* Results Info */}
                <div className="mt-3 text-sm text-gray-600">
                    Showing {customers.length} of {pagination.totalCustomers} customers
                </div>
            </div>

            {/* Customers Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading customers...</p>
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500">
                        {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No customers registered yet'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {customers.map((customer) => (
                            <CustomerCard
                                key={customer._id}
                                customer={customer}
                                onViewDetails={handleViewDetails}
                                onToggleStatus={handleToggleStatus}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-700">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Customer Details Modal */}
            {showDetailsModal && selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedCustomer(null);
                    }}
                    onUpdate={fetchCustomers}
                />
            )}
        </div>
    );
};

export default Customers;
