import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="glass-nav sticky top-0 z-30 lg:ml-64">
            <div className="flex items-center justify-between px-4 md:px-6 py-4">
                {/* Left: Menu + Search */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 max-w-md">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders, products, customers..."
                            className="bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Right: Notifications + Profile */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Profile */}
                    {user && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
