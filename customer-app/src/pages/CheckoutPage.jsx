// TeasNTrees Checkout Page
// Customer information and order placement

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressModal from '../components/AddressModal';
import settingsService from '../services/settingsService';
import addressService from '../services/addressService';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart, checkout } = useCart();

    const { isAuthenticated } = useAuth();

    // Dynamic settings state
    const [configDeliveryFee, setConfigDeliveryFee] = useState(30); // Default fallback

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        orderType: 'delivery',
        paymentMethod: 'COD', // Default to COD
        address: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.getSettings();
                if (response.success && response.data) {
                    setConfigDeliveryFee(response.data.deliveryCharge || 30);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const subtotal = getCartTotal();
    const tax = subtotal * 0.05;
    const deliveryFee = formData.orderType === 'delivery' ? configDeliveryFee : 0;
    const total = subtotal + tax + deliveryFee;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (formData.orderType === 'delivery' && !formData.address.trim()) {
            newErrors.address = 'Delivery address is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
        setFormData(prev => ({
            ...prev,
            address: address.addressLine
        }));
        if (errors.address) {
            setErrors(prev => ({ ...prev, address: '' }));
        }
    };

    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [currentCoords, setCurrentCoords] = useState(null);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCoords([longitude, latitude]);

                try {
                    // Reverse geocode to get address text
                    const response = await addressService.reverseGeocode(latitude, longitude);
                    if (response.success && response.data) {
                        setFormData(prev => ({
                            ...prev,
                            address: response.data.formattedAddress
                        }));
                        // Clear error if any
                        if (errors.address) {
                            setErrors(prev => ({ ...prev, address: '' }));
                        }
                    }
                } catch (error) {
                    console.error('Failed to reverse geocode:', error);
                    // Don't alert user, just let them enter manual address, but we have coords
                } finally {
                    setIsFetchingLocation(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                setIsFetchingLocation(false);
                alert('Unable to retrieve your location. Please ensure location services are enabled.');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            // Prepare checkout data
            const checkoutPayload = {
                deliveryInstructions: `Order for ${formData.name} (${formData.phone})`,
                paymentMethod: formData.paymentMethod,
                orderType: formData.orderType
            };

            // Priority:
            // 1. Manually captured GPS coords (exact)
            // 2. Saved Address GPS coords
            // 3. String address (fallback to geocoding)
            if (currentCoords) {
                checkoutPayload.deliveryAddress = {
                    address: formData.address,
                    location: { type: 'Point', coordinates: currentCoords }
                };
            } else if (selectedAddress && selectedAddress.addressLine === formData.address) {
                checkoutPayload.deliveryAddress = {
                    address: selectedAddress.addressLine,
                    location: selectedAddress.location
                };
            } else {
                checkoutPayload.deliveryAddress = formData.address;
            }

            // Place actual order through API
            await checkout(checkoutPayload);

            setIsSubmitting(false);
            setOrderPlaced(true);
        } catch (error) {
            console.error('Checkout error:', error);
            setIsSubmitting(false);
            setErrors({
                submit: error.message || 'Failed to place order. Please try again.'
            });
        }
    };

    if (cartItems.length === 0 && !orderPlaced) {
        navigate('/cart');
        return null;
    }

    if (orderPlaced) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="order-success">
                        <div className="success-icon">✓</div>
                        <h2>Order Placed Successfully!</h2>
                        <p>Thank you for your order, {formData.name}!</p>
                        <p className="order-details">
                            Your order will be {formData.orderType === 'delivery' ? 'delivered' : 'ready for pickup'} soon.
                            We'll contact you at {formData.phone} for confirmation.
                        </p>
                        <div className="success-actions">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate('/menu')}
                            >
                                Continue Shopping
                            </button>
                            <button
                                className="btn btn-outline btn-lg"
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 className="checkout-title">Checkout</h1>

                <div className="checkout-content">
                    {/* Checkout Form */}
                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <h2 className="form-section-title">Customer Information</h2>

                        <div className="form-group">
                            <label className="form-label" htmlFor="name">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Payment Method Selection */}
                        <h2 className="form-section-title">Payment Method</h2>

                        <div className="payment-options">
                            <label className={`payment-option ${formData.paymentMethod === 'COD' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={formData.paymentMethod === 'COD'}
                                    onChange={handleChange}
                                />
                                <div className="option-content">
                                    <span className="option-icon">💵</span>
                                    <span className="option-label">Cash on Delivery</span>
                                </div>
                            </label>

                            <label className={`payment-option ${formData.paymentMethod === 'Online' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="Online"
                                    checked={formData.paymentMethod === 'Online'}
                                    onChange={handleChange}
                                    disabled={true} // Temporarily disabled until online payment is integrated
                                />
                                <div className="option-content">
                                    <span className="option-icon">💳</span>
                                    <span className="option-label">Online Payment (Coming Soon)</span>
                                </div>
                            </label>
                        </div>

                        {/* Delivery Address - Always shown as orderType is 'delivery' */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="address">
                                Delivery Address *
                            </label>

                            {isAuthenticated && (
                                <div className="address-actions-row" style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setIsAddressModalOpen(true)}
                                    >
                                        Saved Address
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${currentCoords ? 'btn-success' : 'btn-outline'}`}
                                        onClick={handleUseCurrentLocation}
                                        disabled={isFetchingLocation}
                                    >
                                        {isFetchingLocation ? '📍 Fetching...' : currentCoords ? '✅ Location Locked' : '📍 Use My Location'}
                                    </button>
                                </div>
                            )}

                            <textarea
                                id="address"
                                name="address"
                                className={`form-textarea ${errors.address ? 'error' : ''}`}
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter your complete delivery address"
                                rows="3"
                            />
                            {errors.address && <span className="error-message">{errors.address}</span>}
                        </div>

                        {errors.submit && (
                            <div className="error-message submit-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                                ❌ {errors.submit}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </form>

                    {/* Order Summary */}
                    <div className="checkout-summary">
                        <h2 className="summary-title">Order Summary</h2>

                        <div className="summary-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="summary-item">
                                    <span className="item-name">
                                        {item.name} × {item.quantity}
                                    </span>
                                    <span className="item-price">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Tax (5%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Address Modal */}
                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onAddressSelect={handleAddressSelect}
                    selectedAddressId={selectedAddress?._id}
                />
            </div>
        </div>
    );
};

export default CheckoutPage;
