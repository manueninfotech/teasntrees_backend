import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Utensils, Coffee, Armchair, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import matchaLatte from '../assets/matchalatte.jpg';

// Categorized images - Teas N Trees
const teasImages = [
    // Interior
    { id: 1, category: 'Interior', src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800", alt: "Main Hall", span: "row-span-2 col-span-1" },
    { id: 2, category: 'Interior', src: "https://thumbs.dreamstime.com/b/cozy-indoor-cafe-seating-area-abundant-greenery-368292740.jpg", alt: "Green Corner", span: "row-span-1 col-span-1" },
    { id: 3, category: 'Interior', src: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=800", alt: "Cozy Seating", span: "row-span-1 col-span-1" },

    // Food
    { id: 4, category: 'Food', src: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800", alt: "Pasta Primavera", span: "row-span-1 col-span-1" },
    { id: 5, category: 'Food', src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800", alt: "Fresh Pastries", span: "row-span-2 col-span-1" },
    { id: 6, category: 'Food', src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800", alt: "Gourmet Pizza", span: "row-span-1 col-span-1" },

    // Drinks
    { id: 7, category: 'Drinks', src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800", alt: "Latte Art", span: "row-span-1 col-span-1" },
    { id: 8, category: 'Drinks', src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800", alt: "Tea Ceremony", span: "row-span-1 col-span-1" },
    { id: 9, category: 'Drinks', src: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800", alt: "Mood Lighting", span: "row-span-1 col-span-1" },
    { id: 10, category: 'Drinks', src: matchaLatte, alt: "Matcha Latte", span: "row-span-1 col-span-1" },
];

// Categorized images - LittleH Bakery
const littlehImages = [
    // Interior
    { id: 1, category: 'Interior', src: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweoq_ekNQHCak7IO6dleBxxsVxD8V0HUrHm3FZwNde8LMy5jWxXz3yJT56fJoM6ljbhuRI5Y_NYL2CPxGN-ouSm_b9-pvzQb2lgprqjRSI8g_4T0QCBnlNX0iYb2EoF6oPHfSGtWdQ=s680-w680-h510-rw", alt: "Bakery Counter", span: "row-span-2 col-span-1" },
    { id: 2, category: 'Interior', src: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweortugaS3yd-yNR4iiuAAQ-_t7XUbnqKlOb7Z5_U38vqd4yysDfuQ3daUNPYwiksmtdS02JDK6mRq9XGvEJGOpdJyB6U47UTsF2TcEVv2BYfHygJQTsDpp9rItudpzOTJ8ttBJW=s680-w680-h510-rw", alt: "Display Case", span: "row-span-1 col-span-1" },
    { id: 3, category: 'Interior', src: "https://content.jdmagicbox.com/comp/guntur/z6/9999px863.x863.220205220510.q3z6/catalogue/little-true-cakes-and-desserts-guntur-bakeries-0iig1htdzl-250.jpg", alt: "Pink Decor", span: "row-span-1 col-span-1" },

    // Food
    { id: 4, category: 'Food', src: "https://images.jdmagicbox.com/comp/guntur/t9/9999px863.x863.200828205813.u4t9/catalogue/bakery-delights-svn-colony-guntur-bakeries-xh489ih2rk-250.jpg", alt: "Biscuits", span: "row-span-1 col-span-1" },
    { id: 5, category: 'Food', src: "https://files.yappe.in/place/small/little-h-true-cakes-desserts-4591575.webp", alt: "Cupcakes", span: "row-span-2 col-span-1" },
    { id: 6, category: 'Food', src: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=800", alt: "Macarons", span: "row-span-1 col-span-1" },

    // Drinks
    { id: 7, category: 'Drinks', src: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?auto=format&fit=crop&q=80&w=800", alt: "Milkshake", span: "row-span-1 col-span-1" },
    { id: 8, category: 'Drinks', src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800", alt: "Hot Chocolate", span: "row-span-1 col-span-1" },
    { id: 9, category: 'Drinks', src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800", alt: "Specialty Drink", span: "row-span-1 col-span-1" },
    { id: 10, category: 'Drinks', src: matchaLatte, alt: "Matcha Latte", span: "row-span-1 col-span-1" },
];

const categories = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Interior', label: 'Interior', icon: Armchair },
    { id: 'Food', label: 'Food', icon: Utensils },
    { id: 'Drinks', label: 'Drinks', icon: Coffee },
];

import { useBrand } from '../context/BrandContext';

const GalleryPage = () => {
    const { brand, theme } = useBrand();
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const imagesToUse = theme.isTeasNTrees ? teasImages : littlehImages;

    const filteredImages = activeCategory === 'All'
        ? imagesToUse
        : imagesToUse.filter(img => img.category === activeCategory);

    // LittleH Custom Gallery Experience
    if (theme.isLittleH) {
        return (
            <div className="min-h-screen pt-28 pb-20 bg-[#FAF1E8] font-sans selection:bg-[#565A47] selection:text-[#FAF1E8]">
                <div className="container mx-auto px-4 lg:px-8">

                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <span className="uppercase tracking-[0.3em] text-[#8B8E7B] text-sm font-semibold mb-6 block">Portfolio</span>
                        <h1 className="text-5xl lg:text-7xl font-playfair font-bold text-[#565A47] mb-8 leading-tight">
                            The Artisan <span className="italic font-light">Gallery</span>
                        </h1>
                        <p className="text-[#8B8E7B] text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            A curated collection of our finest bakes, bespoke celebration cakes, and the beautiful space we've created for you.
                        </p>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-6 mb-16 border-b border-[#8B8E7B]/10 pb-8">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-4 py-2 text-sm uppercase tracking-[0.2em] transition-all duration-300 relative",
                                    activeCategory === cat.id
                                        ? "text-[#565A47] font-bold"
                                        : "text-[#8B8E7B] font-light hover:text-[#565A47]"
                                )}
                            >
                                {cat.label}
                                {activeCategory === cat.id && (
                                    <motion.div
                                        layoutId="galleryTabLittleH"
                                        className="absolute -bottom-[33px] left-0 right-0 h-0.5 bg-[#565A47]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Masonry Grid Simulation (Using flex/columns for pure CSS masonry-like feel) */}
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        <AnimatePresence>
                            {filteredImages.map((img) => (
                                <motion.div
                                    layout
                                    key={img.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative overflow-hidden cursor-pointer group break-inside-avoid shadow-lg bg-[#FDF5EC]"
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        className="w-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />

                                    {/* Elegant Overlay */}
                                    <div className="absolute inset-0 bg-[#565A47]/0 group-hover:bg-[#565A47]/20 transition-colors duration-500"></div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center mb-4 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                                            <ZoomIn className="text-white w-5 h-5 flex-shrink-0" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                                        <div className="bg-[#FAF1E8] p-4 flex justify-between items-center border border-[#8B8E7B]/10">
                                            <span className="font-playfair font-bold text-[#565A47] text-lg">{img.alt}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-[#8B8E7B] font-semibold">{img.category}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-[#FAF1E8] flex items-center justify-center p-4 md:p-12"
                            onClick={() => setSelectedImage(null)}
                        >
                            <button
                                className="absolute top-8 right-8 p-3 rounded-full text-[#565A47] hover:bg-[#FDF5EC] hover:text-black transition-colors"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X strokeWidth={1.5} className="w-6 h-6" />
                            </button>

                            <div className="max-w-5xl w-full flex flex-col items-center gap-6">
                                <motion.img
                                    initial={{ scale: 0.95, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.95, y: -20 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    src={selectedImage.src}
                                    alt={selectedImage.alt}
                                    className="max-h-[75vh] w-auto shadow-2xl object-contain border border-[#8B8E7B]/10"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-center"
                                >
                                    <h3 className="text-3xl font-playfair font-bold text-[#565A47] mb-2">{selectedImage.alt}</h3>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-8 h-px bg-[#8B8E7B]"></div>
                                        <span className="text-xs uppercase tracking-[0.2em] text-[#8B8E7B] font-medium">{selectedImage.category}</span>
                                        <div className="w-8 h-px bg-[#8B8E7B]"></div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">{theme.brandName} Gallery</h1>
                    <div className={`w-20 h-1.5 bg-gradient-to-r ${theme.gradientClass} rounded-full mx-auto mb-6`} />
                    <p className="text-slate-500 text-lg">
                        {theme.isTeasNTrees
                            ? "Explore the visuals of our cozy spaces, delicious meals, and refreshing brews."
                            : "Explore the magical treats, custom cakes, and beautiful pastries from our bakery."}
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "px-6 py-3 rounded-full flex items-center gap-2 font-bold transition-all shadow-sm",
                                activeCategory === cat.id
                                    ? `${theme.primaryColorClass} text-white ${theme.primaryColorClass.replace('bg-', 'shadow-')}/40 shadow-lg scale-105`
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            )}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Gallery Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]"
                >
                    <AnimatePresence>
                        {filteredImages.map((img) => (
                            <motion.div
                                layout
                                key={img.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                className={`relative rounded-3xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow ${img.span}`}
                                onClick={() => setSelectedImage(img)}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                                        {img.category}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-white font-bold">{img.alt}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={selectedImage.src}
                            alt={selectedImage.alt}
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute bottom-10 left-0 right-0 text-center text-white">
                            <h3 className="text-2xl font-bold mb-2">{selectedImage.alt}</h3>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{selectedImage.category}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GalleryPage;
