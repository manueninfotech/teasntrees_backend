import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Package, DollarSign, Bike, Calendar, Clock, ChevronRight } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
    const statuses = {
        pending: 'bg-amber-50 text-amber-600 border-amber-100',
        confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
        preparing: 'bg-orange-50 text-orange-600 border-orange-100',
        ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        waiting_for_rider: 'bg-cyan-50 text-cyan-600 border-cyan-100',
        assigned: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        picked_up: 'bg-teal-50 text-teal-600 border-teal-100',
        'out-for-delivery': 'bg-purple-50 text-purple-600 border-purple-100',
        in_transit: 'bg-violet-50 text-violet-600 border-violet-100',
        delivered: 'bg-green-50 text-green-600 border-green-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${statuses[status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

export default function OrderDetailsModal({ isOpen, onClose, order, token }) {
    if (!isOpen || !order) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Order Details</h2>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1 italic">
                                {order.orderNumber || `#${order._id?.slice(-4).toUpperCase()}`}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Customer & Delivery */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User className="w-4 h-4" /> Customer Info
                                    </h3>
                                    <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 space-y-3">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Name</p>
                                            <p className="font-black text-gray-900 uppercase">{order.customerId?.name || 'GUEST USER'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Contact</p>
                                            <p className="font-black text-gray-900">{order.customerId?.mobile || 'N/A'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Delivery Address
                                    </h3>
                                    <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                                        <p className="font-black text-gray-900 text-sm leading-relaxed uppercase">
                                            {order.deliveryAddress?.address || 'NO ADDRESS SPECIFIED'}
                                        </p>
                                        {order.specialInstructions && (
                                            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Note</p>
                                                <p className="text-xs font-bold text-amber-900">{order.specialInstructions}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Order Summary & Payment */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Payment Details
                                    </h3>
                                    <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Total Amount</p>
                                                    <h4 className="text-4xl font-black tracking-tighter">₹{order.total}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                                                    <p className="text-xs font-black uppercase tracking-widest">{order.paymentStatus}</p>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span>Method</span>
                                                <span>{order.paymentMethod}</span>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    </div>
                                </section>

                                {order.riderId && (
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Bike className="w-4 h-4" /> Delivery Fleet
                                        </h3>
                                        <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-emerald-600 shadow-sm">
                                                    {order.riderId.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase">{order.riderId.name}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.riderId.mobile}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300" />
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Items List */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package className="w-4 h-4" /> Order Items ({order.items?.length || 0})
                            </h3>
                            <div className="bg-gray-50/30 rounded-[2.5rem] border border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-100/50">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-white transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xs font-black text-emerald-600 border border-gray-100 group-hover:scale-110 transition-transform">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.productName || item.name || 'Unknown Item'}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        ₹{item.price} × {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center font-black uppercase tracking-widest text-[10px]">
                                    <span className="text-gray-400">Subtotal Amount</span>
                                    <span className="text-gray-900 text-sm">₹{order.subtotal || order.total}</span>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="space-y-4 pb-8">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Progress Timeline
                            </h3>
                            <div className="p-8 bg-gray-50/30 rounded-[2.5rem] border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Placed At</p>
                                    <p className="text-xs font-black text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                {order.confirmedAt && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Confirmed</p>
                                        <p className="text-xs font-black text-gray-900">{new Date(order.confirmedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {order.status === 'delivered' && order.updatedAt && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                                        <p className="text-xs font-black text-gray-900">{new Date(order.updatedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
