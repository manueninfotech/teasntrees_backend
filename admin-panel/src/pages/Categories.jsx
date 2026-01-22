import { useEffect, useState } from 'react';
import api from '../utils/api';
import CategoryModal from '../components/CategoryModal';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    Folder,
    Eye
} from 'lucide-react';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCategories: 0,
        limit: 12
    });
    const [filters, setFilters] = useState({
        sortBy: 'displayOrder',
        order: 'asc'
    });

    useEffect(() => {
        fetchCategories();
    }, [pagination.currentPage, searchTerm, filters]);

    const fetchCategories = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                sortBy: filters.sortBy,
                order: filters.order
            });

            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/admin/categories?${params.toString()}`);
            const categoriesData = response.data.data || [];
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);

            // Update pagination info
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination.totalPages || 1,
                    totalCategories: response.data.pagination.totalItems || 0
                }));
            }
            setError(null);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setError('Failed to load categories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.delete(`/admin/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            setError(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const filteredCategories = categories.filter(category =>
        category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 mt-1">Organize your products into categories</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
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
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sort By Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort By
                        </label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="input"
                        >
                            <option value="displayOrder">Display Order</option>
                            <option value="name">Name</option>
                            <option value="createdAt">Created Date</option>
                        </select>
                    </div>

                    {/* Sort Order Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order
                        </label>
                        <select
                            value={filters.order}
                            onChange={(e) => setFilters({ ...filters, order: e.target.value })}
                            className="input"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                {(filters.sortBy !== 'displayOrder' || filters.order !== 'asc') && (
                    <button
                        onClick={() => setFilters({ sortBy: 'displayOrder', order: 'asc' })}
                        className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                    <div
                        key={category._id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                    >
                        {/* Category Icon Background */}
                        <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <span className="text-6xl">{category.icon || '📦'}</span>
                        </div>

                        {/* Category Info */}
                        <div className="p-4 flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">{category.name}</h3>
                                <p className="text-sm text-gray-600 line-clamp-3">{category.description || 'No description'}</p>

                                {/* Display Order Badge */}
                                <div className="mt-3 inline-block">
                                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        Order: {category.displayOrder || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => navigate(`/categories/${category._id}`)}
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingCategory(category);
                                        setShowModal(true);
                                    }}
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteCategory(category._id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No categories found</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                        Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                        {' • '}
                        <span className="font-medium">{pagination.totalCategories}</span> total categories
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

            {/* Category Modal */}
            <CategoryModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                }}
                category={editingCategory}
                onSuccess={fetchCategories}
            />
        </div>
    );
}
