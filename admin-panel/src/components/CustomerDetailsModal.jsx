import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, ShoppingBag, IndianRupee, Calendar, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import CustomerStatusBadge from './CustomerStatusBadge';
import OrderStatusBadge from './OrderStatusBadge';

const CustomerDetailsModal = ({ customer, onClose, onUpdate }) => {
    const [customerDetails, setCustomerDetails] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'orders'

    useEffect(() => {
        if (customer) {
            fetchCustomerDetails();
            fetchCustomerOrders();
        }
    }, [customer]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await api.get(`/admin/customers/${customer._id}`);
            setCustomerDetails(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customer details:', error);
        }
    };

    const fetchCustomerOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/customers/${customer._id}/orders?limit=10`);
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch customer orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!customer || !customerDetails) {
        return null;
    }

    const stats = customerDetails.stats || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{customerDetails.name || 'N/A'}</h2>
                                <p className="text-blue-100">Customer Details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'info'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Customer Info
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'orders'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Order History ({stats.orderCount || 0})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                    {activeTab === 'info' ? (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                                        <ShoppingBag className="w-5 h-5" />
                                        <span className="text-sm font-medium">Total Orders</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.orderCount || 0}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-600 mb-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm font-medium">Completed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.completedOrders || 0}</p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-yellow-600 mb-2">
                                        <Clock className="w-5 h-5" />
                                        <span className="text-sm font-medium">Pending</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                                        <IndianRupee className="w-5 h-5" />
                                        <span className="text-sm font-medium">Total Spent</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats.totalSpent || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Full Name</label>
                                        <p className="font-medium text-gray-900">{customerDetails.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Status</label>
                                        <div className="mt-1">
                                            <CustomerStatusBadge isActive={customerDetails.isActive} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Mobile Number</label>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {customerDetails.mobile || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Email Address</label>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {customerDetails.email || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Joined Date</label>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {formatDate(customerDetails.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Last Updated</label>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {formatDate(customerDetails.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses */}
                            {customerDetails.addresses && customerDetails.addresses.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Saved Addresses ({customerDetails.addresses.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {customerDetails.addresses.map((address, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium text-gray-900">{address.label || 'Address'}</p>
                                                    {address.isDefault && (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {address.street}, {address.area}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {address.city}, {address.state} - {address.pincode}
                                                </p>
                                                {address.landmark && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Landmark: {address.landmark}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-4">Loading orders...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No orders found</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <OrderStatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Items</p>
                                                    <p className="font-medium text-gray-900">{order.items?.length || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Total</p>
                                                    <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Payment</p>
                                                    <p className="font-medium text-gray-900 capitalize">{order.paymentStatus}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
