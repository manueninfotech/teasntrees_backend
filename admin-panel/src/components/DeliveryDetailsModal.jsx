import React from 'react';
import {
    X, Package, User, Bike, MapPin,
    Clock, Phone, CheckCircle2, AlertCircle,
    Navigation, ShieldCheck, Mail, IndianRupee
} from 'lucide-react';

const DeliveryDetailsModal = ({ isOpen, onClose, delivery }) => {
    if (!isOpen || !delivery) return null;

    const timeline = [
        { status: 'assigned', label: 'Rider Assigned', time: delivery.createdAt, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { status: 'picked_up', label: 'Order Picked Up', time: delivery.pickedUpAt, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { status: 'in_transit', label: 'Out for Delivery', time: delivery.pickedUpAt, icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50' },
        { status: 'delivered', label: 'Successfully Delivered', time: delivery.deliveredAt, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
        { status: 'cancelled', label: 'Delivery Cancelled', time: delivery.cancelledAt, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
    ].filter(step => step.time || step.status === delivery.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-white flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse">
                            <Truck className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Details</h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${delivery.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                    }`}>
                                    {delivery.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-0.5">Order #{delivery.orderId?.orderNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl border border-gray-100 transition-all hover:rotate-90 z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Decorative Blob */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Left Column: Entities */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Entity Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4 hover:shadow-lg hover:shadow-indigo-50/20 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <User className="w-3 h-3" /> Customer
                                        </h3>
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Phone className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-gray-900 truncate">{delivery.customerId?.name}</p>
                                        <p className="text-sm text-gray-500 font-medium mt-1">{delivery.customerId?.mobile}</p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Delivery Address</p>
                                        <p className="text-xs text-gray-600 font-bold leading-relaxed">{delivery.customerId?.address}</p>
                                    </div>
                                </div>

                                {/* Rider Info */}
                                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:border-indigo-100 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Bike className="w-3 h-3" /> Rider
                                        </h3>
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-gray-900 truncate">{delivery.riderId?.name || 'Searching...'}</p>
                                        <p className="text-sm text-gray-500 font-medium mt-1">{delivery.riderId?.mobile || 'N/A'}</p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Rider Earnings</p>
                                            <p className="text-sm font-black text-indigo-600">₹{delivery.totalEarning || 0}</p>
                                        </div>
                                        <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">View History</button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/50 space-y-6">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5" /> Order Summary
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-indigo-100 shadow-md">
                                            <IndianRupee className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-gray-900">₹{delivery.orderId?.total}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Total Amount</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900 uppercase">Cash on Delivery</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Payment Method</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Timeline */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Delivery Timeline
                            </h3>
                            <div className="relative space-y-8 pl-8 ml-2">
                                {/* Timeline Line */}
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                {timeline.map((event, index) => (
                                    <div key={index} className="relative group">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${index === timeline.length - 1 ? 'bg-indigo-600 ring-4 ring-indigo-50 scale-125' : 'bg-gray-200'
                                            }`}>
                                            {index === timeline.length - 1 && <div className="w-1 h-1 bg-white rounded-full"></div>}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <p className={`text-sm font-black uppercase tracking-tight ${index === timeline.length - 1 ? 'text-gray-900 font-black' : 'text-gray-400'
                                                }`}>
                                                {event.label}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {event.time ? new Date(event.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Location Context */}
                            <div className="pt-6 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Live Location</p>
                                <div className="h-40 bg-gray-100 rounded-3xl flex flex-col items-center justify-center gap-3 border border-gray-200 border-dashed group transition-all hover:bg-indigo-50 hover:border-indigo-200">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-400 shadow-sm transition-all group-hover:scale-110">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-xs font-black uppercase transition-colors ${delivery.currentLocation?.coordinates ? 'text-green-600' : 'text-gray-500'}`}>
                                            {delivery.currentLocation?.coordinates ? 'Rider is Live' : 'Location Sync Pending'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            {delivery.currentLocation?.coordinates ? 'Positioning active' : 'Rider location not available'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Time</p>
                            <p className="text-sm font-black text-gray-900">42 mins</p>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-12 py-4 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all uppercase tracking-widest shadow-lg active:scale-95"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Truck Icon as it was used in code but not imported
const Truck = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
    </svg>
);

export default DeliveryDetailsModal;
