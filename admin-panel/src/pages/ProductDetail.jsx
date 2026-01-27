import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import { ArrowLeft, Edit, Trash2, Calendar, Tag } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/admin/products/${id}`);
            setProduct(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch product:', error);
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async () => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/products/${id}`);
            navigate('/products');
        } catch (error) {
            console.error('Failed to delete product:', error);
            setError(error.response?.data?.message || 'Failed to delete product');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Product not found</p>
                <button
                    onClick={() => navigate('/products')}
                    className="btn-primary"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
                        <p className="text-gray-600 mt-1">View and manage product information</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Edit className="w-5 h-5" />
                        Edit
                    </button>
                    <button
                        onClick={deleteProduct}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Image */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <p className="text-gray-400">No image</p>
                            )}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Name</label>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{product.name}</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <p className="text-gray-700 mt-2 leading-relaxed">{product.description || 'No description'}</p>
                        </div>

                        {/* Price & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Price</label>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    {product.sizeOptions?.length > 0
                                        ? `₹${product.displayPrice}`
                                        : `₹${product.displayPrice}`}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Category</label>
                                <p className="text-lg font-semibold text-gray-900 mt-2">
                                    {typeof product.category === 'string' ? product.category : product.category?.name}
                                </p>
                            </div>
                        </div>

                        {/* Availability */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Availability</label>
                            <div className="mt-2">
                                <span className={`px-4 py-2 rounded-full font-semibold ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {product.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4" />
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag, index) => (
                                        <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seasonal Info */}
                        {product.isSeasonal && (
                            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                    <p className="font-semibold text-orange-900">Seasonal Product</p>
                                </div>
                                <p className="text-sm text-orange-800 mb-3">Available in the following months:</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.availableMonths?.map((month) => (
                                        <span key={month} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {monthNames[month - 1]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6 h-fit space-y-4">
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {product.sizeOptions?.length > 0
                                ? `₹${product.displayPrice}`
                                : `₹${product.displayPrice}`}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-sm font-medium text-gray-900 mt-2">
                            {product.isAvailable ? '✓ Available' : '✗ Unavailable'}
                        </p>
                    </div>

                    {product.preparationTime && (
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600">Preparation Time</p>
                            <p className="text-sm font-medium text-gray-900 mt-2">{product.preparationTime} mins</p>
                        </div>
                    )}

                    {product.createdAt && (
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600">Created</p>
                            <p className="text-sm font-medium text-gray-900 mt-2">
                                {new Date(product.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    )}

                    {product.updatedAt && (
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600">Last Updated</p>
                            <p className="text-sm font-medium text-gray-900 mt-2">
                                {new Date(product.updatedAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    fetchProduct();
                }}
                product={product}
                onSuccess={() => {
                    setShowModal(false);
                    fetchProduct();
                }}
            />
        </div>
    );
}
