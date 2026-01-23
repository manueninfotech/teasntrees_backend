import React, { useState, useEffect } from 'react';
import {
    X, User, Mail, Phone, Calendar,
    Shield, Bike, Briefcase, CheckCircle,
    XCircle, Clock, ShoppingBag, MapPin,
    TrendingUp, Heart
} from 'lucide-react';
import api from '../utils/api';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            fetchDetails();
        }
    }, [isOpen, user]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users/${user._id}`);
            if (response.data.success) {
                setDetails(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const isActive = user.isActive !== false;

    const roleBadge = (role) => {
        switch (role) {
            case 'admin': return { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' };
            case 'rider': return { icon: Bike, color: 'text-orange-600', bg: 'bg-orange-100' };
            case 'manager': return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
            default: return { icon: User, color: 'text-green-600', bg: 'bg-green-100' };
        }
    };

    const RoleIcon = roleBadge(user.role).icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
                {/* Header */}
                <div className={`p-6 text-white flex items-center justify-between ${user.role === 'admin' ? 'bg-purple-600' :
                        user.role === 'rider' ? 'bg-orange-500' :
                            user.role === 'manager' ? 'bg-blue-600' :
                                'bg-emerald-600'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl uppercase">
                            {user.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                                <RoleIcon className="w-4 h-4" />
                                <span className="capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 mt-4 font-medium">Loading profile details...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Stats / Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl flex items-center gap-4 ${isActive ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Account Status</p>
                                        <p className={`font-bold ${isActive ? 'text-green-700' : 'text-red-700'}`}>{isActive ? 'Active' : 'Inactive'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Member Since</p>
                                        <p className="font-bold text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email Address</p>
                                            <p className="text-sm font-medium">{user.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Mobile Number</p>
                                            <p className="text-sm font-medium">{user.mobile || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Specific Section (For Customer) */}
                            {user.role === 'customer' && details?.wishlist?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        Wishlist Items ({details.wishlist.length})
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {details.wishlist.slice(0, 4).map(item => (
                                            <div key={item._id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-semibold truncate">{item.name}</p>
                                                    <p className="text-xs text-indigo-600 font-bold">₹{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Role Specific Section (For Riders) */}
                            {user.role === 'rider' && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-orange-500" />
                                        Performance Overview
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 p-3 rounded-xl text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Deliveries</p>
                                            <p className="font-bold text-lg">{details?.totalDeliveries || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Rating</p>
                                            <p className="font-bold text-lg">{details?.averageRating?.toFixed(1) || '0.0'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Status</p>
                                            <p className={`font-bold text-xs mt-1 ${details?.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                                {details?.isOnline ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
