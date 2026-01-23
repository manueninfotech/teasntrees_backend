import React from 'react';
import { User, Phone, Mail, ShoppingBag, IndianRupee, Eye, Power, Trash2 } from 'lucide-react';
import CustomerStatusBadge from './CustomerStatusBadge';

const CustomerCard = ({ customer, onViewDetails, onToggleStatus, onDelete }) => {
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
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{customer.name || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">Joined {formatDate(customer.createdAt)}</p>
                    </div>
                </div>
                <CustomerStatusBadge isActive={customer.isActive} />
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.mobile || 'N/A'}</span>
                </div>
                {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Orders</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{customer.orderCount || 0}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <IndianRupee className="w-3 h-3" />
                        <span>Total Spent</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(customer.totalSpent || 0)}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onViewDetails(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </button>
                <button
                    onClick={() => onToggleStatus(customer)}
                    className={`px-3 py-2 rounded-lg transition-colors ${customer.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    title={customer.isActive ? 'Deactivate' : 'Activate'}
                >
                    <Power className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(customer)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CustomerCard;
