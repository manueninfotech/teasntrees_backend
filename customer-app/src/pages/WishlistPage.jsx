// Wishlist Page
// Display and manage user's wishlist

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import wishlistService from '../services/wishlistService';
import ProductModal from '../components/ProductModal';
import './WishlistPage.css';

const WishlistPage = () => {
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        fetchWishlist();
    }, [isAuthenticated, navigate]);

    const fetchWishlist = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await wishlistService.getWishlist();

            if (response.success && response.data) {
                setWishlist(response.data.items || response.data || []);
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            setError('Failed to load wishlist');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await wishlistService.removeFromWishlist(productId);
            setWishlist(prev => prev.filter(item => item._id !== productId));
        } catch (err) {
            console.error('Error removing from wishlist:', err);
            alert('Failed to remove item. Please try again.');
        }
    };

    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleAddToCart = (product) => {
        // If product has size options, open modal for selection
        if (product.sizeOptions && product.sizeOptions.length > 0) {
            setSelectedProduct(product);
            return;
        }

        // Direct add for products without sizes
        try {
            addToCart({
                id: product._id,
                name: product.name,
                price: product.price || product.displayPrice, // Fallback
                image: product.image
            }, 1);

            // Optionally remove from wishlist? 
            // kept persistent for now as user might want to buy again later
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert('Failed to add to cart. Please try again.');
        }
    };

    const getDisplayPrice = (product) => {
        if (product.sizeOptions && product.sizeOptions.length > 0) {
            const lowestPrice = Math.min(...product.sizeOptions.map(opt => opt.price));
            return { price: lowestPrice, isFromPrice: true };
        }
        // Use virtual displayPrice if regular price is missing
        return { price: product.price || product.displayPrice || 0, isFromPrice: false };
    };

    if (isLoading) {
        return (
            <div className="wishlist-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your wishlist...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="container">
                <div className="wishlist-header">
                    <h1>My Wishlist</h1>
                    <p>Your favorite items</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {wishlist.length === 0 ? (
                    <div className="empty-state">
                        <p>Your wishlist is empty</p>
                        <button className="btn btn-primary" onClick={() => navigate('/menu')}>
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((product) => {
                            const { price, isFromPrice } = getDisplayPrice(product);
                            return (
                                <div key={product._id} className="wishlist-card">
                                    <div className="wishlist-image">
                                        <img
                                            src={product.image || '/placeholder-product.jpg'}
                                            alt={product.name}
                                        />
                                    </div>

                                    <div className="wishlist-content">
                                        <h3>{product.name}</h3>
                                        <p className="wishlist-description">{product.description}</p>
                                        <div className="wishlist-footer">
                                            <div className="wishlist-price-container">
                                                {isFromPrice && <span className="from-text">From </span>}
                                                <span className="wishlist-price">₹{price?.toFixed(2)}</span>
                                            </div>
                                            <div className="wishlist-actions">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    {product.sizeOptions && product.sizeOptions.length > 0 ? 'Select Size' : 'Add to Cart'}
                                                </button>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleRemoveFromWishlist(product._id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Product Modal for Size Selection */}
            {selectedProduct && (
                <ProductModal
                    item={{
                        ...selectedProduct,
                        id: selectedProduct._id // Ensure ID structure matches MenuCard
                    }}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
};

export default WishlistPage;
