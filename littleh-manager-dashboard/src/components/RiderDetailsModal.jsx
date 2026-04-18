import { useState, useEffect } from 'react';
import { X, User, Bike, FileText, CreditCard, Phone, Star, TrendingUp, MapPin, Calendar, MessageSquare, Clock } from 'lucide-react';
import api from '../utils/api';

const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ))}
    </div>
);

export default function RiderDetailsModal({ isOpen, onClose, rider, onUpdate }) {
    const [activeTab, setActiveTab] = useState('details');

    if (!isOpen || !rider) return null;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const isLicenseExpired = rider.licenseExpiryDate && new Date(rider.licenseExpiryDate) < new Date();

    const handleApprove = async () => {
        try {
            await api.put(`/manager/riders/${rider._id}/approve`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to approve rider:', error);
        }
    };

    const handleSuspend = async () => {
        const reason = prompt('Enter reason for suspension:');
        if (reason === null) return;
        try {
            await api.put(`/manager/riders/${rider._id}/suspend`, { reason });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to suspend rider:', error);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this application?')) return;
        try {
            await api.delete(`/manager/riders/${rider._id}/reject`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to reject rider:', error);
        }
    };

    const StatusBadge = ({ label, active, color }) => (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${active ? `bg-${color}-100 text-${color}-600` : 'bg-gray-100 text-gray-400'}`}>
            {label}: {active ? 'YES' : 'NO'}
        </span>
    );

    return (
        <div className="fixed inset-0 bg-bakery-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-50 p-8 flex items-center justify-between z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-bakery-bg rounded-[2rem] flex items-center justify-center border border-bakery-light">
                            <Bike className="w-10 h-10 text-bakery-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">{rider.name}</h2>
                            <p className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] mt-1 italic italic">
                                {rider.isApproved ? 'Rider Management Profile' : 'New Rider Application'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-bakery-primary hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1">
                    <div className="space-y-8">
                        {/* Status Grid */}
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge label="Approved" active={rider.isApproved} color="emerald" />
                            <StatusBadge label="Active" active={rider.isActive} color="blue" />
                            <StatusBadge label="Online" active={rider.isOnline} color="emerald" />
                            <StatusBadge label="Busy" active={rider.isOnDelivery} color="orange" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Performance Stats */}
                            <div className="space-y-4 col-span-1 md:col-span-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Deliveries', value: rider.totalDeliveries || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                                        { label: 'Rating', value: (rider.averageRating || 0).toFixed(1), icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50/50' },
                                        { label: 'Earnings', value: `₹${rider.totalEarnings || 0}`, icon: CreditCard, color: 'text-bakery-primary', bg: 'bg-bakery-bg' },
                                        { label: 'Vehicle', value: rider.vehicleNumber || 'N/A', icon: Bike, color: 'text-purple-600', bg: 'bg-purple-50/50' }
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} rounded-[2rem] p-6 border border-white`}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 bg-white rounded-xl ${stat.color} shadow-sm`}>
                                                    <stat.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-black text-bakery-accent uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <p className="text-xl font-black text-bakery-primary tracking-tight">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6">
                                <h3 className="text-[10px] font-black text-bakery-accent uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Contact Information
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Number</p>
                                        <p className="font-black text-bakery-primary text-sm tracking-tight">{rider.mobile}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                        <p className="font-black text-bakery-primary text-sm tracking-tight">{rider.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Joined On</p>
                                        <p className="font-black text-bakery-primary text-sm tracking-tight">{formatDate(rider.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Personal */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6">
                                <h3 className="text-[10px] font-black text-bakery-accent uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-4 h-4" /> Identity & Vehicle
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                                        <p className="font-black text-bakery-primary text-xs uppercase">{rider.vehicleType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Aadhar Number</p>
                                        <p className="font-black text-bakery-primary text-xs">{rider.aadharNumber || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">License No</p>
                                        <p className="font-black text-bakery-primary text-xs uppercase">{rider.licenseNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-bakery-light/20 border border-bakery-light/50 rounded-[2rem] p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-bakery-primary shadow-sm"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest">Current Location (GPS)</p>
                                    <p className="text-[10px] font-black text-bakery-primary uppercase tracking-tight">
                                        {rider.currentLocation?.coordinates?.[1]}, {rider.currentLocation?.coordinates?.[0]}
                                    </p>
                                </div>
                            </div>
                            {rider.currentLocation?.coordinates && (
                                <a
                                    href={`https://www.google.com/maps?q=${rider.currentLocation.coordinates[1]},${rider.currentLocation.coordinates[0]}`}
                                    target="_blank"
                                    className="px-6 py-2 bg-bakery-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-bakery-primary/20"
                                >
                                    View on Map
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
                    {!rider.isApproved ? (
                        <>
                            <button onClick={handleApprove} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Approve Application</button>
                            <button onClick={handleReject} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100">Reject Application</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleSuspend} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${rider.isActive ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700' : 'bg-bakery-primary text-white shadow-bakery-light hover:bg-bakery-primary'}`}>
                                {rider.isActive ? 'Suspend Rider' : 'Re-Activate Rider'}
                            </button>
                            <button onClick={handleReject} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Remove permanently</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
