import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Added missing motion import
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressModal from '../components/AddressModal';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import settingsService from '../services/settingsService';
import {
    ArrowLeft, MapPin, Loader2, CheckCircle2, AlertCircle, ShoppingBag,
    ChevronLeft, Plus, CreditCard, ArrowRight, X, Navigation, Save, CheckCircle
} from 'lucide-react';
import clsx from 'clsx';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { cartItems, cartTotal, clearCart, checkout } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(30);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');

    // Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: ''
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/profile');
            return;
        }

        const loadData = async () => {
            try {
                const [addrData, settingsData] = await Promise.all([
                    userService.getAddresses(),
                    settingsService.getSettings()
                ]);

                setAddresses(addrData || []);
                // Auto-select default
                const defaultAddr = addrData?.find(a => a.isDefault) || addrData?.[0];
                if (defaultAddr) setSelectedAddress(defaultAddr._id);

                if (settingsData?.data?.deliveryCharge) {
                    setDeliveryFee(settingsData.data.deliveryCharge);
                }
            } catch (err) {
                console.error("Failed to load checkout data", err);
            }
        };

        loadData();
    }, [isAuthenticated, navigate]);

    // Handle Place Order
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert("Please select a delivery address");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const selectedAddrObj = addresses.find(a => a._id === selectedAddress);

            // Context's `checkout` handles item mapping. We just send delivery info.
            // Backend expects deliveryAddress to be an object with structure:
            // { address: "String address", location: { type: "Point", coordinates: [lng, lat] } }
            const checkoutData = {
                deliveryAddress: {
                    address: selectedAddrObj.addressLine,
                    location: selectedAddrObj.location || { type: 'Point', coordinates: [0, 0] }
                },
                paymentMethod: paymentMethod,
                deliveryZone: 'Standard',
                deliveryInstructions: ''
            };

            const response = await checkout(checkoutData);

            if (response.success) {
                // Cart is cleared in Context
                const orderId = response.data?.orderId || response.data?.data?.orderId;
                navigate(`/order-success/${orderId}`);
            } else {
                const msg = response.message || 'Failed to place order';
                setError(msg);
                alert(`Order Failed: ${msg}`);
            }

        } catch (err) {
            console.error("Order error", err);
            const errorMsg = err.response?.data?.message || err.message || 'Something went wrong while placing order';
            setError(errorMsg);
            // Alert is handled by UI error message usually, but helpful
        } finally {
            setLoading(false);
        }
    };

    // Handle Use My Location
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setFetchingLocation(true);

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const res = await userService.reverseGeocode(latitude, longitude);

                if (res.success && res.data) {
                    const { details, formattedAddress } = res.data;
                    const parts = formattedAddress ? formattedAddress.split(',').map(p => p.trim()) : [];

                    // 1. Street: Prefer detailed road, else fallback to first part of formatted address
                    let street = details?.road || details?.street || details?.pedestrian || parts[0] || '';

                    // 2. Area: Prefer detailed suburb, else fallback to second part
                    let area = details?.suburb || details?.neighbourhood || details?.residential || details?.hamlet || '';
                    if (!area && parts.length > 1) {
                        // Avoid setting city as area
                        if (parts[1] !== details?.city && parts[1] !== details?.postcode) {
                            area = parts[1];
                        }
                    }

                    // 3. City
                    let city = details?.city || details?.town || details?.municipality || details?.state_district || '';
                    if (!city && parts.length > 2) city = parts[parts.length - 3]; // Rough guess

                    let pincode = details?.postcode || '';

                    // --- SMART CORRECTION (Hotfix for OSM data discrepancies) ---
                    const fullString = (formattedAddress || '').toLowerCase();
                    if (fullString.includes('guntur')) {
                        if (fullString.includes('ashok nagar') || fullString.includes('brodipet') || fullString.includes('lakshmipuram')) {
                            pincode = '522002';
                        }
                    }
                    // -----------------------------------------------------------

                    setNewAddress(prev => ({
                        ...prev,
                        flatNo: '', // GPS usually can't get this
                        street: street,
                        area: area,
                        city: city,
                        pincode: pincode,
                        location: { type: 'Point', coordinates: [longitude, latitude] } // Store GPS
                    }));

                    // Prompt user for Flat No as it is the only missing piece usually
                    setTimeout(() => {
                        const flatInput = document.getElementById('flatNo');
                        if (flatInput) flatInput.focus();
                        alert("📍 Location Fetched!\n\nPlease enter your Flat / House Number manually.");
                    }, 500);
                }
            } catch (err) {
                console.error("Reverse geocoding failed", err);
                alert("Could not fetch address details. Please fill manually.");
            } finally {
                setFetchingLocation(false);
            }
        }, (err) => {
            console.error("Geolocation error", err);
            let msg = "Unable to retrieve location.";
            if (err.code === 1) msg = "Location permission denied.";
            else if (err.code === 2) msg = "Location unavailable.";
            else if (err.code === 3) msg = "Location request timed out.";
            alert(msg);
            setFetchingLocation(false);
        }, options);
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        try {
            const payload = {
                label: newAddress.tag,
                addressLine: `${newAddress.flatNo}, ${newAddress.street}, ${newAddress.area}, ${newAddress.city} - ${newAddress.pincode}`,
                isDefault: addresses.length === 0,
                location: newAddress.location || { type: 'Point', coordinates: [0, 0] } // Include location in payload
            };
            await userService.addAddress(payload);
            const updatedAddrs = await userService.getAddresses();
            setAddresses(updatedAddrs || []);

            // Auto select new address
            if (updatedAddrs && updatedAddrs.length > 0) {
                const latest = updatedAddrs[updatedAddrs.length - 1];
                setSelectedAddress(latest._id);
            }

            setShowAddressModal(false);
            setNewAddress({ tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: '' });
        } catch (err) {
            console.error("Failed to save address", err);
        } finally {
            setSavingAddress(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
                    <p className="text-slate-500 mb-8">Add some delicious items to checkout.</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="px-8 py-3 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg hover:bg-cafe-teal transition-all"
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    // Calculate totals locally
    const tax = (cartTotal * 0.05);
    const calculatedGrandTotal = (cartTotal + tax + deliveryFee).toFixed(2);

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column */}
                    <div className="flex-1 space-y-6">

                        {/* Address Section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-cafe-emerald text-white flex items-center justify-center text-sm font-bold">1</span>
                                    Delivery Address
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map(addr => (
                                    <div
                                        key={addr._id}
                                        onClick={() => setSelectedAddress(addr._id)}
                                        className={`
                                            cursor-pointer rounded-2xl p-5 border-2 transition-all relative
                                            ${selectedAddress === addr._id ? 'border-cafe-emerald bg-cafe-emerald/5' : 'border-slate-100 hover:border-slate-200'}
                                        `}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-slate-800 mb-1">{addr.label || addr.tag || 'Address'}</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed mb-0">
                                                    {addr.addressLine}
                                                </p>
                                            </div>
                                            {selectedAddress === addr._id && (
                                                <CheckCircle className="w-6 h-6 text-cafe-emerald flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-cafe-emerald hover:text-cafe-emerald hover:bg-cafe-emerald/5 transition-all min-h-[120px]"
                                >
                                    <Plus className="w-6 h-6 mb-2" />
                                    <span className="font-bold text-sm">Add New Address</span>
                                </button>
                            </div>
                        </div>

                        {/* Payment Section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold">2</span>
                                Payment Method
                            </h2>

                            <div className="space-y-3">
                                <label className="flex items-center gap-4 p-4 rounded-xl border border-cafe-emerald bg-cafe-emerald/5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={() => setPaymentMethod('COD')}
                                        className="w-5 h-5 text-cafe-emerald focus:ring-cafe-emerald"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800">Cash on Delivery</div>
                                        <div className="text-xs text-slate-500">Pay lightly when you receive your order</div>
                                    </div>
                                    <CreditCard className="w-6 h-6 text-cafe-emerald" />
                                </label>

                                <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 opacity-60 cursor-not-allowed">
                                    <input type="radio" name="payment" disabled />
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800">Online Payment</div>
                                        <div className="text-xs text-slate-500">UPI, Cards, Netbanking (Coming Soon)</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:w-96 flex-shrink-0">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                    <p className="font-semibold mb-2">Order Failed</p>
                                    <p>{error}</p>
                                    {error.includes('Product not found') && (
                                        <button
                                            onClick={() => {
                                                clearCart();
                                                navigate('/menu');
                                            }}
                                            className="mt-3 w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            Clear Cart & Restart (Fix Stale Items)
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map((item, idx) => (
                                    <div key={item.key || item._id || idx} className="flex gap-3">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</div>
                                            <div className="text-xs text-slate-500 mb-1">{item.size || 'Regular'}</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs font-bold text-slate-400">x{item.quantity}</div>
                                                <div className="text-sm font-bold text-slate-800">₹{item.price * item.quantity}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-4" />

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Item Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Taxes (5%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-100 mt-2">
                                    <span>Grand Total</span>
                                    <span>₹{calculatedGrandTotal}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full py-4 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Placing Order...' : <>Place Order <ArrowRight className="w-5 h-5" /></>}
                            </button>

                            <p className="text-[10px] text-center text-slate-400 mt-4">
                                By placing an order, you agree to our Terms & Conditions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add Address Modal */}
                <AnimatePresence>
                    {showAddressModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-xl font-bold text-slate-800">Add New Address</h3>
                                    <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                                    <button
                                        type="button"
                                        onClick={handleUseMyLocation}
                                        disabled={fetchingLocation}
                                        className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2 mb-4"
                                    >
                                        {fetchingLocation ? 'Fetching Location...' : <>Use My Location <Navigation className="w-4 h-4" /></>}
                                    </button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Tag</label>
                                            <select
                                                value={newAddress.tag}
                                                onChange={e => setNewAddress({ ...newAddress, tag: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                            >
                                                <option>Home</option>
                                                <option>Work</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Pincode</label>
                                            <input
                                                type="text"
                                                value={newAddress.pincode}
                                                onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                                placeholder="560001"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Flat / House No</label>
                                        <input
                                            type="text"
                                            value={newAddress.flatNo}
                                            onChange={e => setNewAddress({ ...newAddress, flatNo: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                            placeholder="A-101, Tea Garden Apts"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Street / Colony</label>
                                        <input
                                            type="text"
                                            value={newAddress.street}
                                            onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                            placeholder="Green St, Indiranagar"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Area</label>
                                            <input
                                                type="text"
                                                value={newAddress.area}
                                                onChange={e => setNewAddress({ ...newAddress, area: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                                placeholder="Indiranagar"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                                            <input
                                                type="text"
                                                value={newAddress.city}
                                                onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50"
                                                placeholder="Bangalore"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingAddress}
                                        className="w-full py-4 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {savingAddress ? 'Saving...' : <>Save Address <Save className="w-5 h-5" /></>}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CheckoutPage;
