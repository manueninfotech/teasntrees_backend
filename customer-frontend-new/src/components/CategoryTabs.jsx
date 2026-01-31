import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Coffee } from 'lucide-react';

const CategoryTabs = ({ categories, activeCategory, onSelect }) => {
    return (
        <div className="w-full border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-20 z-40">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center gap-4 overflow-x-auto py-4 no-scrollbar">
                    {categories.map((cat) => {
                        const categoryId = cat._id || cat.id;
                        return (
                            <button
                                key={categoryId}
                                onClick={() => onSelect(categoryId)}
                                className={cn(
                                    "relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                                    activeCategory === categoryId
                                        ? "text-white shadow-lg shadow-cafe-emerald/30 scale-105"
                                        : "text-slate-600 hover:bg-white/50 hover:text-cafe-emerald"
                                )}
                            >
                                {activeCategory === categoryId && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-cafe-emerald to-cafe-teal rounded-full -z-10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                {cat.name === 'All' && <Coffee className="w-4 h-4" />}
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategoryTabs;
