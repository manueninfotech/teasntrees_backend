import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

export default function CategoryModal({ isOpen, onClose, category, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '',
        displayOrder: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (category) {
                // Edit mode
                setFormData({
                    name: category.name || '',
                    description: category.description || '',
                    icon: category.icon || '',
                    displayOrder: category.displayOrder || ''
                });
            } else {
                // Add mode
                setFormData({
                    name: '',
                    description: '',
                    icon: '',
                    displayOrder: ''
                });
            }
            setError('');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                displayOrder: parseInt(formData.displayOrder) || 0
            };

            if (category) {
                // Update existing category
                await api.put(`/admin/categories/${category._id}`, payload);
            } else {
                // Create new category
                await api.post('/admin/categories', payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving category:', error.response?.data || error.message);
            setError(error.response?.data?.message || error.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {category ? 'Edit Category' : 'Add New Category'}
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

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Tea, Coffee, Snacks"
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the category"
                            className="input resize-none"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Icon (Emoji or Icon Code)
                        </label>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="e.g., ☕, 🍵, or icon-coffee"
                            className="input"
                        />
                        {formData.icon && (
                            <p className="text-sm text-gray-600 mt-2">
                                Preview: <span className="text-2xl">{formData.icon}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Display Order
                        </label>
                        <input
                            type="number"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                            placeholder="e.g., 1, 2, 3"
                            className="input"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
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
                            disabled={loading}
                            className="flex-1 btn-primary py-3 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (category ? 'Update Category' : 'Add Category')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
