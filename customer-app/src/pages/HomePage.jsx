// TeasNTrees Home Page
// Landing page with hero section and featured products from backend

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import MenuCard from '../components/MenuCard';
import ProductModal from '../components/ProductModal';
import './HomePage.css';

const HomePage = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedItems = async () => {
            setIsLoading(true);
            try {
                const response = await productService.getAllProducts();
                if (response.success && response.data) {
                    // Get one item from each of these categories if they exist
                    const allProducts = response.data.products;
                    const categoriesToFeature = ['Tea', 'Coffee', 'Dessert', 'Desserts', 'Snacks'];
                    const featured = [];
                    const seenCategories = new Set();

                    for (const cat of categoriesToFeature) {
                        const item = allProducts.find(p => p.category?.name === cat && !seenCategories.has(cat));
                        if (item) {
                            featured.push({
                                id: item._id,
                                name: item.name,
                                category: item.category?.name || 'Uncategorized',
                                price: item.displayPrice,
                                hasSizes: item.sizeOptions && item.sizeOptions.length > 0,
                                sizeOptions: item.sizeOptions,
                                description: item.description,
                                image: item.image || 'https://via.placeholder.com/300x200?text=No+Image',
                                isAvailable: item.isAvailable
                            });
                            seenCategories.add(cat);
                        }
                        if (featured.length >= 3) break;
                    }

                    // Fallback to first 3 items if categories match failed
                    if (featured.length === 0 && allProducts.length > 0) {
                        setFeaturedItems(allProducts.slice(0, 3).map(p => ({
                            id: p._id,
                            name: p.name,
                            category: p.category?.name || 'Uncategorized',
                            price: p.displayPrice,
                            hasSizes: p.sizeOptions && p.sizeOptions.length > 0,
                            sizeOptions: p.sizeOptions,
                            description: p.description,
                            image: p.image || 'https://via.placeholder.com/300x200?text=No+Image',
                            isAvailable: p.isAvailable
                        })));
                    } else {
                        setFeaturedItems(featured);
                    }
                }
            } catch (err) {
                console.error('Error fetching featured items:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await categoryService.getAllCategories();
                if (response.success && response.data) {
                    // Limit to top 4 categories
                    setCategories(response.data.slice(0, 4));
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchFeaturedItems();
        fetchCategories();
    }, []);

    const handleViewDetails = (item) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <div className="hero-text fade-in">
                        <h1 className="hero-title">Fresh Tea, Natural Taste</h1>
                        <p className="hero-subtitle">
                            Experience the perfect blend of nature and flavor. Premium teas,
                            artisan coffees, and delicious treats in a cozy atmosphere.
                        </p>
                        <div className="hero-actions">
                            <Link to="/menu" className="btn btn-primary btn-lg">
                                View Menu
                            </Link>
                            <Link to="/menu" className="btn btn-outline btn-lg">
                                Order Now
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hero-decoration">
                    <span className="leaf-icon">🍃</span>
                    <span className="leaf-icon">🍃</span>
                    <span className="leaf-icon">🍃</span>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Shop by Category</h2>
                        <p className="section-subtitle">Find your favorites</p>
                    </div>
                    <div className="categories-grid">
                        {categories.map(cat => (
                            <Link to={`/menu/category/${cat._id}`} key={cat._id} className="category-card">
                                <div className="category-icon">
                                    {cat.name === 'Tea' ? '🍵' :
                                        cat.name === 'Coffee' ? '☕' :
                                            cat.name === 'Dessert' ? '🍰' : '🍴'}
                                </div>
                                <h3>{cat.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Items Section */}
            <section className="featured-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Featured Items</h2>
                        <p className="section-subtitle">
                            Discover our most popular selections
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="loading-state text-center">
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p className="mt-md">Loading featured items...</p>
                        </div>
                    ) : (
                        <div className="featured-grid">
                            {featuredItems.map(item => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    )}

                    <div className="section-footer">
                        <Link to="/menu" className="btn btn-secondary btn-lg">
                            Explore Full Menu
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Snippet Section */}
            <section className="about-snippet">
                <div className="container">
                    <div className="about-content">
                        <div className="about-image">
                            <div className="about-image-placeholder">
                                <span className="about-icon">☕</span>
                                <span className="about-icon">🍵</span>
                                <span className="about-icon">🌿</span>
                            </div>
                        </div>
                        <div className="about-text">
                            <h2>Welcome to TeasNTrees</h2>
                            <p>
                                At TeasNTrees, we believe in the power of nature and the joy of
                                simple pleasures. Our café is a sanctuary where you can escape
                                the hustle and bustle, surrounded by the calming presence of
                                greenery and the aroma of freshly brewed tea and coffee.
                            </p>
                            <p>
                                Every cup we serve is crafted with care, using premium ingredients
                                sourced from sustainable farms. Whether you're a tea enthusiast,
                                a coffee lover, or just looking for a cozy spot to relax, we have
                                something special for you.
                            </p>
                            <Link to="/about" className="btn btn-outline">
                                Learn More About Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Modal */}
            {selectedItem && (
                <ProductModal item={selectedItem} onClose={closeModal} />
            )}
        </div>
    );
};

export default HomePage;
