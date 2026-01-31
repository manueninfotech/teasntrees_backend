import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, Coffee, Users, ZoomIn, Star, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { cartCount, toggleCart } = useCart();
    const { wishlistItems } = useWishlist();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            // Navigate to menu page with search param
            navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
            setIsOpen(false); // Close mobile menu if open
        }
    };

    return (
        <nav className="glass-nav transition-all duration-300">
            <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <Coffee className="w-8 h-8 text-cafe-emerald group-hover:text-cafe-teal transition-colors duration-300" />
                        <motion.div
                            className="absolute -top-1 -right-1"
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="w-2 h-2 bg-cafe-orange rounded-full opacity-60 blur-[1px]" />
                        </motion.div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cafe-emerald to-cafe-teal">
                            Teas N Trees
                        </span>
                        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                            Premium Cafe
                        </span>
                    </div>
                </Link>

                {/* Desktop Search - 1024px+ */}
                <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
                    <div className="relative w-full max-w-md group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Search for 'Masala Chai'..."
                            className="w-full bg-white/50 backdrop-blur-sm border-white/40 border rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-emerald/50 transition-all shadow-sm group-hover:shadow-md group-hover:bg-white/70"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-hover:text-cafe-emerald transition-colors" />
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-6">
                    <Link to="/menu" className="text-sm font-medium hover:text-cafe-emerald transition-colors">
                        Menu
                    </Link>
                    <Link to="/about" className="text-sm font-medium hover:text-cafe-emerald transition-colors">
                        About
                    </Link>
                    <Link to="/gallery" className="text-sm font-medium hover:text-cafe-emerald transition-colors">
                        Gallery
                    </Link>
                    <Link to="/reviews" className="text-sm font-medium hover:text-cafe-emerald transition-colors">
                        Reviews
                    </Link>
                    <Link to="/contact" className="text-sm font-medium hover:text-cafe-emerald transition-colors">
                        Contact
                    </Link>

                    <Link to="/wishlist" className="relative group">
                        <div className={cn(
                            "absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md transition-transform",
                            wishlistItems.length > 0 ? "scale-100" : "scale-0"
                        )}>
                            {wishlistItems.length}
                        </div>
                        <Heart className="w-6 h-6 text-slate-600 group-hover:text-red-500 transition-colors" />
                    </Link>

                    <button onClick={toggleCart} className="relative group">
                        <div className={cn(
                            "absolute -top-2 -right-2 bg-cafe-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md transition-transform",
                            cartCount > 0 ? "scale-100" : "scale-0"
                        )}>
                            {cartCount}
                        </div>
                        <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-cafe-emerald transition-colors" />
                    </button>

                    <Link to="/profile" className="flex items-center gap-2 pl-4 border-l border-slate-200">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cafe-emerald to-cafe-teal p-[2px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <User className="w-5 h-5 text-cafe-emerald" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2 rounded-full hover:bg-slate-100 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-100"
                    >
                        <div className="p-4 flex flex-col gap-4">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Search..."
                                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
                            />
                            <Link to="/menu" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Coffee className="w-5 h-5 text-cafe-emerald" />
                                <span className="font-medium">Menu</span>
                            </Link>
                            <Link to="/about" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Users className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">About Us</span>
                            </Link>
                            <Link to="/gallery" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <ZoomIn className="w-5 h-5 text-purple-500" />
                                <span className="font-medium">Gallery</span>
                            </Link>
                            <Link to="/reviews" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Star className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium">Reviews</span>
                            </Link>
                            <Link to="/contact" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Phone className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">Contact</span>
                            </Link>
                            <Link to="/wishlist" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Heart className="w-5 h-5 text-red-500" />
                                <span className="font-medium">Wishlist</span>
                            </Link>
                            <button
                                onClick={() => { setIsOpen(false); toggleCart(); }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 w-full text-left"
                            >
                                <ShoppingCart className="w-5 h-5 text-cafe-orange" />
                                <span className="font-medium">Cart ({cartCount})</span>
                            </button>
                            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <User className="w-5 h-5 text-cafe-teal" />
                                <span className="font-medium">Profile</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

export default Navbar;
