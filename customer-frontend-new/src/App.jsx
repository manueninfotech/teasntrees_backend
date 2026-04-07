import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productService } from './services/productService';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { BrandProvider, useBrand } from './context/BrandContext';
import { Toaster } from 'react-hot-toast';
import SocketListener from './components/SocketListener';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartDrawer from './components/CartDrawer';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import ReviewsPage from './pages/ReviewsPage';
import ContactPage from './pages/ContactPage';

// Placeholder pages for those not yet created to prevent build errors
const CartPage = () => <div className="pt-32 text-center text-4xl font-bold text-cafe-orange">Cart Coming Soon</div>;

// Inner wrapper that reads BrandContext to set the root background
const BrandRoot = () => {
  const { theme, brand } = useBrand();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!brand) return;

    // Background prefetch for instant loading of ALL categories
    const prefetchData = async () => {
      try {
        // 1. Prefetch Categories first to know what to prefetch next
        const categoriesData = await queryClient.fetchQuery({
          queryKey: ['categories', brand],
          queryFn: () => productService.getCategories(brand),
          staleTime: 1000 * 60 * 60,
        });

        const categories = categoriesData?.data || [];

        // 2. Prefetch 'All' products (default view)
        queryClient.prefetchQuery({
          queryKey: ['products', 'all', '', '', brand],
          queryFn: () => productService.getAllProducts({
            category: 'all', q: '', search: '', brand: brand
          }),
          staleTime: 1000 * 60 * 60,
        });

        // 3. Prefetch EACH category's products so they are all 'instant'
        categories.forEach(cat => {
          const catId = cat._id || cat.id;
          queryClient.prefetchQuery({
            queryKey: ['products', catId, '', '', brand],
            queryFn: () => productService.getAllProducts({
              category: catId, q: '', search: '', brand: brand
            }),
            staleTime: 1000 * 60 * 60,
          });
        });
      } catch (err) {
        console.error('Menu prefetch failed:', err);
      }
    };

    prefetchData();
  }, [brand, queryClient]);

  return (
    <div
      className="relative min-h-screen font-sans antialiased text-slate-800"
      style={theme.isLittleH ? { background: '#FAF1E8' } : {}}
    >
      <Navbar />
      <CartDrawer />
      <main>
        <Routes>
          {/* Redirect root to a default brand or landing page if you prefer. 
              Here we redirect / to /teasntrees */}
          <Route path="/" element={<Navigate to="/teasntrees" replace />} />

          <Route path="/:brand">
            <Route index element={<HomePage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="track-order/:orderId" element={<OrderTrackingPage />} />
            <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>

          {/* Catch-all for legacy or invalid paths */}
          <Route path="*" element={<Navigate to="/teasntrees" replace />} />
        </Routes>
      </main>
    </div>
  );
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <BrandProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  <Toaster position="top-right" />
                  <SocketListener />
                  <BrandRoot />
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </BrandProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
