import { useState, useEffect, useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../utils/api';

const isCakeCategoryName = (name = '') => {
    const normalized = String(name).trim().toLowerCase();
    const compact = normalized.replace(/[\s_-]/g, '');
    if (compact.includes('pancake')) return false;
    return /\b(cake|cakes|cheesecake|cheesecakes)\b/.test(normalized);
};

export default function ProductModal({ isOpen, onClose, product, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        cakePricing: {
            basePricePerKg: '',
            customizationAvailable: false,
            customizationPricePerKg: '',
            egglessAvailable: true,
            egglessExtraCharge: 100
        },
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
        if (!isOpen) return;
        fetchCategories();

        if (product) {
            const categoryId = typeof product.category === 'string' ? product.category : product.category?._id || '';
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price ?? '',
                cakePricing: {
                    basePricePerKg: product.cakePricing?.basePricePerKg ?? '',
                    customizationAvailable: product.cakePricing?.customizationAvailable ?? (product.cakePricing?.customizationPricePerKg !== undefined && product.cakePricing?.customizationPricePerKg !== null),
                    customizationPricePerKg: product.cakePricing?.customizationPricePerKg ?? '',
                    egglessAvailable: product.cakePricing?.egglessAvailable ?? true,
                    egglessExtraCharge: product.cakePricing?.egglessExtraCharge ?? 100
                },
                category: categoryId,
                image: product.image || '',
                isAvailable: product.isAvailable ?? true,
                isSeasonal: product.isSeasonal ?? false,
                availableMonths: product.availableMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                tags: product.tags?.join(', ') || ''
            });
            if (product.image) setImagePreview(product.image);
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                cakePricing: {
                    basePricePerKg: '',
                    customizationAvailable: false,
                    customizationPricePerKg: '',
                    egglessAvailable: true,
                    egglessExtraCharge: 100
                },
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
    }, [isOpen, product]);

    const selectedCategory = useMemo(
        () => categories.find(cat => cat._id === formData.category),
        [categories, formData.category]
    );
    const routeBrand = window.location.pathname.split('/')[1]?.toLowerCase();
    const isLittlehCakeCategory = routeBrand === 'littleh' && isCakeCategoryName(selectedCategory?.name || '');

    const handleSeasonalChange = (checked) => {
        setFormData({
            ...formData,
            isSeasonal: checked,
            availableMonths: checked ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        });
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories?limit=100');
            const categoriesData = response.data.data || [];
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setCategories([]);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
        if (!imageFile) return formData.image;
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);

        try {
            const response = await api.post('/admin/upload/image?folder=products', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data.url;
        } catch (err) {
            console.error('Failed to upload image:', err);
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
            let imageUrl = formData.image;
            if (imageFile) imageUrl = await uploadImage();

            const payload = {
                ...formData,
                image: imageUrl,
                price: isLittlehCakeCategory
                    ? null
                    : (formData.price === '' ? null : Number(formData.price)),
                cakePricing: isLittlehCakeCategory
                    ? {
                        basePricePerKg: Number(formData.cakePricing.basePricePerKg),
                        customizationAvailable: Boolean(formData.cakePricing.customizationAvailable),
                        customizationPricePerKg: formData.cakePricing.customizationAvailable
                            ? (formData.cakePricing.customizationPricePerKg === '' ? null : Number(formData.cakePricing.customizationPricePerKg))
                            : null,
                        egglessAvailable: Boolean(formData.cakePricing.egglessAvailable),
                        egglessExtraCharge: Number(formData.cakePricing.egglessExtraCharge || 100)
                    }
                    : undefined,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            };

            if (product) {
                await api.put(`/admin/products/${product._id}`, payload);
            } else {
                await api.post('/admin/products', payload);
            }

            setImageFile(null);
            setImagePreview('');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 100);
        } catch (err) {
            console.error('Error saving product:', err.response?.data || err.message);
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const errorMessages = err.response.data.errors.map(errorItem => errorItem.message || errorItem).join(', ');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to save product');
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
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-8 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">ERROR: {error}</div>}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all" placeholder="E.G. CLASSIC LATTE" required />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description *</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all min-h-[100px] resize-none" placeholder="PRODUCT COMPOSITION AND TASTE NOTES..." required />
                        </div>

                        {!isLittlehCakeCategory && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (INR) *</label>
                                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all" required />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category *</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all appearance-none" required>
                                <option value="">SELECT GROUP</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {isLittlehCakeCategory && (
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Price / Kg *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cakePricing.basePricePerKg}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, basePricePerKg: e.target.value } }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.cakePricing.customizationAvailable ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600 hover:text-emerald-900'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.cakePricing.customizationAvailable}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                cakePricing: {
                                                    ...prev.cakePricing,
                                                    customizationAvailable: e.target.checked,
                                                    customizationPricePerKg: e.target.checked ? prev.cakePricing.customizationPricePerKg : ''
                                                }
                                            }))}
                                            className="hidden"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Customization Available</span>
                                    </label>
                                </div>
                                {formData.cakePricing.customizationAvailable && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customization Price / Kg *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.cakePricing.customizationPricePerKg}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, customizationPricePerKg: e.target.value } }))}
                                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Eggless Extra Charge</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cakePricing.egglessExtraCharge}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, egglessExtraCharge: e.target.value } }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black tracking-widest focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer bg-gray-50 border-gray-100 text-gray-600 hover:text-emerald-900">
                                        <input
                                            type="checkbox"
                                            checked={formData.cakePricing.egglessAvailable}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, egglessAvailable: e.target.checked } }))}
                                            className="hidden"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Eggless Available</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Tags</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['new-intro', 'must-try', 'best-seller', 'egg-contains'].map((tag) => {
                                    const isSelected = formData.tags.split(',').map(t => t.trim()).filter(Boolean).includes(tag);
                                    return (
                                        <label key={tag} className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                                                    const newTags = e.target.checked ? [...currentTags, tag] : currentTags.filter(t => t !== tag);
                                                    setFormData({ ...formData, tags: newTags.join(', ') });
                                                }}
                                                className="hidden"
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tag.replace('-', ' ')}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Image</label>
                            <div className="space-y-4">
                                {(imagePreview || formData.image) && (
                                    <div className="relative w-full h-56 bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 group">
                                        <img src={imagePreview || formData.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setFormData({ ...formData, image: '' }); }} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-xl">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-gray-300 mb-3 group-hover:text-emerald-900 transition-colors" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-emerald-900">Click to Upload</p>
                                        <p className="text-[8px] font-black text-gray-300 mt-2 uppercase">MAX 5MB_WEBP_JPG</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Settings</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.isAvailable ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-emerald-900'}`}>
                                    <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="hidden" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">In Stock</span>
                                </label>

                                <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.isSeasonal ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-orange-600'}`}>
                                    <input type="checkbox" checked={formData.isSeasonal} onChange={(e) => handleSeasonalChange(e.target.checked)} className="hidden" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Seasonal Item</span>
                                </label>
                            </div>
                        </div>

                        {formData.isSeasonal && (
                            <div className="col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Available Months</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => toggleMonth(index + 1)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.availableMonths.includes(index + 1) ? 'bg-orange-50 text-orange-600 border-orange-100 border' : 'bg-gray-50 text-gray-400 border-transparent border hover:bg-gray-100'}`}
                                        >
                                            {month}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent">Cancel</button>
                        <button type="submit" disabled={loading || uploading} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200">
                            {uploading ? 'Uploading...' : loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
