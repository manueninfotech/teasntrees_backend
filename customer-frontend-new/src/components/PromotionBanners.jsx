import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import brownieFeat from '../assets/brownie_feat.png';
import frappeFeat from '../assets/frappe_feat.png';
import kunafaFeat from '../assets/kunafa_feat.png';

const PromotionBanners = ({ brand, theme }) => {
    const navigate = useNavigate();
    const isLittleH = brand === 'littleh';
    
    // Banner Data - Featured Products from Seeders
    const banners = isLittleH ? [
        {
            id: 1,
            title: "Walnut Brownie",
            subtitle: "BEST SELLER",
            description: "Rich chocolate brownie with crunchy walnuts. Baked fresh daily.",
            price: 119,
            bg: brownieFeat,
            accent: "#565A47"
        },
        {
            id: 2,
            title: "Cheese Kunafa",
            subtitle: "MUST TRY",
            description: "Traditional Middle Eastern dessert with cheese and sweet syrup.",
            price: 349,
            bg: kunafaFeat,
            accent: "#8B8E7B"
        }
    ] : [
        {
            id: 1,
            title: "Tnt Frappe",
            subtitle: "SIGNATURE",
            description: "Signature Teas N Trees frappe, cold and refreshing. Our top choice.",
            price: 199,
            bg: frappeFeat,
            accent: "#10b981"
        },
        {
            id: 2,
            title: "Special Masala Nachos",
            subtitle: "BEST SELLER",
            description: "Crispy nachos with special Indian masala toppings and cheese.",
            price: 249,
            bg: kunafaFeat, // Reusing high quality shot for variety
            accent: "#14b8a6"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    return (
        <section className="px-4 py-8">
            <div className="max-w-7xl mx-auto relative group">
                <AnimatePresence>
                    <motion.div
                        key={banners[currentIndex].id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, position: 'absolute', top: 0, left: 0, right: 0 }}
                        transition={{ duration: 0.6, ease: "circOut" }}
                        className="relative h-[400px] md:h-[500px] rounded-[40px] overflow-hidden shadow-2xl bg-slate-900"
                    >
                        {/* Background Image with Overlay */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${banners[currentIndex].bg})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 border border-white/20"
                            >
                                <Sparkles className="w-4 h-4 text-white" />
                                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{banners[currentIndex].subtitle}</span>
                            </motion.div>

                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`text-5xl md:text-7xl font-black text-white mb-4 leading-none tracking-tighter ${isLittleH ? 'font-playfair' : ''}`}
                            >
                                {banners[currentIndex].title}
                            </motion.h2>

                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/70 text-lg md:text-xl mb-8 max-w-md font-medium"
                            >
                                {banners[currentIndex].description}
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap items-center gap-4"
                            >
                                <button 
                                    onClick={() => navigate(`/${brand}/menu`)}
                                    className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                >
                                    Check Our Menu <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Slide Indicators */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
                            {banners.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-10 bg-white' : 'w-2 bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <button 
                    onClick={prev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={next}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </section>
    );
};

export default PromotionBanners;
