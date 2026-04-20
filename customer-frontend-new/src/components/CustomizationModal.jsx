import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingCart, Plus, Minus, Sparkles, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useBrand } from '../context/BrandContext';

const CustomizationModal = ({ isOpen, onClose, product, onConfirm }) => {
    const { theme } = useBrand();
    const [selectedAddons, setSelectedAddons] = useState([]);

    if (!product) return null;

    const addons = product.variants || [];
    const basePrice = product.displayPrice || product.price || 0;
    
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const totalPrice = basePrice + addonsTotal;

    const toggleAddon = (addon) => {
        setSelectedAddons(prev => {
            const exists = prev.find(a => a.name === addon.name);
            if (exists) {
                return prev.filter(a => a.name !== addon.name);
            }
            return [...prev, addon];
        });
    };

    const handleConfirm = () => {
        onConfirm(selectedAddons);
        onClose();
        setSelectedAddons([]);
    };

    const isLittleH = theme.isLittleH;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Soft Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
                    />

                    {/* Cute Compact Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className={cn(
                            "relative w-full max-w-[340px] shadow-2xl overflow-hidden flex flex-col",
                            isLittleH 
                                ? "bg-[#FAF1E8] rounded-[32px] border-4 border-white" 
                                : "bg-white rounded-[28px]"
                        )}
                    >
                        {/* Compact Header */}
                        <div className="p-5 pb-2 flex justify-between items-start">
                            <div className="space-y-0.5">
                                <h3 className={cn(
                                    "text-lg font-black flex items-center gap-1.5",
                                    isLittleH ? "text-[#565A47] font-playfair" : "text-slate-800"
                                )}>
                                    {isLittleH && <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                                    Add Extras
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {product.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Cute List */}
                        <div className="px-4 py-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="grid gap-2">
                                {addons.map((addon) => {
                                    const isSelected = selectedAddons.find(a => a.name === addon.name);
                                    return (
                                        <motion.div
                                            key={addon.name}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => toggleAddon(addon)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border-2",
                                                isSelected 
                                                    ? isLittleH 
                                                        ? "bg-white border-[#565A47] shadow-sm" 
                                                        : "bg-emerald-50 border-emerald-500 shadow-sm"
                                                    : "bg-white/50 border-transparent hover:border-slate-100"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    isSelected 
                                                        ? isLittleH ? "bg-[#565A47] border-[#565A47]" : "bg-emerald-500 border-emerald-500"
                                                        : "bg-white border-slate-200"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    isSelected ? "text-slate-900" : "text-slate-500"
                                                )}>
                                                    {addon.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-black",
                                                isSelected ? isLittleH ? "text-[#565A47]" : "text-emerald-600" : "text-slate-300"
                                            )}>
                                                +₹{addon.price}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cute Mini Footer */}
                        <div className="p-4 bg-white/40 backdrop-blur-sm border-t border-white/50">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total</div>
                                <div className={cn(
                                    "text-xl font-black",
                                    isLittleH ? "text-[#565A47]" : "text-slate-900"
                                )}>₹{totalPrice}</div>
                            </div>
                            
                            <button
                                onClick={handleConfirm}
                                className={cn(
                                    "w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                                    isLittleH 
                                        ? "bg-[#565A47] text-[#FAF1E8]" 
                                        : "bg-slate-900 text-white"
                                )}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add to Cart
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomizationModal;
