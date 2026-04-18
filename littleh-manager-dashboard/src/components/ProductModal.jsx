import { useState, useEffect, useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../utils/api';

const isCakeCategoryName = (name = '') => {
    const normalized = String(name).trim().toLowerCase();
    if (normalized.includes('pancake')) return false;
    return /(cake|cakes|cheesecake|bento)/i.test(normalized);
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
        isAvailable: true
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
                isAvailable: product.isAvailable ?? true
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
                isAvailable: true
            });
            setImagePreview('');
            setImageFile(null);
        }
        setError('');
    }, [isOpen, product]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/manager/categories');
            const categoriesData = response.data.data || [];
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
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
            const response = await api.post('/manager/upload/image?folder=products', uploadFormData, {
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

    const selectedCategory = useMemo(
        () => categories.find(cat => cat._id === formData.category),
        [categories, formData.category]
    );

    const isCakeCategory = isCakeCategoryName(selectedCategory?.name || '');

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
                price: isCakeCategory
                    ? null
                    : (formData.price === '' ? null : Number(formData.price)),
                cakePricing: isCakeCategory
                    ? {
                        basePricePerKg: Number(formData.cakePricing.basePricePerKg),
                        customizationAvailable: Boolean(formData.cakePricing.customizationAvailable),
                        customizationPricePerKg: formData.cakePricing.customizationAvailable
                            ? (formData.cakePricing.customizationPricePerKg === '' ? null : Number(formData.cakePricing.customizationPricePerKg))
                            : null,
                        egglessAvailable: Boolean(formData.cakePricing.egglessAvailable),
                        egglessExtraCharge: Number(formData.cakePricing.egglessExtraCharge || 100)
                    }
                    : undefined
            };

            if (product) {
                await api.put(`/manager/products/${product._id}`, payload);
            } else {
                await api.post('/manager/products', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-bakery-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-8 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-black text-bakery-primary uppercase tracking-tight">
                        Update Product Status
                    </h2>
                    <button onClick={onClose} className="p-4 bg-bakery-light text-bakery-accent rounded-2xl hover:bg-bakery-primary hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">ERROR: {error}</div>}

                    <div className="grid grid-cols-2 gap-6">
                        {/* READ ONLY INFO */}
                        <div className="col-span-2 flex gap-6 p-6 bg-bakery-light/30 rounded-[2rem] border border-bakery-light">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shrink-0 border border-bakery-light">
                                <img src={formData.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest">Current Product</p>
                                <h3 className="text-xl font-black text-bakery-primary uppercase">{formData.name}</h3>
                                <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest opacity-60">
                                    Category: {categories.find(c => c._id === formData.category)?.name || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {isCakeCategory ? (
                            <div className="col-span-2 grid grid-cols-2 gap-4 bg-bakery-light/30 p-6 rounded-[2rem] border border-bakery-light">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Base Price / Kg *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cakePricing.basePricePerKg}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, basePricePerKg: e.target.value } }))}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.cakePricing.customizationAvailable ? 'bg-bakery-primary border-bakery-primary text-white shadow-lg shadow-bakery-primary/20' : 'bg-white border-gray-100 text-bakery-accent hover:text-bakery-primary'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.cakePricing.customizationAvailable}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                cakePricing: {
                                                    ...prev.cakePricing,
                                                    customizationAvailable: e.target.checked
                                                }
                                            }))}
                                            className="hidden"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Customization Price</span>
                                    </label>
                                </div>
                                {formData.cakePricing.customizationAvailable && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Custom Price / Kg *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.cakePricing.customizationPricePerKg}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, customizationPricePerKg: e.target.value } }))}
                                            className="input"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Eggless Charge</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cakePricing.egglessExtraCharge}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cakePricing: { ...prev.cakePricing, egglessExtraCharge: e.target.value } }))}
                                        className="input"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Price (INR) *</label>
                                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input" required />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.isAvailable ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-bakery-light border-bakery-light text-bakery-accent hover:text-bakery-primary'}`}>
                                <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="hidden" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{formData.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-5 bg-bakery-light text-bakery-accent rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all border border-transparent">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-5 bg-bakery-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all shadow-xl shadow-bakery-primary/20">
                            {loading ? 'Saving...' : 'Update Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
