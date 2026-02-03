import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="glass-card p-6 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-${color}-500/20`} />

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white/5 text-${color}-400`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-400`}>
                    {change}
                </span>
            </div>

            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-white/40 text-sm">{title}</p>
        </div>
    </motion.div>
);

const RecentOrders = () => (
    <div className="glass-card p-6 h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Live Orders</h2>
            <button className="text-sm text-brand-primary hover:text-brand-accent transition-colors">View All</button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                            #{1000 + i}
                        </div>
                        <div>
                            <p className="text-white font-medium">Table {i + 2} • 3 items</p>
                            <p className="text-xs text-white/40">2 mins ago</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Preparing
                    </span>
                </div>
            ))}
        </div>
    </div>
);

const DashboardHome = () => {
    const { isConnected } = useSocket();

    return (
        <div className="space-y-6">
            {/* Connection Status Indicator */}
            {!isConnected && (
                <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-200">Connecting to Live Server...</span>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-white/50">Welcome back, Manager</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-3xl font-mono text-white">10:48 AM</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Tuesday, Feb 3</p>
                </div>
            </div>

            {/* Stats Grid - 4 Columns on Desktop, 2 on Tablet, 1 on Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard title="Total Revenue" value="₹12,450" change="+12%" icon={TrendingUp} color="emerald" />
                <StatCard title="Active Orders" value="8" change="+2" icon={ShoppingBag} color="blue" />
                <StatCard title="Avg Prep Time" value="14m" change="-2m" icon={Clock} color="purple" />
                <StatCard title="Low Stock" value="3 Items" change="Urgent" icon={AlertTriangle} color="red" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Orders Feed takes up 2 columns */}
                <div className="lg:col-span-2">
                    <RecentOrders />
                </div>

                {/* Side Widget (Riders/Notifs) */}
                <div className="glass-card p-6 h-[400px]">
                    <h2 className="text-lg font-bold text-white mb-4">Active Riders</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                                    <div>
                                        <p className="text-sm text-white">Rider {i}</p>
                                        <p className="text-xs text-brand-primary">Available</p>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_10px_#00A67E]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;

