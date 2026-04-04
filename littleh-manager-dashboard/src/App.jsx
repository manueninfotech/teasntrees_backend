import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RefreshProvider } from './context/RefreshContext';
import SocketGlobalRefresh from './components/SocketGlobalRefresh';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/DashboardHome';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import RidersPage from './pages/RidersPage';
import DeliveriesPage from './pages/DeliveriesPage';
import CustomersPage from './pages/CustomersPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-bakery-bg flex items-center justify-center text-bakery-primary font-black uppercase tracking-widest">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/littleh/login" />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect to littleh brand */}
      <Route path="/" element={<Navigate to="/littleh" replace />} />

      {/* Brand-prefixed routes */}
      <Route path="/:brand">
        <Route path="login" element={<LoginPage />} />

        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="riders" element={<RidersPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/littleh" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <RefreshProvider>
            <SocketGlobalRefresh />
            <AppRoutes />
          </RefreshProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App;
