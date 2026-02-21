import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, Coffee, Users, ZoomIn, Star, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useBrand } from '../context/BrandContext';
import Logo from '../assets/logoteasntrees-removebg-preview.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { cartCount, toggleCart } = useCart();
    const { wishlistItems } = useWishlist();
    const { brand, setBrand, theme } = useBrand();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const term = searchTerm.trim();

        if (term) {
            navigate(`/menu?q=${encodeURIComponent(term)}`);
        } else {
            navigate('/menu');
        }
        setIsOpen(false);
    };

    return (

        <nav className={`glass-nav transition-all duration-300 ${brand === 'littleh' ? 'bg-pink-50/10' : ''}`}>
            <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link to={brand === 'littleh' ? '/littleh' : '/teasntrees'} className="flex items-center gap-2 group">
                        {theme.isTeasNTrees ? (
                            <img
                                src={Logo}
                                alt="Teas N Trees"
                                className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-2xl font-black text-pink-600 tracking-tighter group-hover:scale-105 transition-transform duration-300">
                                <span className="text-3xl">🧁</span> LittleH
                            </div>
                        )}
                    </Link>

                    {/* Brand Switcher Desktop */}
                    <div className="hidden lg:flex bg-white/50 backdrop-blur-md p-1 rounded-full items-center border border-white/60">
                        <button
                            onClick={() => { setBrand('teasntrees'); navigate('/teasntrees'); }}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                                theme.isTeasNTrees ? "bg-cafe-emerald text-white shadow-md shadow-cafe-emerald/30" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Teas N Trees
                        </button>
                        <button
                            onClick={() => { setBrand('littleh'); navigate('/littleh'); }}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                                theme.isLittleH ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            LittleH
                        </button>
                    </div>
                </div>

                {/* DESKTOP SEARCH */}
                <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
                    <form onSubmit={handleSearch} className="relative w-full max-w-md group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for 'Masala Chai'..."
                            className={`w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-full py-2.5 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all shadow-sm hover:shadow-md hover:bg-white/70`}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-6">
                    <Link to="/menu" className={`text-sm font-medium ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}>Menu</Link>
                    <Link to="/about" className={`text-sm font-medium ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}>About</Link>
                    <Link to="/gallery" className={`text-sm font-medium ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}>Gallery</Link>
                    <Link to="/reviews" className={`text-sm font-medium ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}>Reviews</Link>
                    <Link to="/contact" className={`text-sm font-medium ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`}>Contact</Link>

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
                        <ShoppingCart className={`w-6 h-6 text-slate-600 ${theme.textColorClass.replace('text-', 'hover:text-')} transition-colors`} />
                    </button>

                    <Link to="/profile" className="flex items-center gap-2 pl-4 border-l border-slate-200">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${theme.gradientClass} p-[2px]`}>
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <User className={`w-5 h-5 ${theme.textColorClass}`} />
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

            {/* MOBILE MENU */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-100"
                    >
                        <div className="p-6 flex flex-col gap-4">
                            {/* Brand Switcher Mobile */}
                            <div className="flex p-1 bg-slate-100 rounded-full mb-4">
                                <button
                                    onClick={() => { setBrand('teasntrees'); navigate('/teasntrees'); setIsOpen(false); }}
                                    className={cn(
                                        "flex-1 py-2 rounded-full text-sm font-bold transition-all",
                                        theme.isTeasNTrees ? "bg-white text-cafe-emerald shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    Teas N Trees
                                </button>
                                <button
                                    onClick={() => { setBrand('littleh'); navigate('/littleh'); setIsOpen(false); }}
                                    className={cn(
                                        "flex-1 py-2 rounded-full text-sm font-bold transition-all",
                                        theme.isLittleH ? "bg-white text-pink-500 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    LittleH
                                </button>
                            </div>

                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-emerald/50"
                                />
                                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </button>
                            </form>

                            <Link to="/menu" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Coffee className="w-5 h-5 text-cafe-emerald" />
                                <span className="font-medium">Menu</span>
                            </Link>
                            <Link to="/about" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                <Users className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">About Us</span>
                            </Link>
                            <Link to="/gallery" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group" onClick={() => setIsOpen(false)}>
                                <ZoomIn className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Gallery</span>
                            </Link>
                            <Link to="/reviews" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group" onClick={() => setIsOpen(false)}>
                                <Star className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Reviews</span>
                            </Link>
                            <Link to="/contact" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group" onClick={() => setIsOpen(false)}>
                                <Phone className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Contact</span>
                            </Link>
                            <Link to="/wishlist" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group" onClick={() => setIsOpen(false)}>
                                <Heart className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Wishlist ({wishlistItems.length})</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); toggleCart(); }}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group w-full text-left"
                            >
                                <ShoppingCart className="w-6 h-6 text-cafe-orange group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Cart ({cartCount})</span>
                            </button>
                            <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group" onClick={() => setIsOpen(false)}>
                                <User className="w-6 h-6 text-cafe-teal group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-base">Profile</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
