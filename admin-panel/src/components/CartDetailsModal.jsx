import React from 'react';
import { X, ShoppingBag, User, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

const CartDetailsModal = ({ cart, onClose }) => {
    if (!cart) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-white flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <ShoppingBag className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cart Details</h2>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-0.5">Abandoned for {cart.daysAbandoned} days</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl border border-gray-100 transition-all hover:rotate-90"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Customer Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Customer Information
                            </h3>
                            <div>
                                <p className="text-lg font-black text-gray-900">{cart.userName}</p>
                                <div className="flex items-center gap-2 text-gray-500 font-medium mt-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span className="text-sm">{cart.userMobile}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end space-y-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl w-fit">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-bold text-gray-600">Last Active: {new Date(cart.lastUpdated).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl w-fit">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-gray-600">Registered Customer</span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Cart Items ({cart.itemCount})</h3>
                            <span className="text-[10px] font-black px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase">Subtotal: ₹{cart.subtotal}</span>
                        </div>

                        <div className="space-y-3">
                            {cart.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/20 transition-all group">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-300 group-hover:text-indigo-200 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-sm">₹{item.price * item.quantity}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">₹{item.price} / unit</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all uppercase tracking-widest"
                    >
                        Close Details
                    </button>
                    <a
                        href={`https://wa.me/${cart.userMobile}?text=Hi ${cart.userName}, we noticed you left some items in your cart at LittleH. Would you like to complete your order?`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-3 px-8 py-4 bg-indigo-600 hover:bg-black text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        Send Reminder
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CartDetailsModal;
