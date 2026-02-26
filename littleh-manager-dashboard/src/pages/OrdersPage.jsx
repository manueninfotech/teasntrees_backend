import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search, RefreshCw, ChevronDown, ChevronUp,
    User, MapPin, Package, ArrowRight, PlayCircle,
    CheckCircle, Clock, ShoppingBag, Eye, AlertCircle
} from 'lucide-react';
import React from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useRefresh } from '../context/RefreshContext';

export default function OrdersPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
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
        const handleUpdate = () => bump();
        socket.on('order:new', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        return () => {
            socket.off('order:new', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
        };
    }, [socket, bump]);

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await api.put(`/manager/orders/${orderId}/status`, { status });
            bump();
        } catch (error) {
            console.error('Update failed:', error);
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Active Orders</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Management interface</p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-bakery-primary text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg shadow-bakery-primary/20 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === status
                                ? 'bg-bakery-primary text-white shadow-lg shadow-bakery-primary/20'
                                : 'bg-bakery-light text-bakery-accent hover:bg-white hover:text-bakery-primary'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-accent" />
                    <input
                        type="text"
                        placeholder="Search by ID or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Orders Table-like Grid */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-bakery-light/50 text-[10px] font-black text-bakery-accent uppercase tracking-widest">
                                <th className="px-8 py-6">Order</th>
                                <th className="px-8 py-6">Customer & Items</th>
                                <th className="px-8 py-6 text-center">Status</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bakery-light">
                            {filteredOrders.map((order) => (
                                <React.Fragment key={order._id}>
                                    <tr className="group hover:bg-bakery-light/20 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-bakery-primary text-sm">#{order.orderNumber}</span>
                                                <span className="text-[10px] font-bold text-bakery-accent uppercase tracking-tighter mt-1 italic">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col max-w-[400px]">
                                                <span className="font-black text-bakery-primary text-xs uppercase mb-2">{order.customerId?.name || '---'}</span>
                                                <div className="space-y-1">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-bakery-accent shrink-0">{item.quantity}x</span>
                                                            <span className="text-[10px] font-bold text-bakery-primary uppercase tracking-tight truncate">{item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                                                    order.status === 'preparing' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-black text-lg mr-4 text-bakery-primary">₹{order.total}</span>
                                                <button
                                                    onClick={() => toggleExpand(order._id)}
                                                    className={`p-2 rounded-xl transition-all ${expandedOrder === order._id ? 'bg-bakery-primary text-white shadow-lg' : 'bg-bakery-light text-bakery-accent hover:bg-white'}`}
                                                >
                                                    {expandedOrder === order._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrder === order._id && (
                                        <tr className="bg-bakery-light/10">
                                            <td colSpan="4" className="px-8 py-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Left: Details & Items */}
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-4">Order Items</h4>
                                                            <div className="bg-white rounded-3xl p-6 border border-bakery-light space-y-3">
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="flex items-center justify-between pb-3 border-b border-bakery-light last:border-0 last:pb-0">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-bakery-light flex items-center justify-center text-[10px] font-black text-bakery-primary">{item.quantity}x</div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-black text-bakery-primary uppercase">{item.name}</span>
                                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                                    {item.size && <span className="text-[10px] font-bold text-bakery-accent uppercase tracking-tighter bg-bakery-light px-2 py-0.5 rounded">Size: {item.size}</span>}
                                                                                    {item.isEggless && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic">Eggless</span>}
                                                                                </div>
                                                                                {item.customization && (
                                                                                    <p className="text-xs font-bold text-bakery-accent mt-2 line-clamp-2 italic">"{item.customization}"</p>
                                                                                )}
                                                                                {item.customizationDetails && (
                                                                                    <div className="mt-2 space-y-2 bg-bakery-light/30 p-4 rounded-xl border border-bakery-light/50">
                                                                                        {item.customizationDetails.cakeMessage && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-[9px] font-black text-bakery-accent uppercase tracking-widest">Cake Message</span>
                                                                                                <span className="text-xs font-black text-bakery-primary uppercase">"{item.customizationDetails.cakeMessage}"</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                                                                            {item.customizationDetails.colorTheme && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[9px] font-black text-bakery-accent uppercase tracking-widest">Color Theme</span>
                                                                                                    <span className="text-xs font-bold text-bakery-primary uppercase">{item.customizationDetails.colorTheme}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {item.customizationDetails.designDescription && (
                                                                                                <div className="flex flex-col col-span-2">
                                                                                                    <span className="text-[9px] font-black text-bakery-accent uppercase tracking-widest">Design Details</span>
                                                                                                    <span className="text-xs font-bold text-bakery-primary uppercase leading-tight">{item.customizationDetails.designDescription}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-bakery-primary">₹{item.price * item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-3 flex justify-between items-center bg-bakery-light/30 -mx-6 px-6 -mb-6 rounded-b-3xl">
                                                                    <span className="text-[10px] font-black text-bakery-accent uppercase">Order Total</span>
                                                                    <span className="text-xl font-black text-bakery-primary">₹{order.total}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-4">Delivery Information</h4>
                                                            <div className="bg-white rounded-3xl p-6 border border-bakery-light space-y-4">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="p-3 bg-bakery-light rounded-2xl"><MapPin className="w-4 h-4 text-bakery-primary" /></div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-bakery-primary uppercase leading-tight">
                                                                            {order.deliveryAddress?.address || 'Pickup from store'}
                                                                        </p>
                                                                        <p className="text-[8px] font-bold text-bakery-accent uppercase tracking-widest">Address</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-4">
                                                                    <div className="p-3 bg-bakery-light rounded-2xl"><User className="w-4 h-4 text-bakery-primary" /></div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-bakery-primary uppercase leading-tight">{order.customerId?.name || 'Guest Customer'}</p>
                                                                        <p className="text-[8px] font-bold text-bakery-accent uppercase tracking-widest">Phone: {order.customerId?.mobile || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                                {order.specialInstructions && (
                                                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Special Instructions</p>
                                                                        <p className="text-xs font-bold text-orange-800 uppercase italic">"{order.specialInstructions}"</p>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between pt-2">
                                                                    <span className="text-[8px] font-black text-bakery-accent uppercase tracking-widest">Payment Method</span>
                                                                    <span className="px-3 py-1 bg-bakery-light rounded-full text-[9px] font-black text-bakery-primary uppercase">{order.paymentMethod}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Status Controls */}
                                                    <div className="space-y-6">
                                                        <h4 className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-4">Update Status</h4>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                                                                    disabled={order.status === 'confirmed'}
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${order.status === 'confirmed' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-bakery-light text-bakery-primary hover:border-blue-600'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <PlayCircle className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Confirm Order</span>
                                                                    </div>
                                                                    {order.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order._id, 'preparing')}
                                                                    disabled={order.status === 'preparing'}
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${order.status === 'preparing' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-bakery-light text-bakery-primary hover:border-purple-600'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Start Preparing</span>
                                                                    </div>
                                                                    {order.status === 'preparing' && <CheckCircle className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order._id, 'ready')}
                                                                    disabled={order.status === 'ready'}
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${order.status === 'ready' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-bakery-light text-bakery-primary hover:border-emerald-600'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Package className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mark as Ready</span>
                                                                    </div>
                                                                    {order.status === 'ready' && <CheckCircle className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                                                    disabled={order.status === 'delivered'}
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${order.status === 'delivered' ? 'bg-bakery-primary border-bakery-primary text-white' : 'bg-white border-bakery-light text-bakery-primary hover:border-bakery-primary'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <ArrowRight className="w-4 h-4" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mark Delivered</span>
                                                                    </div>
                                                                    {order.status === 'delivered' && <CheckCircle className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 bg-bakery-light/30 rounded-3xl border border-bakery-light space-y-3">
                                                            <h5 className="text-[8px] font-black text-bakery-accent uppercase tracking-widest">Current Status Summary</h5>
                                                            <p className="text-[10px] font-bold text-bakery-primary uppercase italic">
                                                                This order is currently <span className="text-bakery-primary font-black underline decoration-bakery-primary/30">{order.status}</span>.
                                                                Updates here will reflect instantly on the customer's app and rider's mobile terminal.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
