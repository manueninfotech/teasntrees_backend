import { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Calendar,
    Package,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square
} from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [bulkAction, setBulkAction] = useState(null);
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 12
    });
    const [filters, setFilters] = useState({
        category: '',
        tag: '',
        availability: 'all'
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [pagination.currentPage, searchTerm, filters]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories?limit=100');
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            // Build query params
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                search: searchTerm
            });

            if (filters.category) params.append('category', filters.category);
            if (filters.tag) params.append('tags', filters.tag);
            if (filters.availability !== 'all') {
                params.append('isAvailable', filters.availability === 'available' ? 'true' : 'false');
            }

            const response = await api.get(`/admin/products?${params.toString()}`);
            const productsData = response.data.data || [];
            setProducts(Array.isArray(productsData) ? productsData : []);

            // Update pagination info
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination.totalPages || 1,
                    totalProducts: response.data.count || 0
                }));
            }
            setError(null);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setError('Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (id, currentStatus) => {
        try {
            await api.put(`/admin/products/${id}/availability`, {
                isAvailable: !currentStatus
            });
            fetchProducts();
        } catch (error) {
            console.error('Failed to toggle availability:', error);
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/admin/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const toggleProductSelection = (productId) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            const allIds = new Set(filteredProducts.map(p => p._id));
            setSelectedProducts(allIds);
        }
    };

    const executeBulkAction = async () => {
        if (!bulkAction || selectedProducts.size === 0) return;

        try {
            const productIds = Array.from(selectedProducts);

            if (bulkAction === 'make-available') {
                await api.put('/admin/products/bulk-update', {
                    productIds,
                    updates: { isAvailable: true }
                });
            } else if (bulkAction === 'make-unavailable') {
                await api.put('/admin/products/bulk-update', {
                    productIds,
                    updates: { isAvailable: false }
                });
            } else if (bulkAction === 'delete') {
                if (!window.confirm(`Delete ${productIds.length} products? This action cannot be undone.`)) return;
                for (const id of productIds) {
                    await api.delete(`/admin/products/${id}`);
                }
            }

            setSelectedProducts(new Set());
            setBulkAction(null);
            fetchProducts();
        } catch (error) {
            console.error('Failed to execute bulk action:', error);
            setError(error.response?.data?.message || 'Bulk action failed');
        }
    };

    const filteredProducts = products.filter(product =>
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 mt-1">Manage your menu items and seasonal products</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="input"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tag
                        </label>
                        <select
                            value={filters.tag}
                            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                            className="input"
                        >
                            <option value="">All Tags</option>
                            <option value="new-intro">New Intro</option>
                            <option value="must-try">Must Try</option>
                            <option value="best-seller">Best Seller</option>
                            <option value="egg-contains">Egg Contains</option>
                        </select>
                    </div>

                    {/* Availability Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Availability
                        </label>
                        <select
                            value={filters.availability}
                            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                            className="input"
                        >
                            <option value="all">All Products</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                {(filters.category || filters.tag || filters.availability !== 'all') && (
                    <button
                        onClick={() => setFilters({ category: '', tag: '', availability: 'all' })}
                        className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                            {selectedProducts.size} product(s) selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            className="text-sm border border-blue-300 rounded-lg px-3 py-1 bg-white"
                        >
                            <option value="">Choose action...</option>
                            <option value="make-available">Make Available</option>
                            <option value="make-unavailable">Make Unavailable</option>
                            <option value="delete">Delete All</option>
                        </select>
                        <button
                            onClick={executeBulkAction}
                            disabled={!bulkAction}
                            className="btn-primary text-sm py-1 px-3 disabled:opacity-50"
                        >
                            Apply
                        </button>
                        <button
                            onClick={() => setSelectedProducts(new Set())}
                            className="btn-secondary text-sm py-1 px-3"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product._id}
                        className={`relative bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${selectedProducts.has(product._id) ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'}`}
                    >
                        {/* Checkbox Overlay */}
                        <div className="absolute top-3 left-3 z-10">
                            <button
                                onClick={() => toggleProductSelection(product._id)}
                                className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                            >
                                {selectedProducts.has(product._id) ? (
                                    <CheckSquare className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>

                        {/* Product Image */}
                        <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Package className="w-16 h-16 text-green-600" />
                            )}
                            {/* Availability Toggle - Positioned on Image */}
                            <button
                                onClick={() => toggleAvailability(product._id, product.isAvailable)}
                                className={`absolute top-3 right-3 p-2 rounded-lg shadow-md ${product.isAvailable
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400'
                                    }`}
                                title={product.isAvailable ? 'Hide product' : 'Show product'}
                            >
                                {product.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Product Info - Flex grow to push buttons to bottom */}
                        <div className="p-4 flex flex-col flex-1">
                            <div className="flex-1">
                                <div className="mb-2">
                                    <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
                                    {product.isSeasonal && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                            <Calendar className="w-3 h-3" />
                                            Seasonal
                                        </div>
                                    )}
                                </div>

                                {/* Seasonal Months */}
                                {product.isSeasonal && (
                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Available in:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {product.availableMonths?.map((month) => (
                                                <span
                                                    key={month}
                                                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                                >
                                                    {monthNames[month - 1]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {product.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {product.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions - Always at bottom */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => navigate(`/products/${product._id}`)}
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingProduct(product);
                                        setShowModal(true);
                                    }}
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteProduct(product._id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                        Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                        {' • '}
                        <span className="font-medium">{pagination.totalProducts}</span> total products
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                }}
                product={editingProduct}
                onSuccess={fetchProducts}
            />
        </div>
    );
}