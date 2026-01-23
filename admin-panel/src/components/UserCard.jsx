import React from 'react';
import {
    Mail, Phone, Shield, User, Bike, Briefcase,
    MoreVertical, Trash2, Eye, CheckCircle, XCircle
} from 'lucide-react';

const UserCard = ({ user, onToggleStatus, onDelete, onViewDetails }) => {
    // Helper for role badge config
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return { icon: Shield, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' };
            case 'manager': return { icon: Briefcase, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manager' };
            case 'rider': return { icon: Bike, bg: 'bg-orange-100', text: 'text-orange-700', label: 'Rider' };
            default: return { icon: User, bg: 'bg-green-100', text: 'text-green-700', label: 'Customer' };
        }
    };

    const roleStyle = getRoleBadge(user.role);
    const RoleIcon = roleStyle.icon;
    const isActive = user.isActive !== false;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group">
            {/* Top Section / Header */}
            <div className={`h-24 bg-gradient-to-br transition-colors ${user.role === 'admin' ? 'from-purple-500 to-indigo-600' :
                    user.role === 'rider' ? 'from-orange-400 to-red-500' :
                        user.role === 'manager' ? 'from-blue-500 to-cyan-600' :
                            'from-emerald-400 to-teal-500'
                } flex items-center justify-center relative`}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-2xl text-gray-700 shadow-md uppercase">
                    {user.name?.charAt(0)}
                </div>

                {/* Status Toggle (Floating) */}
                <button
                    onClick={() => onToggleStatus(user)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full shadow-sm border transition-all ${isActive
                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        }`}
                    title={isActive ? 'Deactivate' : 'Activate'}
                >
                    {isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{user.name}</h3>
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleStyle.bg} ${roleStyle.text}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleStyle.label}
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Mail className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="truncate" title={user.email}>{user.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Phone className="w-4 h-4 text-gray-400" />
                        </div>
                        <span>{user.mobile || 'No mobile'}</span>
                    </div>
                </div>

                {/* Footer Section / Action Buttons */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                        onClick={() => onViewDetails(user)}
                        className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2 hover:bg-gray-50 bg-white"
                    >
                        <Eye className="w-4 h-4" />
                        View
                    </button>
                    <button
                        onClick={() => onDelete(user._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;
