// TeasNTrees Main App Component
// React Router setup and layout with authentication

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import DeliveryTrackingPage from './pages/DeliveryTrackingPage';
import LoginModal from './components/LoginModal';
import { useAuth } from './context/AuthContext';
import './styles/index.css';

// Inner App component to use AuthContext
const AppContent = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/delivery/:orderId" element={<DeliveryTrackingPage />} />
            <Route path="/delivery" element={<DeliveryTrackingPage />} />
          </Routes>
        </main>
        <Footer />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={closeLoginModal}
        />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
