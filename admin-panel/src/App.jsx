import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import SocketGlobalRefresh from './components/SocketGlobalRefresh';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Categories from './pages/Categories.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
import SeasonalProducts from './pages/SeasonalProducts.jsx';
import Orders from './pages/Orders.jsx';
import Riders from './pages/Riders.jsx';
import Customers from './pages/Customers.jsx';
import Settings from './pages/Settings.jsx';
import Reviews from './pages/Reviews.jsx';
import Profile from './pages/Profile.jsx';
import Users from './pages/Users.jsx';
import ActivityLogs from './pages/ActivityLogs.jsx';
import CartAnalytics from './pages/CartAnalytics.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Payouts from './pages/Payouts.jsx';
import Managers from './pages/Managers.jsx';
import MessagesPage from './pages/MessagesPage.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
            <SocketProvider>
              <BrowserRouter>
                <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                <SocketGlobalRefresh />
                <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="categories/:id" element={<CategoryDetail />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="products/seasonal" element={<SeasonalProducts />} />
                <Route path="orders" element={<Orders />} />
                <Route path="riders" element={<Riders />} />
                <Route path="customers" element={<Customers />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="profile" element={<Profile />} />
                <Route path="users" element={<Users />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="cart-analytics" element={<CartAnalytics />} />
                <Route path="deliveries" element={<Deliveries />} />
                <Route path="payouts" element={<Payouts />} />
                <Route path="managers" element={<Managers />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
