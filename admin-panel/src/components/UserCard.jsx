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
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
            {/* Header Area */}
            <div className="p-6 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-indigo-50 transition-colors">
                        <RoleIcon className={`w-7 h-7 ${user.role === 'admin' ? 'text-purple-600' : user.role === 'manager' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm truncate max-w-[150px]">{user.name}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{roleStyle.label}</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggleStatus(user)}
                    className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${isActive ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                >
                    {isActive ? 'Active' : 'Banned'}
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 lowercase tracking-widest truncate max-w-[180px]">{user.email || 'NO EMAIL'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{user.mobile || 'NO PHONE'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => onViewDetails(user)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">View Profile</button>
                    <button onClick={() => onDelete(user._id)} className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;
