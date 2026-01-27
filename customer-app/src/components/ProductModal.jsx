// TeasNTrees ProductModal Component
// Modal for viewing product details and adding to cart

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import './ProductModal.css';

const ProductModal = ({ item, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(
        item?.sizeOptions && item.sizeOptions.length > 0 ? item.sizeOptions[0] : null
    );
    const { addToCart } = useCart();

    if (!item) return null;

    // Check if product has size options
    const hasSizeOptions = item.sizeOptions && item.sizeOptions.length > 0;

    const handleAddToCart = () => {
        if (hasSizeOptions && !selectedSize) {
            alert('Please select a size');
            return;
        }

        // Pass the resolved price for the optimistic update
        const resolvedItem = {
            ...item,
            price: currentPrice
        };

        addToCart(resolvedItem, quantity, selectedSize?.size);
        onClose();
    };

    const incrementQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const getPlaceholderImage = () => {
        return `https://via.placeholder.com/600x400/3a6b1f/ffffff?text=${encodeURIComponent(item.name)}`;
    };

    const currentPrice = selectedSize?.price || item.price || 0;
    const totalPrice = currentPrice * quantity;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="product-modal scale-in">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <div className="modal-content">
                    {/* Image Section */}
                    <div className="modal-image">
                        <img src={item.image || getPlaceholderImage()} alt={item.name} />
                        <div className="modal-category">
                            <span className="badge badge-primary">{item.category}</span>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="modal-details">
                        <h2 className="modal-title">{item.name}</h2>
                        <p className="modal-description">{item.description}</p>

                        {/* Size Selection (if applicable) */}
                        {hasSizeOptions && (
                            <div className="size-section">
                                <label className="size-label">Select Size:</label>
                                <div className="size-options">
                                    {item.sizeOptions.map((option, index) => (
                                        <button
                                            key={index}
                                            className={`size-option ${selectedSize?.size === option.size ? 'active' : ''}`}
                                            onClick={() => setSelectedSize(option)}
                                        >
                                            <span className="size-name">{option.size}</span>
                                            <span className="size-price">₹{option.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info Grid (Price & Quantity) */}
                        <div className="modal-info-grid">
                            {/* Price Display */}
                            <div className="modal-price">
                                <span className="price-label">Price:</span>
                                <span className="price-value">
                                    <span className="currency">₹</span>
                                    <span className="amount">{currentPrice}</span>
                                </span>
                            </div>

                            {/* Quantity Selector */}
                            <div className="quantity-section">
                                <label className="quantity-label">Quantity:</label>
                                <div className="quantity-controls">
                                    <button
                                        className="quantity-btn"
                                        onClick={decrementQuantity}
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span className="quantity-value">{quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={incrementQuantity}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Total Price */}
                        <div className="modal-total">
                            <span className="total-label">Subtotal:</span>
                            <span className="total-value">
                                <span className="currency">₹</span>
                                <span className="amount">{totalPrice.toFixed(2)}</span>
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="modal-actions">
                            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                            <button className="btn btn-outline btn-lg" onClick={onClose}>
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
