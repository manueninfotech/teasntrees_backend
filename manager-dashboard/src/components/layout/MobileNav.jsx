import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Bike, Users } from 'lucide-react';

export const MobileNav = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/orders', icon: ShoppingCart, label: 'Orders' },
        { to: '/products', icon: Package, label: 'Products' },
        { to: '/riders', icon: Bike, label: 'Riders' },
        { to: '/customers', icon: Users, label: 'Customers' },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-200 dark:border-gray-700 z-50">
            <div className="flex items-center justify-around px-2 py-3">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
