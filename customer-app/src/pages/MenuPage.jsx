// TeasNTrees Menu Page
// Browse menu items with category filtering from backend API

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import MenuCard from '../components/MenuCard';
import ProductModal from '../components/ProductModal';
import './MenuPage.css';

const MenuPage = () => {
    const { categoryId } = useParams();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle initial category from URL
    useEffect(() => {
        if (categoryId) {
            fetchCategoryDetails(categoryId);
        }
    }, [categoryId]);

    // Fetch products when category changes
    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.category-dropdown')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategories();

            if (response.success && response.data) {
                // Add "All" category at the beginning
                const categoryNames = response.data.map(cat => cat.name);
                setCategories(['All', ...categoryNames]);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Use default categories as fallback
            setCategories(['All', 'Tea', 'Coffee', 'Snacks', 'Desserts']);
        }
    };

    const fetchCategoryDetails = async (id) => {
        try {
            setIsLoading(true);
            const response = await categoryService.getCategoryById(id);
            if (response.success && response.data) {
                // Ensure categories are loaded before setting selected
                // This might need better coordination, but for now:
                setSelectedCategory(response.data.name);
            }
        } catch (err) {
            console.error('Error fetching category details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let response;

            if (selectedCategory === 'All') {
                // Fetch all products
                response = await productService.getAllProducts();
            } else {
                // Find category ID by name
                const categoryResponse = await categoryService.getAllCategories();
                const category = categoryResponse.data.find(cat => cat.name === selectedCategory);

                if (category) {
                    response = await productService.getProductsByCategory(category._id);
                } else {
                    response = await productService.getAllProducts();
                }
            }

            if (response.success) {
                // Map backend products to frontend format
                const mappedProducts = response.data.products.map(product => ({
                    id: product._id,
                    name: product.name,
                    category: product.category?.name || 'Uncategorized',
                    price: product.displayPrice,
                    hasSizes: product.sizeOptions && product.sizeOptions.length > 0,
                    sizeOptions: product.sizeOptions,
                    description: product.description,
                    image: product.image || 'https://via.placeholder.com/300x200?text=No+Image',
                    isAvailable: product.isAvailable
                }));


                setProducts(mappedProducts);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Failed to load products. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    return (
        <div className="menu-page">
            <div className="container">
                {/* Page Header */}
                <div className="menu-header">
                    <h1 className="menu-title">Our Menu</h1>
                    <p className="menu-subtitle">
                        Explore our carefully curated selection of teas, coffees, snacks, and desserts
                    </p>
                </div>

                {/* Category Filter Dropdown */}
                <div className="category-filter-container">
                    <div className={`category-dropdown ${isDropdownOpen ? 'open' : ''}`}>
                        <button
                            className="dropdown-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={isLoading}
                        >
                            <div className="trigger-content">
                                <span className="category-label">Category:</span>
                                <span className="selected-value">{selectedCategory}</span>
                            </div>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        className={`dropdown-item ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {category}
                                        {selectedCategory === category && <span className="check-mark">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading delicious items...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="error-state">
                        <p className="error-message">❌ {error}</p>
                        <button className="btn btn-primary" onClick={fetchProducts}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Menu Items Grid */}
                {!isLoading && !error && (
                    <div className="menu-grid">
                        {products.map(item => (
                            <MenuCard
                                key={item.id}
                                item={item}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && products.length === 0 && (
                    <div className="empty-state">
                        <p>No items found in this category.</p>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {selectedItem && (
                <ProductModal item={selectedItem} onClose={closeModal} />
            )}
        </div>
    );
};

export default MenuPage;
