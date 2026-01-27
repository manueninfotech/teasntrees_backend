// TeasNTrees Navbar Component
// Modern, responsive navigation bar with scroll logic and authentication

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Heart, Package, Truck, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const { getCartCount } = useCart();
    const { user, isAuthenticated, logout, openLoginModal } = useAuth();
    const location = useLocation();
    const cartCount = getCartCount();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
    }, [location]);

    const isHome = location.pathname === '/';
    const isActive = (path) => location.pathname === path ? 'active' : '';

    const handleLoginClick = () => {
        openLoginModal();
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/menu', label: 'Menu' },
        { path: '/about', label: 'About' },
        { path: '/wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
    ];

    return (
        <header className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''} ${isHome ? 'is-home' : ''}`}>
            <nav className="navbar-container">
                <div className="navbar-main">
                    {/* Logo */}
                    <Link to="/" className="navbar-brand">
                        <span className="brand-icon">🌿</span>
                        <span className="brand-text">TeasNTrees</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links-desktop">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${isActive(link.path)}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="navbar-actions">
                        {/* Cart */}
                        <Link to="/cart" className="action-btn cart-btn">
                            <ShoppingCart className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount}</span>
                            )}
                        </Link>

                        {/* Authentication */}
                        {!isAuthenticated ? (
                            <button onClick={handleLoginClick} className="action-btn login-desktop-btn">
                                <User className="w-5 h-5" />
                                <span>Login / Sign Up</span>
                            </button>
                        ) : (
                            <div className="profile-dropdown-container">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="action-btn profile-btn"
                                >
                                    <User className="w-6 h-6" />
                                </button>

                                {isProfileOpen && (
                                    <div className="profile-dropdown-menu scale-in">
                                        <div className="dropdown-user-info">
                                            <div className="avatar-circle">
                                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="user-meta">
                                                <p className="meta-name">{user?.name || 'Guest'}</p>
                                                <p className="meta-mobile">{user?.mobile}</p>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/orders" className="dropdown-item">
                                            <Package className="w-4 h-4" />
                                            <span>My Orders</span>
                                        </Link>
                                        <Link to="/delivery" className="dropdown-item">
                                            <Truck className="w-4 h-4" />
                                            <span>Track Order</span>
                                        </Link>
                                        <Link to="/profile" className="dropdown-item">
                                            <User className="w-4 h-4" />
                                            <span>Profile</span>
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout-btn">
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-toggle"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay slide-down">
                        <div className="mobile-menu-links">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`mobile-link ${isActive(link.path)}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="mobile-divider"></div>
                            {!isAuthenticated ? (
                                <button onClick={handleLoginClick} className="mobile-link login-trigger">
                                    Login / Sign Up
                                </button>
                            ) : (
                                <>
                                    <Link to="/orders" className="mobile-link">My Orders</Link>
                                    <Link to="/delivery" className="mobile-link">Track Order</Link>
                                    <Link to="/profile" className="mobile-link">Profile</Link>
                                    <button onClick={handleLogout} className="mobile-link logout-btn">Logout</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
