
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, MapPin, CheckCircle, Loader2, UserCheck, CreditCard, StickyNote } from 'lucide-react';
import { orderService } from '../services/orderService';
import clsx from 'clsx';

const steps = [
    { status: 'placed', label: 'Order Placed', icon: Package },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: Clock },
    { status: 'assigned', label: 'Rider Assigned', icon: UserCheck },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle }
];

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await orderService.getOrderById(orderId);
                setOrder(data);
            } catch (err) {
                console.error("Failed to fetch order", err);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-slate-50 text-center px-4">
                <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-slate-800 text-white rounded-xl">Go Home</button>
            </div>
        );
    }

    // Determine current step index based on order status
    const getStepIndex = (status) => {
        switch (status) {
            case 'pending': return 0;
            case 'placed': return 0; // consistent
            case 'confirmed': return 1;
            case 'accepted': return 1;
            case 'preparing': return 2;
            case 'ready': return 2; // Ready is typically end of preparing
            case 'assigned': return 3;
            case 'picked_up': return 4;
            case 'out-for-delivery': return 4;
            case 'in_transit': return 4;
            case 'out_for_delivery': return 4; // handle underscore/hyphen if inconsistent
            case 'delivered': return 5;
            default: return 0;
        }
    };

    // Check if order exists before running logic
    const activeIndex = order ? getStepIndex(order.status) : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-50">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Track Order</h1>
                        <p className="text-sm text-slate-500">Order ID: #{order.orderNumber || order._id?.slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-6">
                    <div className="relative">
                        {/* Vertical Line for Mobile / Horizontal for Desktop could be better but let's stick to vertical list for reliability on all screens or a simple horizontal one */}
                        {/* Let's do a simple vertical timeline for clarity */}
                        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />

                        <div className="space-y-8 relative">
                            {steps.map((step, index) => {
                                const isCompleted = index <= activeIndex;
                                const isCurrent = index === activeIndex;
                                const Icon = step.icon;

                                return (
                                    <motion.div
                                        key={step.status}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-6 relative"
                                    >
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 transition-colors bg-white",
                                            isCompleted ? "border-emerald-500 text-emerald-600" : "border-slate-200 text-slate-300",
                                            isCurrent && "ring-4 ring-emerald-100"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={clsx("font-bold text-lg", isCompleted ? "text-slate-800" : "text-slate-400")}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-sm text-emerald-600 font-medium">Current Status</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Delivery & Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-600" /> Delivery Address
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {order.deliveryAddress?.address || "No address provided"}
                        </p>
                        {order.deliveryInstructions && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800 flex gap-2">
                                <StickyNote className="w-4 h-4 flex-shrink-0" />
                                <span>Note: {order.deliveryInstructions}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Info
                        </h2>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 text-sm">Method</span>
                            <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Status</span>
                            <span className={clsx(
                                "px-2 py-1 rounded-lg text-xs font-bold",
                                order.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                            )}>
                                {order.paymentStatus?.toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Order Details Preview */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-bold text-slate-800 mb-4">Items in Order</h2>
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-bold text-slate-700">{item.quantity}x</span> {item.product?.name || "Item"}
                                </div>
                                <span className="text-slate-600">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between font-bold text-lg text-emerald-800">
                        <span>Total Paid</span>
                        <span>₹{order.total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
