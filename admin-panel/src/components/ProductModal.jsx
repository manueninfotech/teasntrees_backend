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
        <div className="fixed inset-0 bg-emerald-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-8 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                placeholder="E.G. CLASSIC LATTE"
                                required
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all min-h-[100px] resize-none"
                                placeholder="PRODUCT COMPOSITION AND TASTE NOTES..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Price (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all appearance-none"
                                required
                            >
                                <option value="">SELECT GROUP</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Tags (separate with comma)
                            </label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                placeholder="E.G. NEW, BESTSELLER, SPICY"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Product Image
                            </label>
                            <div className="space-y-4">
                                {/* Image Preview */}
                                {(imagePreview || formData.image) && (
                                    <div className="relative w-full h-56 bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 group">
                                        <img
                                            src={imagePreview || formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview('');
                                                setFormData({ ...formData, image: '' });
                                            }}
                                            className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-xl"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* File Upload */}
                                <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-gray-300 mb-3 group-hover:text-emerald-900 transition-colors" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-emerald-900">
                                            Click to Upload
                                        </p>
                                        <p className="text-[8px] font-black text-gray-300 mt-2 uppercase">MAX 5MB_WEBP_JPG</p>
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

                        <div className="col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Settings
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.isAvailable ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-emerald-900'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="hidden"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest">In Stock</span>
                                </label>

                                <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.isSeasonal ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-orange-600'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isSeasonal}
                                        onChange={(e) => handleSeasonalChange(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Seasonal Item</span>
                                </label>
                            </div>
                        </div>

                        {formData.isSeasonal && (
                            <div className="col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Available Months
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {monthNames.map((month, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => toggleMonth(index + 1)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.availableMonths.includes(index + 1)
                                                ? 'bg-orange-50 text-orange-600 border-orange-100 border'
                                                : 'bg-gray-50 text-gray-400 border-transparent border hover:bg-gray-100'
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
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200"
                        >
                            {uploading ? 'Uploading...' : loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
