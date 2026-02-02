import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom'; // URL Sync
import CategoryTabs from '../components/CategoryTabs';
import MenuCard from '../components/MenuCard';
import { productService } from '../services/productService';

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
    const initialSearch = searchParams.get('search') || '';

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    // Debounce search term to avoid hitting API on every keystroke
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Sync URL with Search Term
    useEffect(() => {
        if (debouncedSearch) {
            setSearchParams({ search: debouncedSearch });
        } else {
            searchParams.delete('search');
            setSearchParams(searchParams);
        }
    }, [debouncedSearch, setSearchParams]);

    // Update local state if URL is changed externally (e.g. from Navbar)
    useEffect(() => {
        const querySearch = searchParams.get('search') || '';
        if (querySearch !== searchTerm) {
            setSearchTerm(querySearch);
        }
    }, [searchParams]);


    // Fetch Categories
    const { data: rawCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: productService.getCategories,
    });

    // Add 'All' to the valid categories list for local UI logic
    const categories = [
        { id: 'all', name: 'All' },
        ...(rawCategories || [])
    ];

    // Fetch Products
    const { data: products, isLoading, isError } = useQuery({
        // Include debouncedSearch in queryKey so it refetches when it changes
        queryKey: ['products', activeCategory, debouncedSearch],
        queryFn: () => productService.getAllProducts({
            category: activeCategory,
            search: debouncedSearch
        }),
    });

    // Real-time Product Updates
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleProductUpdate = (data) => {
            console.log('[Menu] Product update received:', data);
            // Invalidate all product queries to strictly refresh the grid
            queryClient.invalidateQueries({ queryKey: ['products'] });

            // If we had category counts, we'd invalidate categories too
            if (data.type === 'category' || data.category) {
                queryClient.invalidateQueries({ queryKey: ['categories'] });
            }
        };

        const events = [
            'product:created',
            'product:updated',
            'product:deleted',
            'category:updated' // In case category name changes
        ];

        events.forEach(event => socket.on(event, handleProductUpdate));

        return () => {
            events.forEach(event => socket.off(event, handleProductUpdate));
        };
    }, [socket, queryClient]);

    const displayProducts = products || [];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Spacer */}
            <div className="h-20" />

            {/* Sticky Categories */}
            <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
            />

            {/* Main Content */}
            <div className="container mx-auto px-4 lg:px-8 py-8">

                {/* Search / Filter Row */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-slate-800 self-start">
                        {activeCategory === 'all' ? 'Full Menu' : 'Selected Collection'}
                        {debouncedSearch && <span className="text-lg font-normal text-slate-500 ml-2">(Searching: "{debouncedSearch}")</span>}
                    </h2>

                    {/* Inline search for menu page */}
                    <div className="relative w-full md:w-80 group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in menu..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-emerald/50 transition-all shadow-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />

                        {/* Clear button if searching */}
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <span className="sr-only">Clear</span>
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-cafe-emerald animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="text-center py-12">
                        <p className="text-red-500 mb-2">Failed to load menu.</p>
                        <p className="text-sm text-slate-500">Please try again later.</p>
                    </div>
                )}

                {/* Product Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {displayProducts.map((product) => (
                            <MenuCard key={product._id} product={product} />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Empty State */}
                {displayProducts.length === 0 && !isLoading && (
                    <div className="text-center py-20 text-slate-500">
                        {debouncedSearch
                            ? `No items found matching "${debouncedSearch}".`
                            : (activeCategory === 'all' ? "Our menu is currently being updated. Check back soon!" : "No items found in this category.")}

                        {debouncedSearch && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-cafe-emerald hover:underline"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
