import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Truck, Users, BarChart2, Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
    { icon: Home, label: 'Overview', path: '/' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: Truck, label: 'Riders', path: '/riders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
];

const DesktopSidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-glass-border h-screen fixed left-0 top-0 z-50">
        <div className="p-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-primary">
                Teas N Trees
            </h1>
            <p className="text-xs text-brand-primary tracking-widest uppercase mt-1">Manager</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
            ${isActive
                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }
          `}
                >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-blue-500 overflow-hidden">
                    {/* Avatar Placeholder */}
                    <img src="https://ui-avatars.com/api/?name=Manager&background=00A67E&color=fff" alt="" />
                </div>
                <div>
                    <p className="text-sm font-medium text-white">Store Manager</p>
                    <p className="text-xs text-white/50">Online</p>
                </div>
            </div>
        </div>
    </aside>
);

const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-glass-border pb-safe z-50">
        <div className="flex justify-around items-center p-2">
            {NAV_ITEMS.slice(0, 5).map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
           flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px]
           ${isActive
                            ? 'text-brand-primary'
                            : 'text-white/40'
                        }
         `}
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </div>
    </div>
);

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-primary/30">
            <DesktopSidebar />

            {/* Main Content Area */}
            <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0 relative">

                {/* Mobile Header */}
                <div className="lg:hidden p-4 flex items-center justify-between glass-panel sticky top-0 z-40 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                            <span className="font-bold">T</span>
                        </div>
                        <span className="font-bold text-lg">Teas N Trees</span>
                    </div>
                    <Bell className="w-6 h-6 text-white" />
                </div>

                <div className="p-4 lg:p-8 max-w-[1920px] mx-auto">
                    <Outlet />
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
};

export default DashboardLayout;
