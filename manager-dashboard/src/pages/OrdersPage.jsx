import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search, RefreshCw, ChevronDown, ChevronUp,
    User, MapPin, Package,
    CheckCircle, ShoppingBag,
    XCircle, ChefHat, ClipboardCheck, Phone
} from 'lucide-react';
import React from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useRefresh } from '../context/RefreshContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'teasntrees';
    const { socket } = useSocket();
    const { tick, bump } = useRefresh();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/orders');
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [tick, b]);

    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = (order) => {
            setOrders(prev => [order, ...prev]);
        };

        const handleStatusUpdate = (update) => {
            setOrders(prev => prev.map(o =>
                (o._id === update.orderId || o._id === update._id)
                    ? { ...o, ...update }
                    : o
            ));
        };

        socket.on('order:new', handleNewOrder);
        socket.on('order:status_update', handleStatusUpdate);

        return () => {
            socket.off('order:new', handleNewOrder);
            socket.off('order:status_update', handleStatusUpdate);
        };
    }, [socket]);

    const handleUpdateStatus = async (orderId, status) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
            await api.patch(`/manager/orders/${orderId}/status`, { status });
        } catch (error) {
            console.error('Update failed:', error);
            fetchOrders(); // Revert on error
        }
    };

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'confirmed': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'preparing': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'ready': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Live Orders</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Real-time management terminal</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync System
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

                <div className="flex flex-col space-y-4">
                    <div className="flex flex-wrap items-center gap-2 relative z-10">
                        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${statusFilter === status
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-brand-primary/30 hover:text-brand-primary'}`}
                            >
                                {status.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative group/search z-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-brand-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12 bg-gray-50/50 border-gray-100 focus:bg-white text-[10px] font-bold uppercase tracking-widest placeholder:text-gray-300"
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table Layout */}
            <div className="glass-card p-0 border border-gray-100 shadow-xl shadow-gray-900/5 overflow-hidden rounded-[3rem]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-10 py-8">Order</th>
                                <th className="px-10 py-8">Customer & Items</th>
                                <th className="px-10 py-8 text-center">Status</th>
                                <th className="px-10 py-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <React.Fragment key={order._id}>
                                    <tr className={`group transition-all cursor-pointer ${expandedOrder === order._id ? 'bg-brand-primary/[0.02]' : 'hover:bg-gray-50/50'}`} onClick={() => toggleExpand(order._id)}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center font-black text-xs text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                                                    #{order.orderNumber?.slice(-4) || order._id?.slice(-4).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 text-sm tracking-tight uppercase">Order Confirmed</span>
                                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1 italic">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col max-w-[400px]">
                                                <span className="font-black text-gray-900 text-[11px] uppercase mb-3 tracking-widest flex items-center gap-2">
                                                    <User className="w-3 h-3 text-brand-primary" />
                                                    {order.customerId?.name || 'GUEST USER'}
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                                            <span className="text-[9px] font-black text-brand-primary">{item.quantity}×</span>
                                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight truncate max-w-[120px]">{item.productName || item.name}</span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                                            <span className="text-[9px] font-black text-gray-400">+{order.items.length - 2} More Items</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`inline-flex px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${getStatusColor(order.status)}`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-6">
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-0.5 whitespace-nowrap">Net Amount</span>
                                                    <span className="font-black text-xl text-gray-900 tracking-tighter">₹{order.total}</span>
                                                </div>
                                                <div
                                                    className={`p-3 rounded-2xl transition-all ${expandedOrder === order._id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'bg-gray-50 text-gray-400 hover:bg-white hover:text-brand-primary hover:shadow-md'}`}
                                                >
                                                    {expandedOrder === order._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedOrder === order._id && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-gray-50/30 overflow-hidden"
                                            >
                                                <td colSpan="4" className="px-10 py-12">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                                        {/* Left: Detailed Manifest */}
                                                        <div className="lg:col-span-2 space-y-8">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div className="p-2 bg-brand-primary/5 rounded-lg">
                                                                        <ShoppingBag className="w-4 h-4 text-brand-primary" />
                                                                    </div>
                                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order Details</h4>
                                                                </div>

                                                                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-4">
                                                                    {order.items.map((item, i) => (
                                                                        <div key={i} className="flex items-center justify-between pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                                                            <div className="flex items-center gap-5">
                                                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[11px] font-black text-brand-primary border border-gray-100">{item.quantity}x</div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{item.productName || item.name}</span>
                                                                                    {item.customization && (
                                                                                        <p className="text-[10px] font-bold text-brand-primary/60 mt-1 uppercase italic">"{item.customization}"</p>
                                                                                    )}
                                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                                        {item.variant && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border border-gray-100">{item.variant}</span>}
                                                                                        {item.isEggless && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Eggless</span>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-sm font-black text-gray-900 tracking-tight">₹{item.price * item.quantity}</span>
                                                                        </div>
                                                                    ))}

                                                                    <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100 space-y-3">
                                                                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                            <span>Subtotal</span>
                                                                            <span>₹{order.subtotal || order.total - (order.deliveryCharge || 0)}</span>
                                                                        </div>
                                                                        {order.deliveryCharge > 0 && (
                                                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                                <span>Logistics Fee</span>
                                                                                <span>₹{order.deliveryCharge}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between items-center pt-4">
                                                                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Total Amount</span>
                                                                            <span className="text-3xl font-black text-brand-primary tracking-tighter">₹{order.total}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-brand-primary/5 rounded-lg">
                                                                            <MapPin className="w-4 h-4 text-brand-primary" />
                                                                        </div>
                                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Destination</h4>
                                                                    </div>
                                                                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full">
                                                                        <p className="text-xs font-black text-gray-900 uppercase leading-relaxed mb-4 text-balance">
                                                                            {order.deliveryAddress?.address || 'Self Pickup'}
                                                                        </p>
                                                                        <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-t border-gray-50 pt-4">
                                                                            <span>Method</span>
                                                                            <span className="text-brand-primary">{order.paymentMethod}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-brand-primary/5 rounded-lg">
                                                                            <Phone className="w-4 h-4 text-brand-primary" />
                                                                        </div>
                                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Contact</h4>
                                                                    </div>
                                                                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full">
                                                                        <p className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">{order.customerId?.name || 'Guest Citizen'}</p>
                                                                        <p className="text-xs font-extrabold text-brand-primary mb-4">{order.customerId?.mobile || 'No Mobile Contact'}</p>
                                                                        {order.specialInstructions && (
                                                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                                                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Directives</p>
                                                                                <p className="text-xs font-bold text-amber-800 uppercase italic leading-tight">"{order.specialInstructions}"</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right: Security & Workflow Controls */}
                                                        <div className="space-y-8">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="p-2 bg-brand-primary/5 rounded-lg">
                                                                    <CheckCircle className="w-4 h-4 text-brand-primary" />
                                                                </div>
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Update Status</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-4">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, 'confirmed'); }}
                                                                    disabled={['preparing', 'ready', 'delivered', 'cancelled', 'confirmed'].includes(order.status)}
                                                                    className={`group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 ${order.status === 'confirmed' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white border-gray-100 text-gray-900 hover:border-blue-600 hover:shadow-md'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`p-3 rounded-xl transition-colors ${order.status === 'confirmed' ? 'bg-white/20' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                                            <ClipboardCheck className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Confirm</span>
                                                                            <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Order Confirmation</span>
                                                                        </div>
                                                                    </div>
                                                                    {order.status === 'confirmed' && <CheckCircle className="w-5 h-5" />}
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, 'preparing'); }}
                                                                    disabled={['ready', 'delivered', 'cancelled', 'preparing'].includes(order.status)}
                                                                    className={`group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 ${order.status === 'preparing' ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-white border-gray-100 text-gray-900 hover:border-orange-500 hover:shadow-md'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`p-3 rounded-xl transition-colors ${order.status === 'preparing' ? 'bg-white/20' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                                                            <ChefHat className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Kitchen</span>
                                                                            <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Start Preparation</span>
                                                                        </div>
                                                                    </div>
                                                                    {order.status === 'preparing' && <CheckCircle className="w-5 h-5" />}
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, 'ready'); }}
                                                                    disabled={['delivered', 'cancelled', 'ready'].includes(order.status)}
                                                                    className={`group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 ${order.status === 'ready' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'bg-white border-gray-100 text-gray-900 hover:border-emerald-600 hover:shadow-md'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`p-3 rounded-xl transition-colors ${order.status === 'ready' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                                                            <Package className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Mark Ready</span>
                                                                            <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Ready for pickup</span>
                                                                        </div>
                                                                    </div>
                                                                    {order.status === 'ready' && <CheckCircle className="w-5 h-5" />}
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to CANCEL this order? This action is irreversible.')) handleUpdateStatus(order._id, 'cancelled'); }}
                                                                    disabled={['delivered', 'cancelled'].includes(order.status)}
                                                                    className={`group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 ${order.status === 'cancelled' ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-600/20' : 'bg-white border-gray-100 text-gray-900 hover:border-red-600 hover:shadow-md'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`p-3 rounded-xl transition-colors ${order.status === 'cancelled' ? 'bg-white/20' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                                                                            <XCircle className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Cancel</span>
                                                                            <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Cancel Order</span>
                                                                        </div>
                                                                    </div>
                                                                    {order.status === 'cancelled' && <CheckCircle className="w-5 h-5" />}
                                                                </button>

                                                                <div className="mt-4 p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] relative overflow-hidden">
                                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                                                                    <h5 className="text-[9px] font-black text-gray-900 uppercase tracking-[0.2em] mb-3">Current Status of Order</h5>
                                                                    <p className="text-[10px] font-bold text-gray-500 uppercase italic leading-relaxed">
                                                                        Secure order processing system. Every action is logged and affects live tracking for both customers and riders.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30">
                                            <ShoppingBag className="w-12 h-12 text-gray-400 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">No orders found in current vector</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
