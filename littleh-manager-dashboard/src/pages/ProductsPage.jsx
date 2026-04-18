import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search, Package, Edit,
    Image as ImageIcon, MoreVertical, Filter,
    CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';
import ProductModal from '../components/ProductModal';

export default function ProductsPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
    const { tick, bump } = useRefresh();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['all']);
    const [loading, setLoading] = useState(true);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 12;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchCategories = async () => {
        try {
            setIsCategoryLoading(true);
            const response = await api.get('/manager/categories');
            if (response.data.success) {
                const fetchedCats = response.data.data.map(c => c.name);
                setCategories(['all', ...fetchedCats]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setIsCategoryLoading(false);
        }
    };

    const fetchProducts = useCallback(async (page = 1, search = '', category = 'all') => {
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                brand: b
            };

            if (search) params.search = search;
            if (category !== 'all') params.category = category;

            const response = await api.get('/manager/products', { params });

            if (response.data.success) {
                setProducts(response.data.data || []);
                setTotalPages(response.data.pagination.totalPages);
                setCurrentPage(response.data.pagination.current);
                setTotalItems(response.data.pagination.totalItems);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [b]);

    useEffect(() => {
        fetchCategories();
    }, [b]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(1, searchTerm, categoryFilter);
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchTerm, categoryFilter, fetchProducts, tick]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchProducts(newPage, searchTerm, categoryFilter);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Product Catalog</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Inventory Management • {totalItems} Total Products</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-accent" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="input pl-12"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-bakery-accent shrink-0" />
                    {isCategoryLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-bakery-primary" />
                    ) : (
                        categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${categoryFilter === cat
                                    ? 'bg-bakery-primary text-white shadow-lg shadow-bakery-primary/20'
                                    : 'bg-bakery-light text-bakery-accent hover:bg-white'}`}
                            >
                                {cat}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-bakery-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-bakery-accent">Loading Deliciousness...</p>
                </div>
            ) : products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="card group relative overflow-hidden">
                                <div className="aspect-square rounded-2xl bg-bakery-light mb-6 overflow-hidden relative">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-bakery-accent opacity-20">
                                            <ImageIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-black text-[10px] uppercase text-bakery-primary shadow-sm">
                                        {product.cakePricing?.basePricePerKg ? (
                                            `₹${product.displayPrice || product.cakePricing.basePricePerKg} / kg`
                                        ) : product.sizeOptions?.length > 0 ? (
                                            `From ₹${product.displayPrice}`
                                        ) : (
                                            `₹${product.displayPrice || product.price || 0}`
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-1">{product.category?.name || 'Uncategorized'}</p>
                                            <h3 className="text-lg font-black text-bakery-primary uppercase tracking-tight leading-tight">{product.name}</h3>
                                        </div>
                                        <div className={`flex items-center gap-1 ${product.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {product.isAvailable ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    <div className="flex pt-4 border-t border-bakery-light gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="flex-1 bg-bakery-light hover:bg-bakery-primary hover:text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn font-black uppercase"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Update Price & Stock</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-12 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 max-w-fit mx-auto">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-bakery-light text-bakery-primary disabled:opacity-30 transition-all hover:bg-bakery-primary hover:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                                            ? 'bg-bakery-primary text-white shadow-lg'
                                            : 'bg-bakery-light text-bakery-accent hover:bg-white'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl bg-bakery-light text-bakery-primary disabled:opacity-30 transition-all hover:bg-bakery-primary hover:text-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-bakery-light">
                    <Package className="w-16 h-16 text-bakery-accent/20 mx-auto mb-6" />
                    <p className="text-bakery-accent font-black uppercase tracking-widest text-xs">No products found matching your criteria</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setCategoryFilter('all');
                            setCurrentPage(1);
                        }}
                        className="mt-6 text-bakery-primary font-black uppercase text-[10px] underline underline-offset-4"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSuccess={bump}
            />
        </div>
    );
}
