import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="lg:ml-64">
                <Header />
                <main className="p-4 md:p-6 pb-24 lg:pb-6">
                    <Outlet />
                </main>
            </div>
            <MobileNav />
        </div>
    );
};
