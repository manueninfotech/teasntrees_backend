import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const MenuCard = ({ product }) => {
    const { addToCart } = useCart();
    const { toggleWishlist: toggleWishlistContext, isInWishlist } = useWishlist();

    const isWishlisted = isInWishlist(product._id);

    // Size Selection State
    // Default to the first size option if available, or null
    // We sort by price to ensure "starts from" logic visual consistency if we want, 
    // but usually backend sends order. Let's start with first option.
    const [selectedSize, setSelectedSize] = useState(() => {
        if (product.sizeOptions?.length > 0) {
            return product.sizeOptions[0];
        }
        return null; // Product has no size variations
    });

    // Pricing Logic
    const getDisplayPrice = () => {
        if (selectedSize) return selectedSize.price;
        if (product.displayPrice) return product.displayPrice;
        if (product.price !== undefined && product.price !== null) return product.price;
        // Fallback for list display if no size selected (shouldn't happen if initialized correctly)
        if (product.sizeOptions?.length > 0) {
            return Math.min(...product.sizeOptions.map(o => o.price));
        }
        return 0;
    };
    const price = getDisplayPrice();

    // Image Logic: Strictly use database image or nothing
    const imageUrl = product.image
        ? (product.image.startsWith('http') ? product.image : `http://localhost:5000/uploads/${product.image}`)
        : null;

    // Local state to handle image load error without showing defaults
    const [imageError, setImageError] = useState(false);

    // Tag Color Logic - Specific Request
    const getTagColor = (tag) => {
        const t = tag.toLowerCase();
        // Fixed: best seller, egg-contains, must-try, new-intro
        if (t.includes('best') || t.includes('seller')) return "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent";
        if (t.includes('egg') || t.includes('contains')) return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Warning/Allergen style
        if (t.includes('must') || t.includes('try')) return "bg-rose-100 text-rose-700 border-rose-200"; // Highlight style
        if (t.includes('new') || t.includes('intro')) return "bg-purple-100 text-purple-700 border-purple-200";

        // Fallbacks for others if any
        if (t.includes('spicy') || t.includes('hot')) return "bg-red-100 text-red-700 border-red-200";
        if (t.includes('veg') || t.includes('green')) return "bg-emerald-100 text-emerald-700 border-emerald-200";

        return "bg-white/90 backdrop-blur-md text-slate-700 border-slate-100";
    };

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent card click
        addToCart(product, selectedSize);
    };

    const handleSizeSelect = (e, size) => {
        e.stopPropagation();
        setSelectedSize(size);
    };

    const handleToggleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlistContext(product);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative cursor-pointer h-auto min-h-[450px]"
            whileHover="hover"
        >
            {/* 3D Tilt Container */}
            <div className="relative h-full transition-transform duration-500 ease-out preserve-3d group-hover:rotate-x-2 group-hover:rotate-y-2">
                <div className="glass-card h-full flex flex-col overflow-hidden relative border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white/80 to-white/40">

                    {/* Image Area */}
                    <div className="relative h-56 min-h-[14rem] overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                        {imageUrl && !imageError ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="text-slate-300 text-sm font-medium">No Image</div>
                        )}

                        {/* Wishlist Button (Top Right) */}
                        <button
                            onClick={handleToggleWishlist}
                            className={cn(
                                "absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm z-20",
                                isWishlisted
                                    ? "bg-rose-500 text-white"
                                    : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        </button>

                        {/* Rating Badge */}
                        {(product.averageRating > 0) && (
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm z-10">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {product.averageRating}
                            </div>
                        )}

                        {/* Tags Display */}
                        {product.tags?.length > 0 && (
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[75%] z-10 items-start">
                                {product.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm border uppercase tracking-wider",
                                            getTagColor(tag)
                                        )}
                                    >
                                        {tag.replace(/-/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 relative z-10">
                        <div className="flex-1 flex flex-col">
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 w-fit px-2 py-0.5 rounded-md bg-cafe-emerald/10 text-cafe-emerald">
                                {product.category?.name || 'Specialty'}
                            </div>
                            <h3 className="font-bold text-xl text-slate-800 leading-tight mb-2 group-hover:text-cafe-emerald transition-colors">
                                {product.name}
                            </h3>
                            {/* Full Description - No Line Clamp */}
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                {product.description}
                            </p>

                            {/* Size Options - Interactive */}
                            {product.sizeOptions?.length > 0 && (
                                <div className="mt-auto pt-2 border-t border-dashed border-slate-200">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Select Size</div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizeOptions.map(o => (
                                            <button
                                                key={o.size}
                                                onClick={(e) => handleSizeSelect(e, o)}
                                                className={cn(
                                                    "text-[10px] px-2 py-1 rounded border transition-all duration-200",
                                                    selectedSize?.size === o.size
                                                        ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-cafe-emerald hover:text-cafe-emerald"
                                                )}
                                            >
                                                {o.size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Price / Add Button */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100/50">
                            <div>
                                <span className="text-xl font-black text-slate-900">₹{price}</span>
                                {product.sizeOptions?.length > 0 && !selectedSize && <span className="text-xs text-slate-500 ml-1">starts from</span>}
                            </div>

                            {/* Liquid Button */}
                            <button
                                onClick={handleAddToCart}
                                className="relative overflow-hidden group/btn bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-semibold shadow-xl shadow-slate-200 transition-transform active:scale-95 shrink-0"
                            >
                                <span className="relative z-10 flex items-center gap-1.5 transition-colors group-hover/btn:text-white">
                                    <Plus className="w-4 h-4" /> Add
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cafe-emerald to-cafe-teal translate-y-[101%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MenuCard;
