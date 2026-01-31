import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, Coffee, Truck, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

const HomePage = () => {
    return (
        <div className="min-h-screen">
            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8 z-10"
                        >
                            <h1 className="text-6xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9]">
                                <span className="block text-slate-900">Premium</span>
                                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cafe-emerald via-green-400 to-cafe-teal">
                                    Teas N Trees
                                </span>
                            </h1>

                            <p className="text-xl lg:text-2xl text-slate-600 max-w-xl font-medium leading-relaxed">
                                Authentic Assam teas, artisan coffee, and nature-inspired vibes. Delivered steaming hot to your doorstep.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-gradient-to-r from-cafe-emerald to-cafe-teal text-white rounded-full text-lg font-bold shadow-lg shadow-cafe-emerald/30 hover:shadow-2xl hover:shadow-cafe-emerald/40 transition-all flex items-center gap-2"
                                >
                                    Start Ordering <ArrowRight className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-full text-lg font-bold hover:bg-white/80 transition-all"
                                >
                                    Explore Menu
                                </motion.button>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-6 pt-8 text-sm font-semibold text-slate-500">
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.9/5 Rating</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>500+ Orders</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>30min Delivery</span>
                            </div>
                        </motion.div>

                        {/* Hero Image / Animation */}
                        <div className="relative z-0 flex justify-center lg:justify-end">
                            {/* Abstract Background Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cafe-emerald/20 rounded-full blur-[100px] animate-pulse-slow" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cafe-orange/20 rounded-full blur-[80px] translate-x-20 translate-y-20" />

                            {/* 3D Floating Cup Placeholder */}
                            <motion.div
                                animate={{ y: [-20, 20, -20] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]"
                            >
                                {/* Using a gradient circle as placeholder for 'Tea Cup' for now if image is missing */}
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-100 to-emerald-50 border-4 border-white/50 shadow-2xl flex items-center justify-center backdrop-blur-sm relative overflow-hidden group">
                                    <span className="text-9xl opacity-20 select-none group-hover:scale-110 transition-transform duration-700">🍵</span>
                                    <div className="absolute bottom-10 text-center w-full">
                                        <p className="font-bold text-cafe-emerald text-lg">Steaming Hot</p>
                                    </div>
                                </div>

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

            {/* STATS SECTION */}
            <section className="py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Star, label: "4.9 Rating", sub: "Trusted by Locals", color: "text-yellow-500" },
                            { icon: Coffee, label: "50+ Varieties", sub: "Tea & Coffee", color: "text-cafe-emerald" },
                            { icon: Truck, label: "30min Delivery", sub: "Free over ₹199", color: "text-cafe-teal" },
                            { icon: Heart, label: "Pure Hygiene", sub: "100% Sanitized", color: "text-red-500" },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="glass-card p-6 flex items-center gap-4 group cursor-default"
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
