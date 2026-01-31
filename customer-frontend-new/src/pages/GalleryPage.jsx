import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

// Placeholder images from Unsplash
const images = [
    { id: 1, src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800", alt: "Coffee Art", span: "row-span-1 col-span-1" },
    { id: 2, src: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800", alt: "Cafe Interior", span: "row-span-2 col-span-1" },
    { id: 3, src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800", alt: "Tea Ceremony", span: "row-span-1 col-span-1" },
    { id: 4, src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800", alt: "Fresh Pastries", span: "row-span-1 col-span-1" },
    { id: 5, src: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800", alt: "Cozy Corner", span: "row-span-2 col-span-1" },
    { id: 6, src: "https://images.unsplash.com/photo-1520978334830-9b0dd71bd3bb?auto=format&fit=crop&q=80&w=800", alt: "Green Plants", span: "row-span-1 col-span-1" },
    { id: 7, src: "https://images.unsplash.com/photo-1442512595331-e89e7385a861?auto=format&fit=crop&q=80&w=800", alt: "Matcha Latte", span: "row-span-1 col-span-1" },
];

const GalleryPage = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Gallery</h1>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-cafe-emerald to-cafe-teal rounded-full mx-auto mb-6" />
                    <p className="text-slate-500 text-lg">
                        A glimpse into the ambiance, food, and moments that make Teas N Trees special.
                    </p>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
                    {images.map((img, idx) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-3xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all ${img.span}`}
                            onClick={() => setSelectedImage(img)}
                        >
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                <p className="text-white font-bold">{img.alt}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
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
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GalleryPage;
