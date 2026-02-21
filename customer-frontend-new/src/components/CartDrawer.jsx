import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
    const {
        isCartOpen,
        toggleCart,
        cartItems,
        removeFromCart,
        updateQuantity,
        cartTotal
    } = useCart();

    const { isAuthenticated } = useAuth();
    const { theme } = useBrand();
    const navigate = useNavigate();

    const handleCheckout = () => {
        toggleCart();
        if (isAuthenticated) {
            navigate('/checkout');
        } else {
            navigate('/profile');
        }
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShoppingBag className={`w-5 h-5 ${theme.textColorClass}`} />
                                Your Order
                            </h2>
                            <button
                                onClick={toggleCart}
                                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                    <ShoppingBag className="w-16 h-16 opacity-20" />
                                    <p className="text-lg font-medium">Your cart is empty</p>
                                    <button
                                        onClick={() => {
                                            toggleCart();
                                            navigate('/menu');
                                        }}
                                        className={`px-8 py-3 bg-gradient-to-r ${theme.gradientClass} text-white rounded-xl font-bold hover:shadow-xl active:scale-95 flex items-center gap-2 transition-all shadow-lg`}
                                    >
                                        Browse Menu <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                Object.entries(cartItems.reduce((acc, item) => {
                                    const b = item.brand || 'teasntrees';
                                    if (!acc[b]) acc[b] = [];
                                    acc[b].push(item);
                                    return acc;
                                }, {})).map(([brandName, items]) => (
                                    <div key={brandName} className="mb-6 last:mb-0">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1 flex items-center gap-2">
                                            {brandName === 'teasntrees' ? '🍃 Teas N Trees ITEMS' : '🧁 LittleH Bakery ITEMS'}
                                        </div>
                                        <div className="space-y-4">
                                            {items.map((item) => (
                                                <div
                                                    key={item.key}
                                                    className={`flex gap-4 p-3 rounded-2xl border border-slate-100 bg-white ${brandName === 'teasntrees' ? 'hover:border-cafe-emerald/30' : 'hover:border-pink-500/30'} transition-colors shadow-sm`}
                                                >
                                                    {/* Item Image */}
                                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image.startsWith('http') ? item.image : `http://localhost:5000/uploads/${item.image}`}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                                                        )}
                                                    </div>

                                                    {/* Item Details */}
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                                                                <button
                                                                    onClick={() => removeFromCart(item.key)}
                                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {item.size && (
                                                                <div className="text-xs text-slate-500 font-medium bg-slate-100 w-fit px-1.5 py-0.5 rounded mt-1">
                                                                    {item.size}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>

                                                            {/* Quantity Controls */}
                                                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                                <button
                                                                    onClick={() => updateQuantity(item.key, -1)}
                                                                    className={`w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50 text-slate-400 hover:text-red-500`}
                                                                    disabled={item.quantity <= 1}
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.key, 1)}
                                                                    className={`w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 ${brandName === 'teasntrees' ? 'hover:text-cafe-emerald' : 'hover:text-pink-500'}`}
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-slate-900 text-lg">₹{cartTotal}</span>
                                </div>
                                <div className="text-xs text-slate-400 text-center">
                                    Taxes & delivery calculated at checkout
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-slate-300 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'} <span className="text-slate-400 font-normal">| ₹{cartTotal}</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
