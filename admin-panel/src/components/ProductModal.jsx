import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';

export default function ProductModal({ isOpen, onClose, product, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true,
        isSeasonal: false,
        availableMonths: [],
        tags: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (product) {
                // Edit mode - populate form
                const categoryId = typeof product.category === 'string' ? product.category : product.category?._id || '';

                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price || '',
                    category: categoryId,
                    image: product.image || '',
                    isAvailable: product.isAvailable ?? true,
                    isSeasonal: product.isSeasonal ?? false,
                    availableMonths: product.availableMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    tags: product.tags?.join(', ') || ''
                });
                // Set image preview if editing
                if (product.image) {
                    setImagePreview(product.image);
                }
            } else {
                // Add mode - reset form
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    image: '',
                    isAvailable: true,
                    isSeasonal: false,
                    availableMonths: [],
                    tags: ''
                });
                setImagePreview('');
                setImageFile(null);
            }
            setError('');
        }
    }, [isOpen, product]);

    const handleSeasonalChange = (checked) => {
        setFormData({
            ...formData,
            isSeasonal: checked,
            // When enabling seasonal, start with empty months so user can select which ones
            // When disabling seasonal, set to all months (product available year-round)
            availableMonths: checked ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        });
    };

    const fetchCategories = async () => {
        try {
            // Request all categories with a high limit to avoid pagination
            const response = await api.get('/admin/categories?limit=100');
            const categoriesData = response.data.data || [];
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return formData.image;

        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);

        try {
            const response = await api.post('/admin/upload/image?folder=products', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.data.url;
        } catch (error) {
            console.error('Failed to upload image:', error);
            throw new Error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Upload image first if there's a new file
            let imageUrl = formData.image;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const payload = {
                ...formData,
                image: imageUrl,
                price: parseFloat(formData.price),
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            };

            if (product) {
                // Update existing product
                await api.put(`/admin/products/${product._id}`, payload);
            } else {
                // Create new product
                await api.post('/admin/products', payload);
            }

            // Reset image states
            setImageFile(null);
            setImagePreview('');

            // Small delay to ensure database has committed changes
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 100);
        } catch (error) {
            console.error('Error saving product:', error.response?.data || error.message);

            // Show detailed validation errors
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const errorMessages = error.response.data.errors.map(err => err.message || err).join(', ');
                setError(errorMessages);
            } else {
                setError(error.response?.data?.message || error.message || 'Failed to save product');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMonth = (month) => {
        setFormData(prev => ({
            ...prev,
            availableMonths: prev.availableMonths.includes(month)
                ? prev.availableMonths.filter(m => m !== month)
                : [...prev.availableMonths, month].sort((a, b) => a - b)
        }));
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input resize-none"
                                rows="3"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Price (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Image
                            </label>
                            <div className="space-y-3">
                                {/* Image Preview */}
                                {(imagePreview || formData.image) && (
                                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={imagePreview || formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview('');
                                                setFormData({ ...formData, image: '' });
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* File Upload */}
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {['new-intro', 'must-try', 'best-seller', 'egg-contains'].map((tag) => (
                                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.tags.split(',').map(t => t.trim()).includes(tag)}
                                            onChange={(e) => {
                                                const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, tags: [...currentTags, tag].join(', ') });
                                                } else {
                                                    setFormData({ ...formData, tags: currentTags.filter(t => t !== tag).join(', ') });
                                                }
                                            }}
                                            className="w-4 h-4 text-green-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{tag.replace('-', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2 flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="w-4 h-4 text-green-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Available</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isSeasonal}
                                    onChange={(e) => handleSeasonalChange(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Seasonal Product</span>
                            </label>
                        </div>

                        {formData.isSeasonal && (
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Available Months
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {monthNames.map((month, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => toggleMonth(index + 1)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.availableMonths.includes(index + 1)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {month}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn-secondary py-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex-1 btn-primary py-3 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading image...' : loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
