import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Utensils, Coffee, Armchair, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import matchaLatte from '../assets/matchalatte.jpg';

// Categorized images
const images = [
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

const categories = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Interior', label: 'Interior', icon: Armchair },
    { id: 'Food', label: 'Food', icon: Utensils },
    { id: 'Drinks', label: 'Drinks', icon: Coffee },
];

const GalleryPage = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredImages = activeCategory === 'All'
        ? images
        : images.filter(img => img.category === activeCategory);

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Gallery</h1>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-cafe-emerald to-cafe-teal rounded-full mx-auto mb-6" />
                    <p className="text-slate-500 text-lg">
                        Explore the visuals of our cozy spaces, delicious meals, and refreshing brews.
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
                                    ? "bg-cafe-emerald text-white shadow-emerald-200 shadow-lg scale-105"
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
