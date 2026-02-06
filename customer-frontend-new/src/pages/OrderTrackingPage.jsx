import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, MapPin, CheckCircle, Loader2, UserCheck, CreditCard, StickyNote, Bike, ShieldCheck, FileText, XCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useSocket } from '../context/SocketContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const steps = [
    { status: 'placed', label: 'Order Placed', icon: Package },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: Clock },
    { status: 'waiting_for_rider', label: 'Waiting for Rider', icon: Clock },
    { status: 'assigned', label: 'Rider Assigned', icon: UserCheck },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Bike },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle }
];

const LIVE_STATUSES = new Set([
    'assigned',
    'accepted',
    'heading_to_pickup',
    'arrived_at_pickup',
    'picked_up',
    'out-for-delivery',
    'out_for_delivery',
    'in_transit',
    'arrived'
]);

const DELIVERY_AWARE_STATUSES = new Set([
    'preparing',
    'ready',
    'waiting_for_rider',
    'assigned',
    'picked_up',
    'out-for-delivery',
    'out_for_delivery',
    'in_transit',
    'arrived'
]);

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [order, setOrder] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [etaMinutes, setEtaMinutes] = useState(null);

    const fetchDeliveryByOrder = useCallback(async (id) => {
        try {
            const delivery = await orderService.getDeliveryByOrder(id || orderId);
            setDeliveryInfo(delivery);
        } catch (err) {
            // If delivery is not ready yet, just ignore
            setDeliveryInfo(null);
        }
    }, [orderId]);

    const fetchOrder = useCallback(async () => {
        try {
            const data = await orderService.getOrderById(orderId);
            setOrder(data);
            if (data && DELIVERY_AWARE_STATUSES.has(data.status)) {
                await fetchDeliveryByOrder(data._id);
            } else {
                setDeliveryInfo(null);
                setEtaMinutes(null);
            }
        } catch (err) {
            console.error("Failed to fetch order", err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    }, [orderId, fetchDeliveryByOrder]);

    const calculateEtaFromRider = useCallback(() => {
        if (!deliveryInfo?.rider?.location?.coordinates) return null;
        const coords = deliveryInfo.rider.location.coordinates;
        const riderLng = coords[0];
        const riderLat = coords[1];

        const deliveryCoords = deliveryInfo.deliveryAddress?.location?.coordinates
            || order?.deliveryAddress?.location?.coordinates;

        if (!deliveryCoords || deliveryCoords.length !== 2) return null;
        const destLng = deliveryCoords[0];
        const destLat = deliveryCoords[1];

        // Haversine distance helper
        const getDistKm = (lat1, lon1, lat2, lon2) => {
            const toRad = (v) => (v * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const status = deliveryInfo.status || order.status;
        let totalDistanceKm = 0;

        // Multi-Leg Logic:
        // Statuses before pickup: leg 1 (Rider to Outlet) + leg 2 (Outlet to Customer)
        const isBeforePickup = ['assigned', 'accepted', 'heading_to_pickup', 'arrived_at_pickup'].includes(status);

        if (isBeforePickup && deliveryInfo.pickupLocation?.coordinates) {
            const outletLng = deliveryInfo.pickupLocation.coordinates[0];
            const outletLat = deliveryInfo.pickupLocation.coordinates[1];

            // Leg 1: Rider -> Outlet
            const leg1 = getDistKm(riderLat, riderLng, outletLat, outletLng);
            // Leg 2: Outlet -> Customer
            const leg2 = getDistKm(outletLat, outletLng, destLat, destLng);

            totalDistanceKm = leg1 + leg2;
        } else {
            // After pickup: Rider -> Customer
            totalDistanceKm = getDistKm(riderLat, riderLng, destLat, destLng);
        }

        // Simple average speed estimate (25 km/h)
        const avgSpeedKmh = 25;
        const minutes = Math.max(1, Math.round((totalDistanceKm / avgSpeedKmh) * 60));
        return minutes;
    }, [deliveryInfo, order]);

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId, fetchOrder]);

    useEffect(() => {
        if (!order) return;
        const statusForEta = deliveryInfo?.status || order.status;
        if (!LIVE_STATUSES.has(statusForEta)) {
            setEtaMinutes(null);
            return;
        }
        const minutes = calculateEtaFromRider();
        if (minutes !== null) {
            setEtaMinutes(minutes);
        } else if (statusForEta === 'assigned') {
            setEtaMinutes(10);
        } else {
            setEtaMinutes(null);
        }
    }, [order, deliveryInfo, calculateEtaFromRider]);

    // Poll rider location after pickup to keep ETA fresh
    useEffect(() => {
        if (!order || !DELIVERY_AWARE_STATUSES.has(order.status)) return;

        fetchDeliveryByOrder(order._id);
        const interval = setInterval(() => {
            fetchDeliveryByOrder(order._id);
        }, 20000);

        return () => clearInterval(interval);
    }, [order, fetchDeliveryByOrder]);

    // Socket Listener for Real-time Updates
    useEffect(() => {
        if (!socket || !orderId) return;

        // Join the specific order room
        socket.emit('order:join', orderId);

        const handleUpdate = (data) => {
            if (data.orderId === orderId) {
                console.log('socket update received:', data);
                // toast.success(`Order updated: ${data.status.replace('_', ' ')}`); // Optional: don't spam toasts
                fetchOrder(); // Refresh full data
                if (order?.status && DELIVERY_AWARE_STATUSES.has(order.status)) {
                    fetchDeliveryByOrder(orderId);
                }
            }
        };

        socket.on('order:status-updated', handleUpdate);
        socket.on('delivery:status-updated', handleUpdate);
        socket.on('delivery:assigned', handleUpdate);
        socket.on('order:rider-assigned', handleUpdate);

        return () => {
            socket.emit('order:leave', orderId);
            socket.off('order:status-updated', handleUpdate);
            socket.off('delivery:status-updated', handleUpdate);
            socket.off('delivery:assigned', handleUpdate);
            socket.off('order:rider-assigned', handleUpdate);
        };
    }, [socket, orderId, fetchOrder]);

    const handleDownloadInvoice = async () => {
        setIsDownloading(true);
        try {
            const blob = await orderService.downloadInvoice(orderId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice-${order.orderNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Invoice downloaded!");
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download invoice");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

        setIsCancelling(true);
        try {
            await orderService.cancelOrder(orderId);
            toast.success("Order cancelled successfully");
            fetchOrder();
        } catch (error) {
            console.error("Cancellation failed", error);
            toast.error(error.response?.data?.message || "Failed to cancel order");
        } finally {
            setIsCancelling(false);
        }
    };

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
            case 'placed': return 0;
            case 'confirmed': return 1;
            case 'accepted': return 1;
            case 'preparing': return 2;
            case 'ready': return 3;
            case 'waiting_for_rider': return 3;
            case 'assigned': return 4;
            case 'picked_up': return 5;
            case 'out-for-delivery': return 5;
            case 'in_transit': return 5;
            case 'out_for_delivery': return 5;
            case 'delivered': return 6;
            default: return 0;
        }
    };

    const activeIndex = order ? getStepIndex(order.status) : 0;

    // Calculate Estimated Time
    // Priority: 1. Live rider ETA (assigned or after pickup), 2. Delivery Model Estimate, 3. Order Model Estimate, 4. Default (Created + 45m)
    let rawEstimatedTime = etaMinutes
        ? new Date(Date.now() + etaMinutes * 60000)
        : order.delivery?.estimatedTime
            ? new Date(Date.now() + order.delivery.estimatedTime * 60000)
            : order.estimatedDeliveryTime
                ? new Date(order.estimatedDeliveryTime)
                : new Date(new Date(order.createdAt).getTime() + 45 * 60000);

    // Common Sense Safeguard: If order is active but estimate is in the past, shift it forward
    const isTerminal = ['delivered', 'cancelled'].includes(order.status);
    if (!isTerminal && rawEstimatedTime < new Date()) {
        rawEstimatedTime = new Date(Date.now() + 15 * 60000); // Default to +15 mins from now
    }

    const estimatedTime = rawEstimatedTime;

    // Get OTP from Delivery Model (exposed by backend only when active)
    const deliveryOtp = order.delivery?.deliveryOtp;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-50">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Track Order</h1>
                            <p className="text-sm text-slate-500">Order ID: #{order.orderNumber || order._id?.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            <FileText className="w-4 h-4" />
                            {isDownloading ? 'Downloading...' : 'Invoice'}
                        </button>

                        {['pending', 'placed'].includes(order.status) && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Estimated Time & OTP Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            {order.status === 'delivered' ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-1">Delivered At</p>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {new Date(order.deliveredAt || order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-500 mb-1">Estimated Delivery</p>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </h2>
                                </>
                            )}
                        </div>
                        <div className={clsx(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            order.status === 'delivered' ? "bg-emerald-100 text-emerald-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            {order.status === 'delivered' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                    </div>

                    {/* Show OTP Card only if OTP is available (Production Ready Safe-guard) */}
                    {deliveryOtp ? (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-orange-50 to-transparent pointer-events-none" />
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Delivery OTP</p>
                                <h2 className="text-3xl font-mono font-bold text-cafe-orange tracking-widest">
                                    {deliveryOtp}
                                </h2>
                                <p className="text-xs text-orange-600/80 mt-1">Share with rider upon delivery</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 z-10">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between opacity-60">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Delivery OTP</p>
                                <h2 className="text-xl font-bold text-slate-400">
                                    -- -- -- --
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Available when out for delivery</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>
                    )}
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
                                // If it's the current step, we show the 'Vehicle' (Bike) moving to this point
                                // Otherwise we show the static checkpoint icon
                                const Icon = isCurrent ? Bike : step.icon;

                                return (
                                    <motion.div
                                        key={step.status}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-6 relative"
                                    >
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 transition-colors",
                                            isCurrent
                                                ? "bg-cafe-orange border-cafe-orange text-white shadow-lg shadow-orange-200 scale-110"
                                                : isCompleted
                                                    ? "bg-white border-emerald-500 text-emerald-600"
                                                    : "bg-white border-slate-200 text-slate-300"
                                        )}>
                                            <Icon className={clsx("w-5 h-5", isCurrent && "animate-pulse")} />
                                        </div>
                                        <div>
                                            <p className={clsx("font-bold text-lg", isCompleted ? "text-slate-800" : "text-slate-400")}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-sm text-emerald-600 font-medium">
                                                    {index === steps.length - 1 ? 'Successfully Delivered' :
                                                        index === 3 ? 'Searching for nearby riders...' :
                                                            index < 3 ? 'Processing your order...' : 'Rider is on the way'}
                                                </p>
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
