import { useNavigate, useParams } from 'react-router-dom';
import {
    ShoppingBag, Clock, PlayCircle, DollarSign,
    ArrowRight, TrendingUp, Package, Users
} from 'lucide-react';

export default function DashboardHome() {
    const { brand } = useParams();
    const b = brand || 'littleh';

    const stats = [
        { title: "Today's Orders", value: "0", icon: ShoppingBag, color: "text-bakery-primary", bg: "bg-white" },
        { title: "Pending", value: "0", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Preparing", value: "0", icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Revenue", value: "₹0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
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

            {/* Announcements or Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 glass-card space-y-6">
                    <div className="flex items-center justify-between border-b border-bakery-light pb-6">
                        <h2 className="text-xl font-black text-bakery-primary uppercase tracking-tight">System Status</h2>
                        <span className="px-4 py-1.5 bg-bakery-light text-bakery-primary rounded-full font-black text-[10px] uppercase tracking-widest">Real-time</span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-white/50 border border-white rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="font-black uppercase text-[10px] tracking-widest">Backend Connection</span>
                            </div>
                            <span className="text-emerald-600 font-bold text-xs">ONLINE</span>
                        </div>
                        <div className="p-6 bg-white/50 border border-white rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="font-black uppercase text-[10px] tracking-widest">Socket System</span>
                            </div>
                            <span className="text-emerald-600 font-bold text-xs">CONNECTED</span>
                        </div>
                    </div>
                </div>

                <div className="bg-bakery-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-bakery-primary/30">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24 group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8 italic">Quick Access</p>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Store Overview</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed mb-10">Manage your LittleH branch efficiently with real-time tracking and inventory controls.</p>
                        <button className="flex items-center gap-3 px-8 py-4 bg-white text-bakery-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
                            Launch Catalog <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
