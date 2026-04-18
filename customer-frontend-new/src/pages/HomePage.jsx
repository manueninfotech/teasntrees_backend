import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, Coffee, Truck, Heart, Sparkles, ChefHat, Cake, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useBrand } from '../context/BrandContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import HeroImage from '../assets/TTNoName.png';
import LittleHHero from '../assets/littleh-hero.png';
import CouponTicker from '../components/CouponTicker';
import RatingNudge from '../components/RatingNudge';
import PromotionBanners from '../components/PromotionBanners';

// Inline copy button used by welcome nudge sections
const CopyButton = ({ code, accentColor, isLittleH }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black transition-all shadow-lg ${isLittleH ? 'font-playfair' : ''}`}
            style={{ background: accentColor }}
        >
            {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
            ) : (
                <><Copy className="w-4 h-4" /> Copy Code</>
            )}
        </motion.button>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const { brand, theme } = useBrand();
    const { isAuthenticated } = useAuth();
    const [showNudge, setShowNudge] = useState(true);
    const [statusData, setStatusData] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await userService.getStatus(brand);
                setStatusData(data);
                setShowNudge(data.showWelcomeBanner);
            } catch (err) {
                console.error("Failed to fetch user status", err);
            }
        };
        fetchStatus();
    }, [brand, isAuthenticated]);

    if (theme.isLittleH) {
        return (
            <div className="min-h-screen bg-[#FAF1E8] font-sans selection:bg-[#565A47] selection:text-[#FAF1E8]">
                {/* HERO SECTION */}
                <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                            {/* Text Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="lg:col-span-5 space-y-8 z-10"
                            >
                                <span className="uppercase tracking-[0.3em] text-[#8B8E7B] text-sm font-semibold">Artisan Bakery & Patisserie</span>
                                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-playfair font-black tracking-tight leading-[1.05] text-[#565A47]">
                                    Baking <br />
                                    <span className="italic font-light text-[#8B8E7B]">Happiness</span> <br />
                                    Daily.
                                </h1>
                                <p className="text-lg lg:text-xl text-[#8B8E7B] leading-relaxed max-w-lg font-light">
                                    Experience the magic of true artisanal baking. Freshly baked croissants, bespoke custom cakes, and delightful sweet treats crafted with unparalleled passion.
                                </p>

                                <div className="flex flex-wrap gap-6 pt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/${brand}/menu`)}
                                        className="px-10 py-4 bg-[#565A47] text-[#FAF1E8] text-sm tracking-widest uppercase font-bold transition-all flex items-center gap-3 hover:bg-[#3f4233] shadow-xl shadow-[#565A47]/20"
                                    >
                                        Our Menu <ArrowRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Hero Image */}
                            <div className="lg:col-span-7 relative z-0 flex justify-center lg:justify-end">
                                {/* Elegant geometric background accent */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#FDF5EC] rounded-full blur-3xl opacity-70" />

                                <motion.div
                                    animate={{ y: [-10, 10, -10] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative w-full max-w-2xl aspect-square flex items-center justify-center"
                                >
                                    <img
                                        src={LittleHHero}
                                        alt="LittleH Artisanal Sweets"
                                        className="w-full h-full object-contain drop-shadow-2xl scale-125"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE ARTISAN DIFFERENCE */}
                <section className="py-32 bg-[#FDF5EC]">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl lg:text-6xl font-playfair font-bold text-[#565A47] mb-8">The Artisan Difference</h2>
                            <div className="w-24 h-px bg-[#8B8E7B] mx-auto mb-8" />
                            <p className="text-xl text-[#8B8E7B] max-w-2xl mx-auto font-light leading-relaxed">
                                Every creation that leaves our ovens is a masterpiece, crafted strictly with passion, tradition, and absolute precision.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                            {[
                                { icon: Sparkles, title: "Finest Ingredients", desc: "We source our butter, flour, and chocolates from the world's most trusted artisan producers." },
                                { icon: ChefHat, title: "Master Bakers", desc: "Our chefs bring decades of combined experience in classical French and modern pastry techniques." },
                                { icon: Cake, title: "Bespoke Creations", desc: "From weddings to birthdays, we craft custom cakes tailored perfectly for your special moments." }
                            ].map((item, idx) => (
                                <motion.div key={idx} whileHover={{ y: -10 }} className="text-center group">
                                    <div className="w-24 h-24 mx-auto bg-[#FAF1E8] border border-[#8B8E7B]/30 flex items-center justify-center mb-8 rotate-45 group-hover:rotate-0 group-hover:bg-[#565A47] transition-all duration-700 ease-out shadow-sm">
                                        <div className="-rotate-45 group-hover:rotate-0 transition-all duration-700 ease-out">
                                            <item.icon className="w-10 h-10 text-[#565A47] group-hover:text-[#FAF1E8] transition-colors duration-500" strokeWidth={1} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-playfair font-bold mb-4 text-[#565A47]">{item.title}</h3>
                                    <p className="text-[#8B8E7B] leading-loose font-light">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ELEGANT STATS */}
                <section className="py-20 bg-[#565A47] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#FAF1E8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    <div className="container mx-auto px-4 lg:px-8 relative z-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-[#FAF1E8]/20">
                            {[
                                { value: "100%", label: "Made Fresh Daily" },
                                { value: "50+", label: "Pastry Varieties" },
                                { value: "4.9", label: "Average Rating" },
                                { value: "2000+", label: "Custom Cakes" }
                            ].map((stat, idx) => (
                                <div key={idx} className="px-4">
                                    <div className="text-4xl lg:text-6xl font-playfair font-bold text-[#FAF1E8] mb-3">{stat.value}</div>
                                    <div className="text-[#FAF1E8]/70 uppercase tracking-[0.2em] text-xs font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* WELCOME NUDGE — Swiggy style */}
                {showNudge && (
                    <section className="py-8 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 relative group"
                        >
                            {/* Bold colored top bar */}
                            <div className="relative overflow-hidden px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #565A47 0%, #3f4233 60%, #8B8E7B 100%)' }}>
                                <motion.div 
                                    animate={{ x: [-500, 500] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                />
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                                <div className="absolute -bottom-6 left-10 w-28 h-28 rounded-full bg-white/5" />
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
                                    <span className="text-white font-black text-[10px] uppercase tracking-widest">🎉 New Customer Offer</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                    <div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-7xl font-black text-white leading-none tracking-tighter drop-shadow-lg">₹100</span>
                                            <span className="text-2xl font-bold text-white/70 mb-2">OFF</span>
                                        </div>
                                        <p className="text-white/70 text-sm font-medium mt-1">On your very first order above ₹200</p>
                                    </div>
                                </div>
                            </div>

                            {/* White bottom section */}
                            <div className="bg-white px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className={`text-[#565A47] text-sm font-bold ${brand === 'littleh' ? 'font-playfair' : ''}`}>Welcome to the LittleH family ✨</p>
                                    <p className="text-[#8B8E7B] text-[10px] uppercase tracking-wider font-bold">First order exclusive</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-5 py-2.5 rounded-xl" style={{ background: '#FAF1E8', border: '2px dashed #565A4740' }}>
                                        <span className={`font-black text-lg tracking-widest text-[#565A47] ${brand === 'littleh' ? 'font-playfair' : ''}`}>HELLO100</span>
                                    </div>
                                    <CopyButton code="HELLO100" accentColor="#565A47" isLittleH={true} />
                                </div>
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* PROMOTION BANNERS */}
                <PromotionBanners brand={brand} theme={theme} />

                {/* COUPON TICKER */}
                <CouponTicker brand={brand} theme={theme} showFirstOrder={showNudge} />

                {/* RATING NUDGE — Smart discovery */}
                {statusData?.lastOrderRatingPending && (
                    <RatingNudge 
                        orderId={statusData.lastOrderRatingPending} 
                        brand={brand}
                        theme={theme}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                {/* Floating Leaves Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0.4, 0.8, 0.4], y: [0, 100], x: [0, 50] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute top-20 left-[10%] text-4xl text-green-300 opacity-60"
                    >🍃</motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0.3, 0.6, 0.3], y: [0, 150], x: [0, -30] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                        className="absolute top-40 right-[20%] text-2xl text-green-400 opacity-50"
                    >🍃</motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0.5, 0.9, 0.5], y: [0, 80], x: [0, 20] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 5 }}
                        className="absolute top-10 left-[40%] text-sm text-green-200 opacity-70"
                    >🍃</motion.div>
                </div>

                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8 z-10"
                        >
                            <div className="flex flex-col items-start gap-4">
                                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-slate-900">
                                    Welcome to <span className={theme.textColorClass}>{theme.brandName}</span>
                                </h1>
                            </div>

                            <p className="text-xl lg:text-2xl text-slate-600 max-w-xl font-medium leading-relaxed">
                                {theme.isTeasNTrees
                                    ? "Where nature meets your perfect cup. Authentic Assam teas, artisan coffee, and nature-inspired vibes."
                                    : "Baking happiness daily. Fresh pastries, custom cakes, and delightful sweet treats made with love."}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/${brand}/menu`)}
                                    className={`px-8 py-4 bg-gradient-to-r ${theme.gradientClass} text-white rounded-full text-lg font-bold shadow-lg ${theme.shadowClass} ${theme.gradientHoverClass} transition-all flex items-center gap-2`}
                                >
                                    Explore Our Menu <ArrowRight className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/${brand}/contact`)}
                                    className="px-8 py-4 bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-full text-lg font-bold hover:bg-white/80 transition-all"
                                >
                                    Visit Us Today
                                </motion.button>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-6 pt-8 text-sm font-semibold text-slate-500">
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.3/5 Rating</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>500+ Orders</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>30min Delivery</span>
                            </div>
                        </motion.div>

                        {/* Hero Image / Animation */}
                        <div className="relative z-0 flex justify-center lg:justify-end">
                            {/* Abstract Background Blobs */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${theme.isLittleH ? 'bg-pink-400/20' : 'bg-cafe-emerald/20'} rounded-full blur-[100px] animate-pulse-slow`} />
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] ${theme.isLittleH ? 'bg-purple-300/20' : 'bg-cafe-orange/20'} rounded-full blur-[80px] translate-x-20 translate-y-20`} />

                            {/* 3D Floating Cup Placeholder using actual image */}
                            <motion.div
                                animate={{ y: [-20, 20, -20] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] flex items-center justify-center font-black text-[200px]"
                            >
                                {theme.isTeasNTrees ? (
                                    <img
                                        src={HeroImage}
                                        alt="Teas N Trees Cup"
                                        className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <img
                                        src={LittleHHero}
                                        alt="LittleH Bakery Sweets"
                                        className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                    />
                                )}

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ y: [0, -40, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -top-10 left-1/3 text-4xl"
                                >✨</motion.div>
                                <motion.div
                                    animate={{ y: [0, -60, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                                    className="absolute -top-16 right-1/3 text-3xl"
                                >🍃</motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROMOTION BANNERS */}
            <PromotionBanners brand={brand} theme={theme} />

            {/* WELCOME NUDGE — Swiggy style */}
            {showNudge && (
                <section className="py-8 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-200 relative group"
                    >
                        {/* Bold colored top */}
                        <div className="relative overflow-hidden px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #059669 60%, #10b981 100%)' }}>
                            <motion.div 
                                animate={{ x: [-500, 500] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                            />
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                            <div className="absolute -bottom-6 left-10 w-28 h-28 rounded-full bg-white/5" />
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
                                <span className="text-white font-black text-[10px] uppercase tracking-widest">🎉 New Customer Offer</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                <div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-7xl font-black text-white leading-none tracking-tighter drop-shadow-lg">₹100</span>
                                        <span className="text-2xl font-bold text-white/70 mb-2">OFF</span>
                                    </div>
                                    <p className="text-white/70 text-sm font-medium mt-1">On your very first order above ₹200</p>
                                </div>
                            </div>
                        </div>

                        {/* White bottom */}
                        <div className="bg-white px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-emerald-900 text-sm font-bold">Welcome to Teas N Trees ✨</p>
                                <p className="text-emerald-600/60 text-[10px] uppercase tracking-wider font-bold">New customer special</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-5 py-2.5 rounded-xl" style={{ background: '#ecfdf5', border: '2px dashed #05966940' }}>
                                    <span className="font-black text-lg tracking-widest text-emerald-700">HELLO100</span>
                                </div>
                                <CopyButton code="HELLO100" accentColor="#059669" isLittleH={false} />
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}

            {/* COUPON TICKER */}
            <CouponTicker brand={brand} theme={theme} showFirstOrder={showNudge} />

            {/* WHY CHOOSE US SECTION */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose {theme.brandName}?</h2>
                        <div className={`w-20 h-1.5 bg-gradient-to-r ${theme.gradientClass} rounded-full mx-auto mb-6`} />
                        <p className="text-lg text-slate-600">Experience the difference in every {theme.isLittleH ? 'bite' : 'cup'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="text-5xl mb-6">🌱</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Sustainable Sourcing</h3>
                            <p className="text-slate-600 leading-relaxed">Fair trade and organic ingredients from trusted partners worldwide</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -10 }}
                            className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="text-5xl mb-6">👨🍳</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Expert Craftsmanship</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {theme.isTeasNTrees ? 'Skilled baristas and tea masters creating perfect beverages' : 'Master bakers creating spectacular custom cakes and pastries'}
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -10 }}
                            className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="text-5xl mb-6">🏠</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Cozy Atmosphere</h3>
                            <p className="text-slate-600 leading-relaxed">Comfortable spaces perfect for work, study, or relaxation</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -10 }}
                            className="text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="text-5xl mb-6">⚡</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Fresh Daily</h3>
                            <p className="text-slate-600 leading-relaxed">Everything made fresh daily with the finest ingredients</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-12 bg-slate-50/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Star, label: "4.3 Rating", sub: "Trusted by Locals", color: "text-yellow-500" },
                            { icon: Coffee, label: "50+ Varieties", sub: "Tea & Coffee", color: "text-cafe-emerald" },
                            { icon: Truck, label: "30min Delivery", sub: "Fast Delivery", color: "text-cafe-teal" },
                            { icon: Heart, label: "Pure Hygiene", sub: "100% Sanitized", color: "text-red-500" },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="glass-card p-6 flex items-center gap-4 group cursor-default bg-white"
                                >
                                    <div className={cn("w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{stat.label}</h3>
                                        <p className="text-sm text-slate-500">{stat.sub}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* RATING NUDGE — Smart discovery */}
            {statusData?.lastOrderRatingPending && (
                <RatingNudge 
                    orderId={statusData.lastOrderRatingPending} 
                    brand={brand}
                    theme={theme}
                />
            )}
        </div>
    )
}

export default HomePage;
