import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import {
    ShoppingBag, Clock, PlayCircle, DollarSign,
    ArrowRight, TrendingUp, Package, Users
} from 'lucide-react';
import { useRefresh } from '../context/RefreshContext';

export default function DashboardHome() {
    const { brand } = useParams();
    const b = brand || 'littleh';
    const { tick } = useRefresh();
    const [statsData, setStatsData] = useState({
        overview: {
            ordersToday: 0,
            salesToday: 0,
            pendingOrders: 0,
            preparingOrders: 0,
            delayedOrders: 0
        },
        recentOrders: [],
        riders: {
            list: []
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await api.get('/manager/dashboard/stats');
                if (response.data.success) {
                    setStatsData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [b, tick]);

    const stats = [
        { title: "Today's Orders", value: statsData.overview.ordersToday, icon: ShoppingBag, color: "text-bakery-primary", bg: "bg-white" },
        { title: "Pending", value: statsData.overview.pendingOrders, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Preparing", value: statsData.overview.preparingOrders, icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Revenue", value: `₹${(statsData.overview.salesToday || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    ];

    return (
        <div className="space-y-10">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-bakery-bg rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-bakery-primary uppercase tracking-tighter mb-2">Welcome Back!</h1>
                    <p className="text-bakery-accent font-bold uppercase text-[10px] tracking-[0.2em] italic">LittleH Managerial Command Center</p>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="bg-bakery-light px-6 py-3 rounded-2xl border border-bakery-accent/10">
                        <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-black text-bakery-primary uppercase">Operational</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card group cursor-pointer active:scale-95 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-gray-200" />
                        </div>
                        <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-black text-bakery-primary tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Live Data Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Live Orders */}
                <div className="xl:col-span-2 glass-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-bakery-light p-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-bakery-primary/5 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-bakery-primary" />
                            </div>
                            <h2 className="text-xl font-black text-bakery-primary uppercase tracking-tight">Live Orders</h2>
                        </div>
                        <button
                            onClick={() => window.location.href = `/${b}/orders`}
                            className="bg-bakery-light hover:bg-bakery-primary hover:text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all text-bakery-primary"
                        >
                            View All
                        </button>
                    </div>

                    <div className="divide-y divide-bakery-light px-4">
                        {statsData.recentOrders?.length > 0 ? (
                            statsData.recentOrders.map((order) => (
                                <div key={order._id} className="p-6 hover:bg-bakery-light/30 transition-colors flex items-center justify-between group rounded-3xl cursor-pointer" onClick={() => window.location.href = `/${b}/orders`}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center font-black text-xs text-bakery-primary group-hover:scale-110 transition-transform">
                                            #{order.orderNumber?.slice(-3)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-bakery-accent tracking-widest mb-1">{order.customerId?.name || 'Customer'}</p>
                                            <p className="text-sm font-bold text-bakery-primary">₹{(order.total || 0).toLocaleString()} • {order.items?.length || 0} Items</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                            order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-bakery-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center space-y-3">
                                <div className="w-12 h-12 bg-bakery-light rounded-2xl flex items-center justify-center mx-auto text-bakery-accent opacity-30">
                                    <Package className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-bakery-accent tracking-widest">No Recent Orders</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fleet Overview */}
                <div className="glass-card overflow-hidden h-fit">
                    <div className="flex items-center justify-between border-b border-bakery-light p-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-black text-bakery-primary uppercase tracking-tight">Riders</h2>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-black text-[9px] uppercase tracking-widest animate-pulse">
                            {statsData.riders?.online || 0} Live
                        </span>
                    </div>

                    <div className="p-8 space-y-6">
                        {statsData.riders?.list?.length > 0 ? (
                            statsData.riders.list.map((rider) => (
                                <div key={rider._id} className="flex items-center justify-between group p-2 hover:bg-bakery-light/50 rounded-2xl transition-all cursor-pointer" onClick={() => window.location.href = `/${b}/riders`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-bakery-light rounded-xl flex items-center justify-center font-black text-bakery-primary text-[10px] uppercase group-hover:bg-bakery-primary group-hover:text-white transition-all">
                                            {rider.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-bakery-accent tracking-widest">{rider.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{rider.mobile}</p>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-[10px] font-black uppercase text-bakery-accent tracking-widest opacity-40 italic">No riders available</p>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.href = `/${b}/riders`}
                            className="w-full py-4 bg-bakery-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-bakery-primary/20"
                        >
                            Open Riders Management
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
