import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CategoryTabs from '../components/CategoryTabs';
import MenuCard from '../components/MenuCard';
import { productService } from '../services/productService';
import { useBrand } from '../context/BrandContext';
import { Sparkles, Cookie } from 'lucide-react';

// Debounce hook for search
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const MenuPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { brand, theme } = useBrand();

    // 1. URL Source of Truth
    const queryQ = searchParams.get('q') || ''; // From Navbar
    const querySearch = searchParams.get('search') || ''; // From local Menu bar

    const [activeCategory, setActiveCategory] = useState('all');

    // 2. Local state for the input
    const [searchTerm, setSearchTerm] = useState(querySearch);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // 3. EXCLUSIVITY LOGIC: If Global search (q) comes in, clear Local
    useEffect(() => {
        if (queryQ) {
            setSearchTerm('');
            setActiveCategory('all');

            // Also ensure 'search' is removed from URL if it was there
            if (searchParams.has('search')) {
                const newParams = Object.fromEntries(searchParams);
                delete newParams.search;
                setSearchParams(newParams);
            }
        }
    }, [queryQ]);

    // 4. EXCLUSIVITY LOGIC: If Local search (debouncedSearch) comes in, clear Global
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';

        if (debouncedSearch !== urlSearch) {
            const newParams = Object.fromEntries(searchParams);

            if (debouncedSearch) {
                newParams.search = debouncedSearch;
                delete newParams.q;
            } else {
                delete newParams.search;
            }
            setSearchParams(newParams);
        }
    }, [debouncedSearch]);

    // 5. Back/Forward button support
    useEffect(() => {
        if (querySearch !== searchTerm && !queryQ) {
            setSearchTerm(querySearch);
        }
    }, [querySearch, queryQ]);


    // Fetch Categories
    const { data: rawCategories } = useQuery({
        queryKey: ['categories', brand],
        queryFn: () => productService.getCategories(brand),
    });

    const categories = [
        { id: 'all', name: 'All' },
        ...(rawCategories || [])
    ];

    // Fetch Products (Backend supports both, but UI handles exclusivity)
    const { data: products, isLoading, isError, error } = useQuery({
        queryKey: ['products', activeCategory, queryQ, querySearch, brand],
        queryFn: () => {
            return productService.getAllProducts({
                category: activeCategory,
                q: queryQ,
                search: querySearch,
                brand: brand
            });
        },
    });

    // Real-time updates
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => queryClient.invalidateQueries({ queryKey: ['products'] });
        const events = ['product:created', 'product:updated', 'product:deleted'];
        events.forEach(e => socket.on(e, handleUpdate));
        return () => events.forEach(e => socket.off(e, handleUpdate));
    }, [socket, queryClient]);

    const displayProducts = products || [];

    const clearAll = () => {
        setSearchTerm('');
        setSearchParams({});
    };

    if (theme.isLittleH) {
        return (
            <div className="min-h-screen bg-[#FAF1E8] pb-20 font-sans selection:bg-[#565A47] selection:text-[#FAF1E8]">
                {/* Chic Header */}
                <div className="pt-28 pb-12 bg-[#FDF5EC] border-b border-[#8B8E7B]/20 mb-8">
                    <div className="container mx-auto px-4 lg:px-8 text-center">
                        <div className="flex justify-center mb-4">
                            <Cookie className="w-8 h-8 text-[#565A47]" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-playfair font-bold text-[#565A47] mb-4">Artisan Menu</h1>
                        <p className="text-[#8B8E7B] font-light max-w-xl mx-auto tracking-wide">
                            Discover our daily selection of handcrafted pastries, bespoke cakes, and delicate sweets.
                        </p>
                    </div>
                </div>

                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={(cat) => setActiveCategory(cat)}
                />

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Minimalist Search Area */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 pb-6 border-b border-[#8B8E7B]/10">
                        <h2 className="text-2xl font-playfair italic text-[#565A47] self-start md:self-center">
                            {activeCategory === 'all' ? 'Signature Collection' : 'Curated Selection'}
                        </h2>

                        <div className="relative w-full md:w-96 group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search our bakery..."
                                className="w-full bg-[#FDF5EC] border-none rounded-none py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#565A47]/30 transition-all font-light text-[#565A47] placeholder-[#8B8E7B]/60"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8E7B] w-4 h-4" strokeWidth={1.5} />

                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B8E7B] hover:text-[#565A47] transition-colors"
                                >
                                    <XCircle className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#8B8E7B]/30 group-focus-within:bg-[#565A47] transition-colors" />
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(queryQ || querySearch) && (
                        <div className="mb-10 flex flex-wrap items-center gap-4 justify-center">
                            {queryQ && (
                                <span className="text-xs uppercase tracking-widest text-[#565A47] bg-[#FDF5EC] border border-[#565A47]/20 px-4 py-2 flex items-center gap-2">
                                    Global: {queryQ}
                                    <button onClick={() => setSearchParams({})} className="hover:text-red-900 transition-colors ml-2"><XCircle className="w-3 h-3" /></button>
                                </span>
                            )}
                            {querySearch && (
                                <span className="text-xs uppercase tracking-widest text-[#565A47] bg-[#FDF5EC] border border-[#565A47]/20 px-4 py-2 flex items-center gap-2">
                                    Filter: {querySearch}
                                    <button onClick={() => setSearchTerm('')} className="hover:text-red-900 transition-colors ml-2"><XCircle className="w-3 h-3" /></button>
                                </span>
                            )}
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-[#565A47] animate-spin" strokeWidth={1} />
                        </div>
                    )}

                    {!isLoading && isError && (
                        <div className="text-center py-20 font-playfair italic text-red-900/70 text-lg">
                            We apologize, but we could not retrieve our menu at this time.
                        </div>
                    )}

                    {/* Masonry-style CSS Grid for items */}
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        <AnimatePresence mode="popLayout">
                        {displayProducts.map((product) => (
                            <MenuCard key={product._id} product={product} />
                        ))}
                        </AnimatePresence>
                    </motion.div>

                    {displayProducts.length === 0 && !isLoading && (
                        <div className="text-center py-32 space-y-4">
                            <Sparkles className="w-8 h-8 text-[#8B8E7B]/40 mx-auto" strokeWidth={1} />
                            <p className="font-playfair text-xl text-[#8B8E7B]">Our ovens are empty for this selection.</p>
                            <button
                                onClick={clearAll}
                                className="text-xs uppercase tracking-widest text-[#565A47] border-b border-[#565A47] pb-1 hover:text-black transition-colors"
                            >
                                View Full Menu
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="h-20" />

            <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onSelect={(cat) => {
                    setActiveCategory(cat);
                }}
            />

            <div className="container mx-auto px-4 lg:px-8 py-8">

                {/* Search Feedback Header */}
                {(queryQ || querySearch) && (
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        {queryQ && (
                            <div className={`bg-${theme.primaryColor}/10 ${theme.textColorClass} px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium border border-${theme.primaryColor}/20`}>
                                Global: "{queryQ}"
                                <button onClick={() => setSearchParams({})} className="hover:text-red-500 transition-colors">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {querySearch && (
                            <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium border border-blue-100">
                                Filtering: "{querySearch}"
                                <button onClick={() => setSearchTerm('')} className="hover:text-red-500 transition-colors">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-slate-800 self-start">
                        {activeCategory === 'all' ? 'Full Menu' : 'Selected Collection'}
                    </h2>

                    <div className="relative w-full md:w-80 group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter these results..."
                            className={`w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all shadow-sm`}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xl"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className={`w-10 h-10 ${theme.textColorClass} animate-spin`} />
                    </div>
                )}

                {!isLoading && isError && (
                    <div className="text-center py-12 text-red-500">
                        Error loading products. Please try again.
                    </div>
                )}

                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                    {displayProducts.map((product) => (
                        <MenuCard key={product._id} product={product} />
                    ))}
                    </AnimatePresence>
                </motion.div>

                {displayProducts.length === 0 && !isLoading && (
                    <div className="text-center py-20 text-slate-500">
                        No items found.
                        <button
                            onClick={clearAll}
                            className={`mt-4 ${theme.textColorClass} hover:underline block mx-auto`}
                        >
                            Clear All Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
