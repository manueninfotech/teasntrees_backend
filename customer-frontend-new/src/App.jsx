import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
  const { theme } = useBrand();
  return (
    <div
      className="relative min-h-screen font-sans antialiased text-slate-800"
      style={theme.isLittleH ? { background: '#FAF1E8' } : {}}
    >
      <Navbar />
      <CartDrawer />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teasntrees" element={<HomePage />} />
          <Route path="/littleh" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <BrandProvider>
                <Toaster position="top-right" />
                <SocketListener />
                <BrandRoot />
              </BrandProvider>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
