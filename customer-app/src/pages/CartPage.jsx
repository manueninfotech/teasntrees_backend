// TeasNTrees Cart Page
// Shopping cart with item management

import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

    const handleQuantityChange = (itemId, newQuantity) => {
        updateQuantity(itemId, newQuantity);
    };

    const handleRemove = (itemId) => {
        removeFromCart(itemId);
    };

    const subtotal = getCartTotal();
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    if (cartItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/menu" className="btn btn-primary btn-lg">
                            Browse Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1 className="cart-title">Shopping Cart</h1>

                <div className="cart-content">
                    {/* Cart Items */}
                    <div className="cart-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
                                    <img
                                        src={`https://via.placeholder.com/150x100/3a6b1f/ffffff?text=${encodeURIComponent(item.name)}`}
                                        alt={item.name}
                                    />
                                </div>

                                <div className="cart-item-details">
                                    <h3 className="cart-item-name">{item.name}</h3>
                                    <p className="cart-item-category">{item.category}</p>
                                    <p className="cart-item-price">₹{item.price}</p>
                                </div>

                                <div className="cart-item-quantity">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span className="quantity-value">{item.quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="cart-item-subtotal">
                                    ₹{item.price * item.quantity}
                                </div>

                                <button
                                    className="cart-item-remove"
                                    onClick={() => handleRemove(item.id)}
                                    aria-label="Remove item"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                        <h2 className="summary-title">Order Summary</h2>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Tax (5%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        <Link to="/checkout" className="btn btn-primary btn-lg checkout-btn">
                            Proceed to Checkout
                        </Link>

                        <Link to="/menu" className="btn btn-outline continue-shopping">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
