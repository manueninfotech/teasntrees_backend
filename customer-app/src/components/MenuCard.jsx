// TeasNTrees MenuCard Component
// Reusable card for displaying menu items with wishlist functionality

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import wishlistService from '../services/wishlistService';
import './MenuCard.css';

const MenuCard = ({ item, onViewDetails }) => {
    const { addToCart, isInCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    // Check if item is in wishlist on mount
    useEffect(() => {
        if (isAuthenticated && item.isInWishlist !== undefined) {
            setIsInWishlist(item.isInWishlist);
        }
    }, [isAuthenticated, item.isInWishlist]);

    const handleAddToCart = (e) => {
        e.stopPropagation();

        // If product has size options, open details modal instead
        if (item.sizeOptions && item.sizeOptions.length > 0) {
            onViewDetails(item);
            return;
        }

        addToCart(item, 1);
    };

    // Get display price
    const getDisplayPrice = () => {
        if (item.sizeOptions && item.sizeOptions.length > 0) {
            const lowestPrice = Math.min(...item.sizeOptions.map(opt => opt.price));
            return { price: lowestPrice, isFromPrice: true };
        }
        return { price: item.price || item.displayPrice || 0, isFromPrice: false };
    };

    const { price, isFromPrice } = getDisplayPrice();

    const handleWishlistToggle = async (e) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Please login to add items to wishlist');
            return;
        }

        setIsWishlistLoading(true);

        try {
            if (isInWishlist) {
                await wishlistService.removeFromWishlist(item.id);
                setIsInWishlist(false);
            } else {
                await wishlistService.addToWishlist(item.id);
                setIsInWishlist(true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert('Failed to update wishlist. Please try again.');
        } finally {
            setIsWishlistLoading(false);
        }
    };

    // Placeholder image based on item name
    const getPlaceholderImage = () => {
        return `https://via.placeholder.com/300x200/3a6b1f/ffffff?text=${encodeURIComponent(item.name)}`;
    };

    return (
        <div className="menu-card" onClick={() => onViewDetails(item)}>
            <div className="menu-card-image">
                <img
                    src={item.image || getPlaceholderImage()}
                    alt={item.name}
                    loading="lazy"
                />
                <div className="menu-card-category">
                    <span className="badge badge-primary">{item.category}</span>
                </div>

                {/* Wishlist Heart Icon */}
                <button
                    className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={isInWishlist ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>

            <div className="menu-card-content">
                <h3 className="menu-card-title">{item.name}</h3>
                <p className="menu-card-description">
                    {item.description?.substring(0, 80)}...
                </p>

                <div className="menu-card-footer">
                    <div className="menu-card-price">
                        {isFromPrice && <span className="from-text">From </span>}
                        <span className="currency">₹</span>
                        <span className="amount">{price}</span>
                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddToCart}
                    >
                        {item.sizeOptions && item.sizeOptions.length > 0
                            ? 'Select Size'
                            : (isInCart(item.id) ? '+ Add More' : '+ Add to Cart')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuCard;
