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
    Save
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
            // Only sending price and availability
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Read-Only Info */}
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                            <p className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 px-2 py-0.5 rounded-full inline-block border border-orange-100">
                                Restricted Access: Updates limited to Price & Stock
                            </p>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Availability Status</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isAvailable: true })}
                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all
                                        ${formData.isAvailable
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                    `}
                                >
                                    <CheckCircle className="w-4 h-4" /> In Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isAvailable: false })}
                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all
                                        ${!formData.isAvailable
                                            ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                    `}
                                >
                                    <XCircle className="w-4 h-4" /> Out of Stock
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
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

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: 100, // Fetch all for now or paginate
                ...(search && { search })
            });
            const res = await fetch(`http://localhost:5000/api/manager/products?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, token]);

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
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 text-sm">Manage menu prices and availability</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {products.map(product => (
                            <motion.div
                                key={product._id}
                                layout
                                className={`bg-white rounded-xl border shadow-sm transition-all group overflow-hidden flex flex-col
                                    ${!product.isAvailable ? 'border-gray-100 opacity-75' : 'border-gray-100 hover:border-brand-primary/30 hover:shadow-md'}
                                `}
                            >
                                {/* Image Area */}
                                <div className="h-40 bg-gray-50 relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggle(product); }}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase shadow-sm backdrop-blur-md transition-colors
                                                ${product.isAvailable
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-800 text-white'}
                                            `}
                                        >
                                            {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">{product.category?.name || 'Item'}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                                        <p className="font-bold text-lg text-gray-900">₹{product.price}</p>
                                        <button
                                            onClick={() => setSelectedProduct(product)}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-primary transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

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
