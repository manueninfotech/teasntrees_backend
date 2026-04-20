import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Heart, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useBrand } from '../context/BrandContext';
import api from '../services/api';
import CustomizationModal from './CustomizationModal';

const isCakeCategoryName = (name = '') => {
    const normalized = String(name).trim().toLowerCase();
    const compact = normalized.replace(/[\s_-]/g, '');
    if (compact.includes('pancake')) return false;
    return /\b(cake|cakes|cheesecake|cheesecakes)\b/.test(normalized);
};

const MenuCard = ({ product }) => {
    const { addToCart } = useCart();
    const { toggleWishlist: toggleWishlistContext, isInWishlist } = useWishlist();
    const { theme } = useBrand();

    const isWishlisted = isInWishlist(product._id);
    const isLittlehCakeProduct =
        theme.isLittleH &&
        product.brand === 'littleh' &&
        isCakeCategoryName(product.category?.name || '');
    const hasCakeCustomization =
        product.cakePricing?.customizationAvailable === true ||
        (product.cakePricing?.customizationPricePerKg !== undefined && product.cakePricing?.customizationPricePerKg !== null);

    // Size Selection State
    const [selectedSize, setSelectedSize] = useState(() => {
        if (product.sizeOptions?.length > 0) {
            return product.sizeOptions[0];
        }
        return null;
    });
    const [cakeWeight, setCakeWeight] = useState(1);
    const [cakeCustomized, setCakeCustomized] = useState(false);
    const [cakeEggless, setCakeEggless] = useState(false);
    const [cakeMessage, setCakeMessage] = useState('');
    const [cakeColorTheme, setCakeColorTheme] = useState('');
    const [cakeDesignDescription, setCakeDesignDescription] = useState('');
    const [cakeReferenceFile, setCakeReferenceFile] = useState(null);
    const [isUploadingCakeRef, setIsUploadingCakeRef] = useState(false);
    const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

    // Pricing Logic
    const getDisplayPrice = () => {
        if (isLittlehCakeProduct) {
            const perKg = (hasCakeCustomization && cakeCustomized)
                ? (product.cakePricing?.customizationPricePerKg ?? product.cakePricing?.basePricePerKg ?? product.price ?? 0)
                : (product.cakePricing?.basePricePerKg ?? product.price ?? 0);
            const eggless = cakeEggless ? (product.cakePricing?.egglessExtraCharge ?? 100) : 0;
            return (perKg * cakeWeight) + eggless;
        }
        if (selectedSize) return selectedSize.price;
        if (product.displayPrice) return product.displayPrice;
        if (product.price !== undefined && product.price !== null) return product.price;

        if (product.sizeOptions?.length > 0) {
            return Math.min(...product.sizeOptions.map(o => o.price));
        }
        return 0;
    };
    const price = getDisplayPrice();

    const imageUrl = product.image || null;
    const [imageError, setImageError] = useState(false);

    const getTagColor = (tag) => {
        const t = tag.toLowerCase();
        if (t.includes('best') || t.includes('seller')) return "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent";
        if (t.includes('egg') || t.includes('contains')) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        if (t.includes('must') || t.includes('try')) return "bg-rose-100 text-rose-700 border-rose-200";
        if (t.includes('new') || t.includes('intro')) return "bg-purple-100 text-purple-700 border-purple-200";
        if (t.includes('seasonal')) return "bg-emerald-500 text-white border-transparent";
        if (t.includes('spicy') || t.includes('hot')) return "bg-red-100 text-red-700 border-red-200";
        if (t.includes('veg') || t.includes('green')) return "bg-emerald-100 text-emerald-700 border-emerald-200";
        return "bg-white/90 backdrop-blur-md text-slate-700 border-slate-100";
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (isLittlehCakeProduct) {
            let referenceImageUrl = '';
            if (cakeReferenceFile) {
                setIsUploadingCakeRef(true);
                try {
                    const formData = new FormData();
                    formData.append('image', cakeReferenceFile);
                    const response = await api.post('/customer/upload/image?folder=cake-designs', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    referenceImageUrl = response.data?.data?.url || '';
                } catch (uploadError) {
                    console.error('Failed to upload cake reference image', uploadError);
                } finally {
                    setIsUploadingCakeRef(false);
                }
            }

            await addToCart(product, {
                type: 'cake',
                weight: cakeWeight,
                isCustomized: hasCakeCustomization ? cakeCustomized : false,
                isEggless: cakeEggless,
                customizationDetails: {
                    cakeMessage,
                    colorTheme: cakeColorTheme,
                    designDescription: cakeDesignDescription,
                    referenceImage: referenceImageUrl
                }
            });
            return;
        }
        if (product.variants?.length > 0) {
            setIsCustomizationOpen(true);
            return;
        }
        addToCart(product, selectedSize);
    };

    const handleCustomizationConfirm = (selectedAddons) => {
        addToCart(product, {
            ...selectedSize,
            selectedVariants: selectedAddons
        });
    };

    const handleSizeSelect = (e, size) => {
        e.stopPropagation();
        setSelectedSize(size);
    };

    const handleToggleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlistContext(product);
    };

    if (theme.isLittleH) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative cursor-pointer flex flex-col h-full bg-[#FDF5EC] border border-[#8B8E7B]/10 hover:border-[#565A47]/30 transition-all duration-500 overflow-hidden"
            >
                <div className="relative w-full aspect-square overflow-hidden bg-[#FAF1E8]">
                    {imageUrl && !imageError ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={() => setImageError(true)} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B8E7B]/50"><Sparkles className="w-8 h-8" strokeWidth={1} /></div>
                    )}
                    <button onClick={handleToggleWishlist} className={cn("absolute top-4 right-4 p-2.5 bg-[#FDF5EC] rounded-full transition-all duration-300 z-20 shadow-sm", isWishlisted ? "text-rose-700" : "text-[#8B8E7B] hover:text-[#565A47]")}>
                        <Heart className={cn("w-4 h-4 transition-transform active:scale-75", isWishlisted && "fill-current")} strokeWidth={isWishlisted ? 2 : 1.5} />
                    </button>
                    {(product.averageRating > 0) && (
                        <div className="absolute top-4 left-4 bg-[#FDF5EC] backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-black text-[#565A47] shadow-lg z-30 border border-[#565A47]/20">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {product.averageRating.toFixed(1)}
                        </div>
                    )}
                    {(product.tags?.length > 0 || product.isSeasonal) && (
                        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
                            {product.isSeasonal && <span className="px-3 py-1 bg-emerald-500 text-[9px] uppercase tracking-widest text-white font-bold shadow-sm">Seasonal</span>}
                            {product.tags?.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-[#FDF5EC] text-[9px] uppercase tracking-widest text-[#565A47] font-semibold">{tag.replace(/-/g, ' ')}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                    <div className="mb-2 flex justify-between items-start gap-4">
                        <h3 className="font-playfair font-bold text-2xl text-[#565A47] leading-tight group-hover:text-black transition-colors">{product.name}</h3>
                        <span className="text-xl font-medium text-[#565A47] shrink-0">₹{price}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#8B8E7B] mb-4">{product.category?.name || 'Artisan Pastry'}</div>
                    <p className="text-sm text-[#8B8E7B] leading-relaxed font-light mb-auto flex-1">{product.description}</p>
                    {isLittlehCakeProduct && (
                        <div className="mt-6 pt-6 border-t border-[#8B8E7B]/10 space-y-3">
                            <div className="text-[10px] uppercase tracking-widest text-[#8B8E7B]">Cake Weight</div>
                            <div className="flex flex-wrap gap-2">
                                {[0.5, 1, 1.5, 2].map(weight => (
                                    <button key={weight} onClick={(e) => { e.stopPropagation(); setCakeWeight(weight); }} className={cn("text-xs px-4 py-2 border transition-all duration-300 font-medium", cakeWeight === weight ? "bg-[#565A47] text-[#FAF1E8] border-[#565A47]" : "bg-transparent text-[#565A47] border-[#8B8E7B]/30 hover:border-[#565A47]")}>{weight} kg</button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                {hasCakeCustomization && (
                                    <button onClick={(e) => { e.stopPropagation(); setCakeCustomized(prev => !prev); }} className={cn("text-xs px-4 py-2 border transition-all duration-300 font-medium", cakeCustomized ? "bg-[#565A47] text-[#FAF1E8] border-[#565A47]" : "bg-transparent text-[#565A47] border-[#8B8E7B]/30")}>Customized</button>
                                )}
                                {product.cakePricing?.egglessAvailable !== false && (
                                    <button onClick={(e) => { e.stopPropagation(); setCakeEggless(prev => !prev); }} className={cn("text-xs px-4 py-2 border transition-all duration-300 font-medium", cakeEggless ? "bg-[#565A47] text-[#FAF1E8] border-[#565A47]" : "bg-transparent text-[#565A47] border-[#8B8E7B]/30")}>Eggless</button>
                                )}
                            </div>
                        </div>
                    )}
                    {!isLittlehCakeProduct && product.sizeOptions?.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-[#8B8E7B]/10">
                            <div className="text-[10px] uppercase tracking-widest text-[#8B8E7B] mb-3">Select Portion</div>
                            <div className="flex flex-wrap gap-2">
                                {product.sizeOptions.map(o => (
                                    <button key={o.size} onClick={(e) => handleSizeSelect(e, o)} className={cn("text-xs px-4 py-2 border transition-all duration-300 font-medium", selectedSize?.size === o.size ? "bg-[#565A47] text-[#FAF1E8] border-[#565A47]" : "bg-transparent text-[#565A47] border-[#8B8E7B]/30 hover:border-[#565A47]")}>{o.size}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button onClick={handleAddToCart} disabled={isUploadingCakeRef} className="mt-6 w-full py-4 border border-[#565A47] text-[#565A47] group-hover:bg-[#565A47] group-hover:text-[#FAF1E8] transition-all duration-500 uppercase tracking-widest text-xs font-bold flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> {isUploadingCakeRef ? 'Uploading...' : 'Add to Order'}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group relative cursor-pointer h-auto min-h-[450px]" whileHover="hover">
            <div className="relative h-full transition-transform duration-500 ease-out preserve-3d group-hover:rotate-x-2 group-hover:rotate-y-2">
                <div className="glass-card h-full flex flex-col overflow-hidden relative border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white/80 to-white/40">
                    <div className="relative h-56 min-h-[14rem] overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                        {imageUrl && !imageError ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={() => setImageError(true)} />
                        ) : (
                            <div className="text-slate-300 text-sm font-medium">No Image</div>
                        )}
                        <button onClick={handleToggleWishlist} className={cn("absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm z-20", isWishlisted ? "bg-rose-500 text-white" : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white")}>
                            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        </button>
                        {(product.averageRating > 0) && (
                            <div className="absolute top-3 left-3 bg-white px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black shadow-xl z-30 border border-slate-100 text-slate-800">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                {product.averageRating.toFixed(1)}
                            </div>
                        )}
                        {(product.tags?.length > 0 || product.isSeasonal) && (
                            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[75%] z-10 items-start">
                                {product.isSeasonal && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm border uppercase tracking-wider bg-emerald-500 text-white border-transparent">Seasonal</span>
                                )}
                                {product.tags?.map(tag => (
                                    <span key={tag} className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm border uppercase tracking-wider", getTagColor(tag))}>{tag.replace(/-/g, ' ')}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-5 flex flex-col flex-1 relative z-10">
                        <div className="flex-1 flex flex-col">
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 w-fit px-2 py-0.5 rounded-md ${theme.primaryColorClass}/10 ${theme.textColorClass}`}>{product.category?.name || 'Specialty'}</div>
                            <h3 className={`font-bold text-xl text-slate-800 leading-tight mb-2 ${theme.textColorClass.replace('text-', 'group-hover:text-')} transition-colors`}>{product.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{product.description}</p>
                            {!isLittlehCakeProduct && product.sizeOptions?.length > 0 && (
                                <div className="mt-auto pt-2 border-t border-dashed border-slate-200">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Select Size</div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizeOptions.map(o => (
                                            <button key={o.size} onClick={(e) => handleSizeSelect(e, o)} className={cn("text-[10px] px-2 py-1 rounded border transition-all duration-200", selectedSize?.size === o.size ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105" : `bg-slate-50 text-slate-600 border-slate-200 hover:border-${theme.primaryColor} ${theme.textColorClass.replace('text-', 'hover:text-')}`)}>{o.size}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100/50">
                            <div>
                                <span className="text-xl font-black text-slate-900">₹{price}</span>
                                {!isLittlehCakeProduct && product.sizeOptions?.length > 0 && !selectedSize && <span className="text-xs text-slate-500 ml-1">starts from</span>}
                            </div>
                            <button onClick={handleAddToCart} className="relative overflow-hidden group/btn bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-semibold shadow-xl shadow-slate-200 transition-transform active:scale-95 shrink-0">
                                <span className="relative z-10 flex items-center gap-1.5 transition-colors group-hover/btn:text-white"><Plus className="w-4 h-4" /> Add</span>
                                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientClass} translate-y-[101%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <CustomizationModal
                isOpen={isCustomizationOpen}
                onClose={() => setIsCustomizationOpen(false)}
                product={product}
                onConfirm={handleCustomizationConfirm}
            />
        </motion.div>
    );
};

export default MenuCard;
