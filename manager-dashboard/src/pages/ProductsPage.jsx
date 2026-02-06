import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    ShoppingBag,
    Image as ImageIcon,
    Tag,
    DollarSign,
    CheckCircle,
    XCircle,
    X,
    Save,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EditProductModal = ({ product, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        price: '',
        isAvailable: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                price: product.price,
                isAvailable: product.isAvailable
            });
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(product._id, {
                price: Number(formData.price),
                isAvailable: formData.isAvailable
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white"
            >
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Edit Item</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Update price and stock</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Read-Only Info */}
                    <div className="flex gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-brand-primary/10" />
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-gray-200" />
                            )}
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none mb-1">{product.category?.name || 'GENERIC'}</p>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-tight">{product.name}</h3>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Name Cannot be Changed</span>
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full pl-12 pr-4 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-brand-primary/5 focus:bg-white focus:border-brand-primary outline-none transition-all font-black text-2xl tracking-tighter text-gray-900 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Stock Status</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isAvailable: true })}
                                    className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all group
                                        ${formData.isAvailable
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:bg-emerald-50/30'}
                                    `}
                                >
                                    <CheckCircle className={`w-6 h-6 ${formData.isAvailable ? 'text-white' : 'text-gray-300 group-hover:text-emerald-500'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">In Stock</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isAvailable: false })}
                                    className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all group
                                        ${!formData.isAvailable
                                            ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200 scale-105'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:bg-rose-50/30'}
                                    `}
                                >
                                    <XCircle className={`w-6 h-6 ${!formData.isAvailable ? 'text-white' : 'text-gray-300 group-hover:text-rose-500'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-3xl hover:bg-gray-50 transition-all hover:text-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02]"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ProductsPage = () => {
    const { token } = useAuth();

    // State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                ...(search && { search })
            });
            const res = await fetch(`http://localhost:5000/api/manager/products?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, token, page]);

    // Handle Quick Toggle
    const handleToggle = async (product) => {
        try {
            // Optimistic Update
            setProducts(prev => prev.map(p =>
                p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p
            ));

            await fetch(`http://localhost:5000/api/manager/products/${product._id}/availability`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAvailable: !product.isAvailable })
            });
        } catch (err) {
            console.error("Failed to toggle availability", err);
            // Revert on failure
            fetchProducts();
        }
    };

    // Handle Full Update (Price + Status)
    const handleUpdate = async (id, updates) => {
        const res = await fetch(`http://localhost:5000/api/manager/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
            setProducts(prev => prev.map(p =>
                p._id === id ? { ...p, ...updates } : p
            ));
        } else {
            alert('Failed to update product');
        }
    };

    return (
        <div className="space-y-6 relative mb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Products</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Change prices and stock</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 items-center sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 flex-1 max-w-lg">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {/* Note: Create button removed as per access restrictions */}
            </div>

            {/* Product Grid */}
            <div className="">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                        <p>No products found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {products.map(product => (
                            <motion.div
                                key={product._id}
                                layout
                                className={`bg-white rounded-[2.2rem] border-2 shadow-sm transition-all group overflow-hidden flex flex-col relative
                                    ${!product.isAvailable ? 'border-gray-100 grayscale hover:grayscale-0 ring-gray-100 opacity-80' : 'border-gray-50 hover:border-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/10 hover:-translate-y-1'}
                                `}
                            >
                                {/* Quick Availability Toggle - Glass Overlay */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggle(product); }}
                                        className={`px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-110 active:scale-95 border
                                            ${product.isAvailable
                                                ? 'bg-emerald-600/90 text-white border-white/20'
                                                : 'bg-rose-600/90 text-white border-white/20'}
                                        `}
                                    >
                                        {product.isAvailable ? 'In Stock' : 'No Stock'}
                                    </button>
                                </div>

                                {/* Image Area with Modern Framing */}
                                <div className="h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center p-3">
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {product.image ? (
                                        <div className="w-full h-full rounded-[1.8rem] overflow-hidden shadow-sm">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-100 shadow-inner">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-6 pt-2 flex flex-col flex-1">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] uppercase leading-none px-2 py-1 bg-emerald-50 rounded-lg">
                                                {product.category?.name || 'ITEM'}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-gray-900 line-clamp-1 uppercase tracking-tighter text-base group-hover:text-emerald-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed line-clamp-1">
                                            {product.description || 'No description available'}
                                        </p>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Price</p>
                                            <p className="font-black text-xl text-gray-900 tracking-tight">₹{product.price}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedProduct(product)}
                                            className="px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:shadow-xl hover:shadow-emerald-200 transition-all duration-300 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 pb-20">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100 transition-all shadow-sm"
                    >
                        Previous
                    </button>

                    <div className="flex items-center px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-900">
                        Page {page} of {totalPages}
                    </div>

                    <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100 transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <EditProductModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        onUpdate={handleUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductsPage;
