import React from 'react';
import { useBrand } from '../context/BrandContext';
import { cn } from '../lib/utils';

const MenuSkeleton = () => {
    const { theme } = useBrand();

    // Shimmer effect classes
    const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";
    
    const bgColor = theme.isLittleH ? "bg-[#8B8E7B]/10" : "bg-slate-200";

    return (
        <div className="animate-pulse">
            {/* Category Tabs Skeleton */}
            <div className="flex justify-center gap-4 mb-12 overflow-hidden px-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                        key={i} 
                        className={cn("h-10 w-24 rounded-full shrink-0", bgColor, shimmer)}
                    />
                ))}
            </div>

            <div className="container mx-auto px-4 lg:px-8">
                {/* Search Bar Skeleton */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className={cn("h-8 w-48 rounded", bgColor, shimmer)} />
                    <div className={cn("h-12 w-full md:w-80 rounded-xl", bgColor, shimmer)} />
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className={cn("h-[450px] rounded-2xl border border-transparent", bgColor, shimmer)}>
                            <div className="h-56 w-full rounded-t-2xl opacity-20 bg-white" />
                            <div className="p-5 space-y-4">
                                <div className="h-4 w-1/3 rounded opacity-20 bg-white" />
                                <div className="h-6 w-3/4 rounded opacity-20 bg-white" />
                                <div className="space-y-2">
                                    <div className="h-3 w-full rounded opacity-20 bg-white" />
                                    <div className="h-3 w-5/6 rounded opacity-20 bg-white" />
                                </div>
                                <div className="pt-4 flex justify-between items-center mt-auto">
                                    <div className="h-8 w-16 rounded opacity-20 bg-white" />
                                    <div className="h-10 w-24 rounded-xl opacity-20 bg-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MenuSkeleton;
