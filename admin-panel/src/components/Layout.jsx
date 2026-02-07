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
    User,
    Shield,
    History,
    Truck,
    UserCog,
    Mail
} from 'lucide-react';
import logo from '../assets/logoteasntrees.png';

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
        { icon: Calendar, label: 'Seasonal Items', path: '/products/seasonal' },
        { icon: ShoppingCart, label: 'Orders', path: '/orders' },
        { icon: Bike, label: 'Riders', path: '/riders' },
        { icon: UserCog, label: 'Managers', path: '/managers' },
        { icon: Truck, label: 'Deliveries', path: '/deliveries' },
        { icon: Wallet, label: 'Payouts', path: '/payouts' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: MessageSquare, label: 'Reviews', path: '/reviews' },
        { icon: ShoppingCart, label: 'Cart Insights', path: '/cart-analytics' },
        { icon: Shield, label: 'All Accounts', path: '/users' },
        { icon: History, label: 'System Logs', path: '/activity-logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: User, label: 'My Profile', path: '/profile' },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex selection:bg-emerald-600 selection:text-white font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-100 my-5 ml-5 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 flex flex-col h-[calc(100vh-40px)] sticky top-5 overflow-hidden z-20">
                {/* Logo Area */}
                <div className="p-8 border-b border-gray-50 bg-white">
                    <div className="flex flex-col items-center gap-2">
                        <img
                            src={logo}
                            alt="Teas N Trees Logo"
                            className="h-16 w-auto object-contain"
                        />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em]">Admin Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-6 flex-1 overflow-y-auto space-y-2 no-scrollbar">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group duration-300
                                    ${active
                                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-[1.02]'
                                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:pl-7'
                                    }
                                `}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'}`} />
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-50 text-red-500 transition-all hover:bg-red-600 hover:text-white group w-full hover:shadow-lg hover:shadow-red-200"
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        <span className="font-black uppercase text-[10px] tracking-[0.2em]">Logout Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-x-hidden overflow-y-auto h-screen scroll-smooth">
                <div className="max-w-[1600px] mx-auto pb-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}