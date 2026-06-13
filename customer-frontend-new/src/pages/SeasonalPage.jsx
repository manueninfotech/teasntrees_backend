import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Leaf, ArrowRight, Cookie, ChefHat, Cake } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { productService } from '../services/productService';
import MenuCard from '../components/MenuCard';
import MenuSkeleton from '../components/MenuSkeleton';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const SeasonalPage = () => {
    const { brand, theme } = useBrand();
    const navigate = useNavigate();

    // Fetch all products for the current brand
    const { data: productsData, isLoading, isError } = useQuery({
        queryKey: ['products', 'seasonal', brand],
        queryFn: () => productService.getAllProducts({
            category: 'all',
            brand: brand,
            limit: 100 // Fetch a larger batch to find seasonal items
        }),
    });

    const allProducts = productsData?.data?.products || [];
    const seasonalProducts = allProducts.filter(p => p.isSeasonal);

    // Boutique Header with Botanical Grace
    return (
        <div className="min-h-screen bg-white relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
            {/* BACKDROP WATERMARK - "SEASONAL" */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                <h1 className="text-[12vw] font-black tracking-tighter uppercase transform -rotate-12 translate-y-[-5%]">
                    Seasonal
                </h1>
            </div>

            {/* MAIN BOUTIQUE FLOW */}
            <div className="relative z-10">
                {/* ELEGANT CENTERED HEADER */}
                <header className="pt-20 pb-12 px-4 text-center max-w-4xl mx-auto">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-6"
                    >
                        Seasonal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Selection</span>
                    </motion.h1>

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        className="h-1.5 bg-emerald-500 mx-auto mb-8 rounded-full"
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg lg:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
                    >
                        We pick the best items for each season. These are special 
                        foods and drinks that are only available for a short time. 
                        Enjoy them while they are fresh!
                    </motion.p>
                </header>

                {/* CURATED GRID SECTION */}
                <section className="container mx-auto px-4 lg:px-24 pb-32">
                    {isLoading ? (
                        <MenuSkeleton />
                    ) : isError ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-sm max-w-3xl mx-auto">
                            <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">Error</p>
                            <h2 className="text-2xl font-black text-slate-800">Something went wrong. Please try again.</h2>
                        </div>
                    ) : seasonalProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                            {seasonalProducts.map((product, idx) => (
                                <motion.div
                                    key={product._id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <MenuCard product={product} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        /* COMING SOON - SIMPLE STYLE */
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-3xl mx-auto py-32 bg-slate-50 border border-slate-100 rounded-[4rem] relative overflow-hidden group shadow-sm"
                        >
                            {/* Abstract Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none group-hover:scale-125 transition-all duration-1000" />
                            
                            <div className="relative z-10 px-8">
                                <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-8" />
                                <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Coming Soon</h2>
                                <p className="text-xl text-slate-500 font-medium max-w-md mx-auto mb-12">
                                    We are busy making our new seasonal treats. They will be ready very soon!
                                </p>
                                <button
                                    onClick={() => navigate(`/${brand}/menu`)}
                                    className="px-10 py-5 bg-black text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 active:scale-95"
                                >
                                    View Full Menu
                                </button>
                            </div>
                        </motion.div>
                    )}
                </section>
            </div>

            {/* SIMPLE CHARACTERISTICS SECTION */}
            <div className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="container mx-auto px-4 lg:px-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                <Leaf className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Fresh Items</h4>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed px-6">We pick our ingredients at the right time so they always taste great.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Special Flavors</h4>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed px-6">Discover unique tastes that are only available at this time of year.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Changes with Season</h4>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed px-6">Our menu changes with the seasons so the food is always fresh and new.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonalPage;
