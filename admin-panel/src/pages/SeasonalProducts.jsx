import { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import {
    Edit,
    Trash2,
    Search,
    Calendar,
    Package,
    ChevronLeft,
    ChevronRight,
    Eye,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SeasonalProducts() {
    const [products, setProducts] = useState([]);
    const [outOfSeasonProducts, setOutOfSeasonProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('seasonal'); // 'seasonal' or 'out-of-season'
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetchSeasonalProducts();
    }, []);

    const fetchSeasonalProducts = async () => {
        try {
            const [seasonalRes, outOfSeasonRes] = await Promise.all([
                api.get('/admin/products/seasonal/all'),
                api.get('/admin/products/seasonal/out-of-season')
            ]);

            setProducts(seasonalRes.data.data || []);
            setOutOfSeasonProducts(outOfSeasonRes.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch seasonal products:', error);
            setError('Failed to load seasonal products');
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/admin/products/${id}`);
            fetchSeasonalProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            setError(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const displayProducts = activeTab === 'seasonal' ? products : outOfSeasonProducts;
    const filteredProducts = displayProducts.filter(product =>
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold text-gray-900">Seasonal Products</h1>
                    <p className="text-gray-600 mt-1">Manage seasonal and out-of-season products</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

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

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('seasonal')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'seasonal'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Seasonal Products ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('out-of-season')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'out-of-season'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Out of Season ({outOfSeasonProducts.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'seasonal' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Showing {filteredProducts.length} seasonal product(s)</p>
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                            {/* Product Image */}
                                            <div className="h-40 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-12 h-12 text-green-600" />
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {product.isAvailable ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </div>

                                                {/* Available Months */}
                                                {product.availableMonths && (
                                                    <div className="bg-orange-50 p-2 rounded">
                                                        <p className="text-xs text-gray-600 mb-1">Available:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.availableMonths.map((month) => (
                                                                <span key={month} className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                                                                    {monthNames[month - 1]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2">
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
                                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No seasonal products found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'out-of-season' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Showing {filteredProducts.length} out-of-season product(s)</p>
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="bg-white border border-orange-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                            {/* Product Image */}
                                            <div className="h-40 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover opacity-75"
                                                    />
                                                ) : (
                                                    <Package className="w-12 h-12 text-orange-400" />
                                                )}
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold bg-orange-600 px-3 py-1 rounded">Out of Season</span>
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                                                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                                                        Unavailable
                                                    </span>
                                                </div>

                                                {/* Available Months */}
                                                {product.availableMonths && (
                                                    <div className="bg-blue-50 p-2 rounded">
                                                        <p className="text-xs text-gray-600 mb-1">Will be available:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.availableMonths.map((month) => (
                                                                <span key={month} className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                                                                    {monthNames[month - 1]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2">
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
                                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No out-of-season products</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                }}
                product={editingProduct}
                onSuccess={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    fetchSeasonalProducts();
                }}
            />
        </div>
    );
}
