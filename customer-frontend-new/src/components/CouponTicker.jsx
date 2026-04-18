import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Copy, Check, Sparkles, Zap } from 'lucide-react';
import { cartService } from '../services/cartService';

const CouponTicker = ({ brand, theme, showFirstOrder = false }) => {
    const [coupons, setCoupons] = useState([]);
    const [current, setCurrent] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await cartService.getAvailableCoupons(brand);
                if (res.success && res.data?.length) {
                    const filtered = res.data.filter(c => showFirstOrder || !c.firstOrderOnly);
                    setCoupons(filtered);
                }
            } catch (err) {
                console.error('Failed to load coupons', err);
            }
        };
        fetchCoupons();
    }, [brand, showFirstOrder]);

    useEffect(() => {
        if (coupons.length <= 1 || isHovered) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % coupons.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [coupons.length, isHovered]);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!coupons.length) return null;

    const coupon = coupons[current];
    const isLittleH = theme?.isLittleH;
    
    const brandStyles = isLittleH ? {
        primary: '#565A47',
        accent: '#8B8E7B',
        gradient: 'from-[#565A47] to-[#8B8E7B]',
        font: 'font-playfair'
    } : {
        primary: '#10b981',
        accent: '#14b8a6',
        gradient: 'from-[#10b981] to-[#14b8a6]',
        font: 'font-sans'
    };

    const formatDiscount = (c) => {
        if (c.discountType === 'flat') return `₹${c.discountAmount} OFF`;
        return `${c.discountAmount}% OFF`;
    };

    return (
        <section className="py-10 px-4">
            <div className="max-w-4xl mx-auto relative">
                <motion.div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative bg-white rounded-[1.5rem] overflow-hidden border border-slate-200"
                >
                    <AnimatePresence>
                        <motion.div
                            key={coupon.code}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                            className="flex flex-col md:flex-row items-center"
                        >
                            <div className={`w-full md:w-1/3 bg-gradient-to-br ${brandStyles.gradient} p-8 flex flex-col items-center justify-center text-white relative overflow-hidden`}>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                >
                                    <Sparkles className="absolute top-0 left-0 w-32 h-32" />
                                    <Sparkles className="absolute bottom-0 right-0 w-32 h-32" />
                                </motion.div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl mb-4">
                                        <Zap className="w-8 h-8 fill-white" />
                                    </div>
                                    <span className={`text-4xl font-black tracking-tighter drop-shadow-lg ${brandStyles.font}`}>
                                        {formatDiscount(coupon)}
                                    </span>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-80 mt-2">Limited Offer</p>
                                </div>
                            </div>

                            <div className="w-full md:w-2/3 p-8 md:p-10 flex flex-col sm:flex-row items-center gap-8 justify-between">
                                <div className="text-center sm:text-left">
                                    <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                                        <Tag className={`w-4 h-4 ${isLittleH ? 'text-[#565A47]' : 'text-[#10b981]'}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${isLittleH ? 'text-[#8B8E7B]' : 'text-[#14b8a6]'}`}>
                                            Flash Deal
                                        </span>
                                    </div>
                                    <h4 className={`text-2xl font-black text-slate-800 tracking-tight leading-none mb-3 ${brandStyles.font}`}>
                                        {coupon.description || `Special discount for you`}
                                    </h4>
                                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                                        {coupon.minOrderValue > 0 && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-full border border-slate-200">
                                                Min. ₹{coupon.minOrderValue}
                                            </span>
                                        )}
                                        {coupon.firstOrderOnly && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full border border-amber-200">
                                                New User Only
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                                    <div 
                                        className={`px-8 py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 relative`}
                                        style={{ borderColor: brandStyles.primary + '40' }}
                                    >
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Coupon Code</span>
                                        <span className={`text-3xl font-black tracking-[0.1em] ${isLittleH ? 'text-[#565A47]' : 'text-[#10b981]'} ${brandStyles.font}`}>
                                            {coupon.code}
                                        </span>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleCopy(coupon.code)}
                                        className={`w-full py-3 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2`}
                                        style={{ background: brandStyles.primary }}
                                    >
                                        {copied ? (
                                            <><Check className="w-3 h-3" /> Code Copied!</>
                                        ) : (
                                            <><Copy className="w-3 h-3" /> Copy Coupon Code</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
                        <motion.div 
                            key={current}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4, ease: "linear" }}
                            className="h-full"
                            style={{ background: brandStyles.primary }}
                        />
                    </div>
                </motion.div>

                <div className="flex justify-center gap-2 mt-6">
                    {coupons.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 transition-all duration-500 rounded-full ${
                                i === current 
                                ? `w-8 bg-slate-800` 
                                : `w-1.5 bg-slate-300`
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CouponTicker;
