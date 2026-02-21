import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, Coffee, Truck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useBrand } from '../context/BrandContext';
import Logo from '../assets/logoteasntrees-removebg-preview.png';
import HeroImage from '../assets/TTNoName.png';

const HomePage = () => {
    const navigate = useNavigate();
    const { brand, theme } = useBrand();

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
                                    onClick={() => navigate('/menu')}
                                    className={`px-8 py-4 bg-gradient-to-r ${theme.gradientClass} text-white rounded-full text-lg font-bold shadow-lg ${theme.shadowClass} ${theme.gradientHoverClass} transition-all flex items-center gap-2`}
                                >
                                    Explore Our Menu <ArrowRight className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/contact')}
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
                                    <div className="hover:scale-105 transition-transform duration-500 drop-shadow-2xl">
                                        🧁
                                    </div>
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
        </div>
    )
}

export default HomePage;
