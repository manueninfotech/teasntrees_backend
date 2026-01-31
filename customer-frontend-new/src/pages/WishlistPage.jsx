import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import MenuCard from '../components/MenuCard';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
    const { wishlistItems } = useWishlist();

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500"
                    >
                        <Heart className="w-8 h-8 fill-current" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">My Wishlist</h1>
                    <p className="text-slate-500 max-w-md">
                        Your personal collection of favorites. Order them now or save them for later!
                    </p>
                </div>

                {/* Content */}
                {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {wishlistItems.map((item) => (
                            <MenuCard key={item._id} product={item} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
                    >
                        <Heart className="w-16 h-16 text-slate-200 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Your wishlist is empty</h2>
                        <p className="text-slate-400 mb-8 text-center max-w-xs">
                            Love a product? Click the heart icon to save it here for later.
                        </p>
                        <Link
                            to="/menu"
                            className="flex items-center gap-2 px-8 py-3 bg-cafe-emerald text-white rounded-xl font-bold hover:bg-cafe-teal transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            Browse Menu <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
