import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Bike,
    LogOut,
    Coffee,
    FolderTree,
    Calendar,
    Settings,
    MessageSquare,
    Wallet,
    User
} from 'lucide-react';

export default function Layout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FolderTree, label: 'Categories', path: '/categories' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Calendar, label: 'Seasonal', path: '/products/seasonal' },
        { icon: ShoppingCart, label: 'Orders', path: '/orders' },
        { icon: Bike, label: 'Riders', path: '/riders' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: MessageSquare, label: 'Reviews', path: '/reviews' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: User, label: 'My Profile', path: '/profile' },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-screen flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Coffee className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                TeasNTrees
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1
                ${isActive(item.path)
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-200'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-green-600'
                                }
              `}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-all w-full group"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}