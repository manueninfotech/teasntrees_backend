import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Coffee, Hexagon } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

const CategoryTabs = ({ categories, activeCategory, onSelect }) => {
    const { theme } = useBrand();
    return (
        <div className={cn("w-full border-b z-40 transition-colors duration-500", theme.isLittleH ? "border-[#8B8E7B]/20 bg-[#FAF1E8]" : "sticky top-20 border-black/5 bg-white/40")} style={theme.isLittleH ? {} : { backdropFilter: 'blur(12px)' }}>
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center gap-4 overflow-x-auto py-4 no-scrollbar">
                    {categories.map((cat) => {
                        const categoryId = cat._id || cat.id;

                        if (theme.isLittleH) {
                            return (
                                <button
                                    key={categoryId}
                                    onClick={() => onSelect(categoryId)}
                                    className={cn(
                                        "relative z-10 px-6 py-2 transition-all whitespace-nowrap flex items-center gap-2 group text-sm uppercase tracking-widest font-semibold",
                                        activeCategory === categoryId
                                            ? "text-[#FAF1E8]"
                                            : "text-[#8B8E7B] hover:text-[#565A47]"
                                    )}
                                >
                                    {activeCategory === categoryId && (
                                        <motion.div
                                            layoutId="activeTabLittleH"
                                            className="absolute inset-0 bg-[#565A47] -z-10"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    {cat.name === 'All' && <Hexagon className={cn("w-3 h-3", activeCategory === categoryId ? "text-[#FAF1E8]" : "text-[#565A47]")} strokeWidth={2} />}
                                    {cat.name}
                                </button>
                            );
                        }

                        return (
                            <button
                                key={categoryId}
                                onClick={() => onSelect(categoryId)}
                                className={cn(
                                    "relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                                    activeCategory === categoryId
                                        ? `text-white shadow-lg ${theme.shadowClass} scale-105`
                                        : `text-slate-600 hover:bg-white/50 ${theme.textColorClass.replace('text-', 'hover:text-')}`
                                )}
                            >
                                {activeCategory === categoryId && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 bg-gradient-to-r ${theme.gradientClass} rounded-full -z-10`}
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
