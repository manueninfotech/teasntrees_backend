import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Coffee, Users, Heart } from 'lucide-react';

const AboutPage = () => {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 lg:px-8 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px] shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-cafe-emerald/20 border border-cafe-emerald/30 backdrop-blur-md text-emerald-300 font-bold text-sm mb-4"
                        >
                            Since 2023
                        </motion.span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                            Brewing Memories,<br /> One Cup at a Time.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-200 max-w-2xl">
                            Welcome to Teas N Trees, where premium tea meets nature's tranquility. Experience the "LittleH" difference in every sip.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Our Story */}
            <div className="container mx-auto px-4 lg:px-8 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-slate-800">Our Story</h2>
                        <div className="w-20 h-1.5 bg-gradient-to-r from-cafe-emerald to-cafe-teal rounded-full" />
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Teas N Trees began with a simple idea: to create a sanctuary where people can pause, reflect, and enjoy the finest teas and coffees amidst the hustle of city life.
                        </p>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            We believe in "LittleH" - Little Happiness. It's found in the aroma of freshly brewed chai, the crunch of a perfectly baked cookie, and the warmth of a friendly smile. Our cafe is designed to be your home away from home.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-cafe-emerald to-cafe-orange rounded-3xl rotate-3 opacity-20 transform translate-y-4 translate-x-4" />
                        <img
                            src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=800"
                            alt="Cafe Interior"
                            className="relative rounded-3xl shadow-xl border-4 border-white"
                        />
                    </motion.div>
                </div>
            </div>

            {/* Values */}
            <div className="bg-white py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Core Values</h2>
                        <p className="text-slate-500">
                            These principles guide everything we do, from sourcing our ingredients to serving you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Leaf,
                                color: "text-emerald-500",
                                bg: "bg-emerald-50",
                                title: "Fresh & Natural",
                                desc: "We source only the freshest ingredients. No preservatives, just pure goodness from nature to your table."
                            },
                            {
                                icon: Users,
                                color: "text-blue-500",
                                bg: "bg-blue-50",
                                title: "Community First",
                                desc: "We are more than a cafe; we are a gathering place. We strive to build a warm, inclusive community."
                            },
                            {
                                icon: Heart,
                                color: "text-rose-500",
                                bg: "bg-rose-50",
                                title: "Made with Love",
                                desc: "Every dish is crafted with passion and attention to detail. You can taste the love in every bite."
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-slate-50 rounded-3xl p-8 hover:shadow-lg transition-all border border-slate-100 hover:border-slate-200 group"
                            >
                                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visit Us CTA */}
            <div className="container mx-auto px-4 lg:px-8 mt-20">
                <div className="bg-slate-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cafe-emerald rounded-full blur-[80px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cafe-orange rounded-full blur-[80px] opacity-20" />

                    <div className="relative z-10">
                        <Coffee className="w-12 h-12 text-white mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Come Visit Us Today</h2>
                        <p className="text-slate-400 max-w-xl mx-auto mb-8 text-lg">
                            Experience the magic of Teas N Trees. Whether you need a morning boost or an evening unwind, we have the perfect cup waiting for you.
                        </p>
                        <button className="px-8 py-4 bg-cafe-emerald hover:bg-cafe-teal text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/50">
                            Find Our Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
