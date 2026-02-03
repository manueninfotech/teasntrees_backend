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
    <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-glass-border h-screen fixed left-0 top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="p-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-emerald-600">
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
                            : 'text-gray-600 hover:bg-gray-100 hover:text-brand-primary'
                        }
          `}
                >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-blue-500 overflow-hidden shadow-md">
                    {/* Avatar Placeholder */}
                    <img src="https://ui-avatars.com/api/?name=Manager&background=00A67E&color=fff" alt="" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-800">Store Manager</p>
                    <p className="text-xs text-green-600 font-medium">Online</p>
                </div>
            </div>
        </div>
    </aside>
);

const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-gray-200 bg-white/90 backdrop-blur-md pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center p-2">
            {NAV_ITEMS.slice(0, 5).map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
           flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px]
           ${isActive
                            ? 'text-brand-primary font-bold'
                            : 'text-gray-400 hover:text-gray-600'
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
        <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-brand-primary/30">
            <DesktopSidebar />

            {/* Main Content Area */}
            <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0 relative">

                {/* Mobile Header */}
                <div className="lg:hidden p-4 flex items-center justify-between glass-panel sticky top-0 z-40 mb-4 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                            <span className="font-bold">T</span>
                        </div>
                        <span className="font-bold text-lg text-gray-800">Teas N Trees</span>
                    </div>
                    <Bell className="w-6 h-6 text-gray-600" />
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
