import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Bike,
    Users,
    Moon,
    Sun,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';

export const Sidebar = () => {
    const { logout, user } = useAuth();
    const { isDark, toggleDarkMode } = useDarkMode();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/orders', icon: ShoppingCart, label: 'Orders' },
        { to: '/products', icon: Package, label: 'Products' },
        { to: '/riders', icon: Bike, label: 'Riders' },
        { to: '/customers', icon: Users, label: 'Customers' },
    ];

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-nav h-screen fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold gradient-text">Teas N Trees</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manager Portal</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* User Info */}
                {user && (
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs">{user.mobile}</p>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};
