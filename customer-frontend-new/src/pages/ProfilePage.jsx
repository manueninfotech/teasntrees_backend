
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    User, Mail, MapPin, Package, Settings, Camera, Loader2,
    Edit2, LogOut, ChevronRight, Star, AlertCircle, Plus,
    Trash2, Save, X, RotateCcw, Truck, FileText, Calendar, ArrowRight, Phone, Smartphone, Bell, Percent, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useBrand } from '../context/BrandContext';
import AddressModal from '../components/AddressModal';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user, isAuthenticated, logout, verifyOtp, googleLogin, completeProfile } = useAuth();
    const { setIsCartOpen, addToCart } = useCart();
    const { brand, theme } = useBrand();

    // Auth State
    const [loginStep, setLoginStep] = useState('mobile'); // mobile, otp, details
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [userDetails, setUserDetails] = useState({ name: '', email: '', address: '' });
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Initializations
    useEffect(() => {
        if (isAuthenticated) return;

        // The RecaptchaVerifier will be initialized when needed (in handleSendOtp)
        // This is better than initializing it early because:
        // 1. The DOM element might not be ready yet
        // 2. We can handle errors more gracefully
        // 3. We can reinitialize if needed

        // Cleanup on unmount
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (err) {
                    console.warn('Error clearing RecaptchaVerifier:', err);
                }
                window.recaptchaVerifier = null;
            }
        };
    }, [isAuthenticated, auth]);

    // Dashboard Data State
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState(user); // Initial from auth, then refreshed
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: ''
    });
    const [savingAddress, setSavingAddress] = useState(false);

    // Profile Edit State
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [capturedLocation, setCapturedLocation] = useState(null);

    // --- AUTH LOGIC ---
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        try {
            // Validate phone number
            if (!mobile || mobile.length !== 10) {
                setAuthError('Please enter a valid 10-digit mobile number');
                setAuthLoading(false);
                return;
            }

            // Initialize RecaptchaVerifier if not already done
            if (!window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-otp-button', {
                        'size': 'invisible',
                        'callback': () => console.log('reCAPTCHA verified')
                    });
                } catch (err) {
                    console.error('Failed to initialize reCAPTCHA:', err);
                    setAuthError('reCAPTCHA initialization failed. Please refresh and try again.');
                    setAuthLoading(false);
                    return;
                }
            }

            const phoneNumber = `+91${mobile}`;
            const appVerifier = window.recaptchaVerifier;

            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            setLoginStep('otp');
            toast.success('OTP sent successfully!');
        } catch (err) {
            console.error('Firebase Auth Error:', err);

            // Clear the verifier on error so it can be re-initialized
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }

            // User-friendly error messages
            if (err.code === 'auth/too-many-requests') {
                setAuthError('Too many requests. Please try again later.');
            } else if (err.code === 'auth/invalid-phone-number') {
                setAuthError('Invalid phone number. Please check and try again.');
            } else {
                setAuthError(err.message || 'Failed to send OTP. Please try again.');
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            if (!otp || otp.length !== 6) {
                setAuthError('Please enter a valid 6-digit OTP');
                setAuthLoading(false);
                return;
            }

            // 1. Verify OTP with Firebase
            const result = await confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();

            // 2. Exchange for backend JWT
            const responseResult = await verifyOtp(mobile, idToken);
            if (responseResult.success) {
                // Logged in!
                toast.success("Welcome back!");
            } else {
                // Profile Incomplete
                setLoginStep('details');
            }
        } catch (err) {
            console.error('Verification Error:', err);

            if (err.code === 'auth/invalid-verification-code') {
                setAuthError('Invalid or expired OTP. Please try again.');
            } else if (err.code === 'auth/code-expired') {
                setAuthError('OTP expired. Please request a new one.');
            } else {
                setAuthError(err.message || 'Failed to verify OTP. Please try again.');
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            const result = await completeProfile({
                mobile,
                ...userDetails,
                location: capturedLocation
            });

            if (result.success) {
                toast.success('Profile completed successfully!');
                // The user will be automatically redirected by the app since they're now authenticated
            }
        } catch (err) {
            setAuthError(err);
            toast.error(err);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            // Configure Google auth provider to request phone number and profile scope
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            provider.addScope('phone'); // Request phone number if available
            provider.setCustomParameters({
                'prompt': 'consent' // Force consent screen to appear
            });

            const result = await signInWithPopup(auth, provider);

            if (!result.user || !result.user.email) {
                throw new Error('Failed to retrieve user information');
            }

            const idToken = await result.user.getIdToken();

            // Get user info from Google (phone may not be available)
            const googleUser = {
                email: result.user.email,
                displayName: result.user.displayName || '',
                photoURL: result.user.photoURL || null,
                phoneNumber: result.user.phoneNumber || null // May be null
            };

            // Send to backend for authentication
            const responseResult = await googleLogin(idToken, googleUser);

            // Check if phone is required FIRST (even if success is true)
            if (responseResult.requiresPhone) {
                // Phone number is REQUIRED - show phone-details step
                setLoginStep('phone-details');
                setUserDetails({
                    name: googleUser.displayName || '',
                    email: googleUser.email,
                    address: ''
                });
                setAuthError(''); // Clear any previous errors
                toast.info('Phone number is required to complete registration');
            } else if (responseResult.success) {
                // Logged in successfully!
                toast.success("Welcome back!");
            } else {
                // Complete profile needed
                setLoginStep('details');
                setUserDetails({
                    name: googleUser.displayName || '',
                    email: googleUser.email,
                    address: ''
                });
                toast.info('Please complete your profile');
            }
        } catch (err) {
            console.error('Google Auth Error:', err);

            // Handle specific Firebase errors
            if (err.code === 'auth/popup-closed-by-user') {
                setAuthError('Sign-in cancelled. Please try again.');
            } else if (err.code === 'auth/popup-blocked') {
                setAuthError('Pop-up was blocked. Please enable pop-ups and try again.');
            } else if (err.code === 'auth/network-request-failed') {
                setAuthError('Network error. Please check your connection and try again.');
            } else {
                setAuthError(err.message || 'Failed to sign in with Google');
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleDetectLocation = async (e, target = 'details') => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationObj = {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                };

                try {
                    const response = await userService.reverseGeocode(latitude, longitude);
                    if (response.success && response.data) {
                        const addr = response.data;
                        if (target === 'details') {
                            setUserDetails(prev => ({ ...prev, address: addr.formattedAddress || '' }));
                            setCapturedLocation(locationObj);
                        } else if (target === 'addressModal') {
                            const details = addr.details || {};
                            setNewAddress(prev => ({
                                ...prev,
                                flatNo: details.house_number || details.name || '',
                                street: details.road || '',
                                area: details.suburb || details.sublocality || details.neighbourhood || details.village || '',
                                city: details.city || details.town || details.municipality || '',
                                pincode: details.postcode || '',
                                location: locationObj
                            }));
                        }
                        toast.success("Location detected!");
                    } else {
                        toast.error("Failed to fetch address details");
                    }
                } catch (err) {
                    console.error("Reverse geocode error:", err);
                    toast.error("Failed to convert coordinates to address");
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error(error.message || "Failed to get current location");
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // --- DASHBOARD LOGIC ---
    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated, activeTab, brand, user]);

    const loadDashboardData = async () => {
        setLoadingData(true);
        try {
            if (activeTab === 'orders') {
                const data = await userService.getOrders({ limit: 100 });
                setOrders(data || []);
            } else if (activeTab === 'addresses') {
                const data = await userService.getAddresses();
                setAddresses(data || []);
            } else if (activeTab === 'profile') {
                // Optionally refresh profile
                const data = await userService.getProfile();
                setProfileData(data);
            } else if (activeTab === 'settings') {
                // Settings tab needs profile data with notificationPreferences
                const data = await userService.getProfile();
                setProfileData(data);
            } else if (activeTab === 'reviews') {
                const data = await reviewService.getMyReviews();
                setReviews(data?.reviews || []);
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoadingData(false);
        }
    };

    // Keep activeTab in a ref for socket listener to access current value without re-binding
    const activeTabRef = React.useRef(activeTab);
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    // Socket Listener for Real-time Updates (Orders)
    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (data) => {

            // Refresh orders if on orders tab
            if (activeTabRef.current === 'orders') {
                userService.getOrders({ _t: Date.now(), limit: 100 })
                    .then(data => {
                        setOrders(data || []);
                    })
                    .catch(e => console.error("Socket refresh failed", e));
            }
        };

        socket.on('order:status-updated', handleOrderUpdate);
        socket.on('order:created', handleOrderUpdate);
        socket.on('delivery:status-updated', handleOrderUpdate);

        return () => {
            socket.off('order:status-updated', handleOrderUpdate);
            socket.off('order:created', handleOrderUpdate);
            socket.off('delivery:status-updated', handleOrderUpdate);
        };
    }, [socket]);

    const [editingAddressId, setEditingAddressId] = useState(null);

    const handleAddAddressClick = () => {
        setEditingAddressId(null);
        setNewAddress({ tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: '' });
        setShowAddressModal(true);
    };

    const handleEditAddress = (addr) => {
        setEditingAddressId(addr._id);

        if (addr.flatNo || addr.street || addr.area) {
            // If structured data exists from backend (newly saved addresses)
            setNewAddress({
                tag: addr.label || 'Home',
                flatNo: addr.flatNo || '',
                street: addr.street || '',
                area: addr.area || '',
                city: addr.city || '',
                pincode: addr.pincode || '',
                isDefault: addr.isDefault || false
            });
        } else {
            // Fallback: Try to parse addressLine for old addresses
            // Expected Format: "FlatNo, Street, Area, City - Pincode"
            const parts = addr.addressLine ? addr.addressLine.split(', ') : [];
            let parsed = {
                tag: addr.label || 'Home',
                flatNo: '',
                street: '',
                area: '',
                city: '',
                pincode: '',
                isDefault: addr.isDefault || false
            };

            if (parts.length >= 1) parsed.flatNo = parts[0];
            if (parts.length >= 2) parsed.street = parts[1];
            if (parts.length >= 3) {
                // Check if the last part has " - "
                const lastPart = parts[parts.length - 1];
                const secondLast = parts[parts.length - 2];

                if (lastPart.includes(' - ')) {
                    const [c, p] = lastPart.split(' - ');
                    parsed.city = c;
                    parsed.pincode = p;
                    // If there were 3 parts: Flat, Street, City-Pin => Area is missing?
                    // If there were 4 parts: Flat, Street, Area, City-Pin
                    if (parts.length === 3) {
                        // Maybe Flat, Street, City-Pin
                        parsed.area = '';
                    } else if (parts.length >= 4) {
                        parsed.area = secondLast;
                    }
                } else {
                    // Just try best effort
                    parsed.area = parts[2];
                }
            }

            setNewAddress(parsed);
        }

        setShowAddressModal(true);
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            await userService.setDefaultAddress(id);
            const data = await userService.getAddresses();
            setAddresses(data || []);
        } catch (err) {
            console.error("Failed to set default address", err);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await userService.deleteAddress(id);
            const data = await userService.getAddresses();
            setAddresses(data || []);
        } catch (err) {
            console.error("Failed to delete address", err);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        try {
            const payload = {
                label: newAddress.tag,
                addressLine: `${newAddress.flatNo}, ${newAddress.street}, ${newAddress.area}, ${newAddress.city} - ${newAddress.pincode} `,
                flatNo: newAddress.flatNo,
                street: newAddress.street,
                area: newAddress.area,
                city: newAddress.city,
                pincode: newAddress.pincode,
                location: newAddress.location || { type: 'Point', coordinates: [0, 0] },
                isDefault: newAddress.isDefault || addresses.length === 0
            };

            if (editingAddressId) {
                await userService.updateAddress(editingAddressId, payload);
            } else {
                await userService.addAddress(payload);
            }

            setShowAddressModal(false);
            setEditingAddressId(null);
            setNewAddress({ tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: '' });

            const data = await userService.getAddresses();
            setAddresses(data || []);
        } catch (err) {
            console.error("Failed to save address", err);
        } finally {
            setSavingAddress(false);
        }
    };

    const toggleNotification = async (type) => {
        // Optimistic update
        const currentPrefs = profileData.notificationPreferences || {};
        const newPrefs = { ...currentPrefs, [type]: !currentPrefs[type] };

        setProfileData(prev => ({
            ...prev,
            notificationPreferences: newPrefs
        }));

        try {
            await userService.updateProfile({ notificationPreferences: { [type]: newPrefs[type] } });
        } catch (err) {
            console.error("Failed to update settings", err);
            // Revert on failure
            setProfileData(prev => ({
                ...prev,
                notificationPreferences: currentPrefs
            }));
        }
    };

    // --- PROFILE EDIT LOGIC ---
    useEffect(() => {
        if (profileData) {
            setEditForm({
                name: profileData.name || '',
                email: profileData.email || '',
                mobile: profileData.mobile || '' // mobile usually read-only but keeping in form
            });
        }
    }, [profileData]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Upload to backend (which uploads to Cloudinary)
            const result = await userService.uploadImage(formData);

            if (result.url) {
                // Now save the profile with this new image URL
                const updatedUser = await userService.updateProfile({ profileImage: result.url });
                setProfileData(updatedUser);
            }
        } catch (err) {
            console.error("Failed to upload image", err);
            alert("Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const updatedUser = await userService.updateProfile({
                name: editForm.name,
                email: editForm.email
            });
            setProfileData(updatedUser);
            setProfileData(updatedUser);
            setShowEditProfileModal(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Failed to update profile");
        }
    };

    const handleReorder = async (orderId) => {
        const toastId = toast.loading("Adding items to cart...");
        try {
            // Fetch full order to get product details (price, etc which might not be in dashboard list)
            const fullOrder = await orderService.getOrderById(orderId);

            if (!fullOrder || !fullOrder.items) {
                throw new Error("Order details not found");
            }

            fullOrder.items.forEach(item => {
                if (item.product) {
                    const product = item.product;
                    const sizeOption = item.customization ? { size: item.customization, price: item.price } : null;

                    // Add the quantity specified in the order
                    for (let i = 0; i < item.quantity; i++) {
                        addToCart(product, sizeOption);
                    }
                }
            });

            toast.success("Items added to cart!", { id: toastId });
            setIsCartOpen(true);
        } catch (error) {
            console.error("Reorder failed", error);
            toast.error("Failed to reorder items", { id: toastId });
        }
    };

    const handleDownloadInvoice = async (orderId, orderNumber) => {
        const toastId = toast.loading("Downloading invoice...");
        try {
            const blob = await orderService.downloadInvoice(orderId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice - ${orderNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Invoice downloaded!", { id: toastId });
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download invoice", { id: toastId });
        }
    };

    // --- REVIEW LOGIC ---
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [activeReviewOrderId, setActiveReviewOrderId] = useState(null);
    const [reviewForm, setReviewForm] = useState({ foodRating: 5, riderRating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleOpenReview = (orderId) => {
        setActiveReviewOrderId(orderId);
        setReviewForm({ foodRating: 5, riderRating: 5, comment: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const payload = {
                orderId: activeReviewOrderId,
                foodRating: reviewForm.foodRating,
                riderRating: reviewForm.riderRating,
                review: reviewForm.comment
            };

            await reviewService.createReview(payload);
            toast.success("Thank you for your feedback!");
            setShowReviewModal(false);
            setActiveReviewOrderId(null);

            // Refresh reviews list if on reviews tab
            if (activeTab === 'reviews') {
                loadDashboardData();
            }
        } catch (error) {
            console.error("Review failed", error);
            const msg = error.response?.data?.message || "Failed to submit review";
            toast.error(msg);
        } finally {
            setSubmittingReview(false);
        }
    };

    // --- RENDER LOGIN VIEW ---
    if (!isAuthenticated) {
        return (
            <div className={`min-h-screen pt-24 pb-20 flex items-center justify-center p-4 ${theme.isLittleH ? 'bg-bakery-bg' : 'bg-slate-50'}`}>
                <div className={`rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative border ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                    {/* Header */}
                    <div className={`h-32 ${theme.isLittleH ? 'bg-gradient-to-br from-[#565A47] to-[#8B8E7B]' : 'bg-gradient-to-br from-cafe-emerald to-cafe-teal'} flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80')] opacity-10 bg-cover bg-center" />
                        <div className="text-white text-center z-10">
                            <h2 className={cn("text-2xl font-bold", theme.isLittleH && "font-playfair")}>Welcome Back</h2>
                            <p className="text-white/80 text-sm">Sign in to continue</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Mobile */}
                            {loginStep === 'mobile' && (
                                <motion.form
                                    key="mobile"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleSendOtp}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={mobile}
                                                onChange={e => setMobile(e.target.value)}
                                                placeholder="9876543210"
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/50' : 'bg-slate-50 focus:ring-cafe-emerald/50'} font-medium`}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        id="send-otp-button"
                                        type="submit"
                                        className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233] shadow-[#565A47]/30' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2`}
                                    >
                                        {authLoading ? 'Sending...' : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                        <span className="text-xs text-slate-400 font-medium">OR</span>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>

                                    {/* Google Sign In */}
                                    <button
                                        type="button"
                                        disabled={authLoading}
                                        onClick={handleGoogleSignIn}
                                        className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                </motion.form>
                            )}

                            {/* Step 2: OTP */}
                            {loginStep === 'otp' && (
                                <motion.form
                                    key="otp"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerifyOtp}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-6">
                                        <div className={`w-16 h-16 ${theme.isLittleH ? 'bg-[#FDF5EC] text-[#565A47]' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 text-sm">Enter the OTP sent to <span className="font-bold text-slate-800">{mobile}</span></p>
                                    </div>

                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            placeholder="XXXXXX"
                                            className={`w-full text-center text-2xl tracking-widest py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/50' : 'bg-slate-50 focus:ring-cafe-emerald/50'} font-bold`}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        type="submit"
                                        className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233] shadow-[#565A47]/30' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white rounded-xl font-bold shadow-lg transition-all`}
                                    >
                                        {authLoading ? 'Verifying...' : 'Verify & Login'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginStep('mobile')}
                                        className="w-full text-sm text-slate-400 hover:text-slate-600"
                                    >
                                        Change Mobile Number
                                    </button>
                                </motion.form>
                            )}

                            {/* Step 3: Details */}
                            {loginStep === 'details' && (
                                <motion.form
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleCompleteProfile}
                                    className="space-y-4"
                                >
                                    <h3 className={cn("text-xl font-bold text-center text-slate-800 mb-4", theme.isLittleH && "font-playfair")}>Complete Profile</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                        <input
                                            type="text"
                                            value={userDetails.name}
                                            onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border-none ${theme.isLittleH ? 'bg-white shadow-inner' : 'bg-slate-50'}`}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            value={userDetails.email}
                                            onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border-none ${theme.isLittleH ? 'bg-white shadow-inner' : 'bg-slate-50'}`}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDetectLocation(e, 'details')}
                                                disabled={detectingLocation}
                                                className={`text-[10px] font-bold ${theme.isLittleH ? 'text-[#565A47] hover:text-[#3f4233]' : 'text-cafe-emerald hover:text-cafe-teal'} uppercase flex items-center gap-1 transition-colors disabled:opacity-50`}
                                            >
                                                {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                                                Detect My Location
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={userDetails.address}
                                            onChange={e => setUserDetails({ ...userDetails, address: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border-none ${theme.isLittleH ? 'bg-white shadow-inner' : 'bg-slate-50'}`}
                                            placeholder="Enter your full address"
                                            required
                                        />
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        type="submit"
                                        className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233] shadow-[#565A47]/30' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white rounded-xl font-bold shadow-lg mt-4 transition-all`}
                                    >
                                        {authLoading ? 'Creating Account...' : 'Complete & Login'}
                                    </button>
                                </motion.form>
                            )}

                            {/* Phone Details for Google Users */}
                            {loginStep === 'phone-details' && (
                                <motion.form
                                    key="phone-details"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleCompleteProfile}
                                    className="space-y-6"
                                >
                                    {/* Header with required icon */}
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                            <Phone className="w-8 h-8" />
                                        </div>
                                        <h3 className={cn("text-xl font-bold text-slate-800", theme.isLittleH && "font-playfair")}>One More Step!</h3>
                                        <p className="text-sm text-slate-500 mt-2">We need your phone number to complete your account</p>
                                    </div>

                                    {/* Name - read only from Google */}
                                    <div className={`space-y-2 p-4 rounded-xl ${theme.isLittleH ? 'bg-[#FDF5EC]' : 'bg-slate-50'}`}>
                                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                            <span className="text-slate-400">👤</span> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={userDetails.name}
                                            disabled
                                            className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none cursor-not-allowed text-slate-600"
                                        />
                                    </div>

                                    {/* Email - read only from Google */}
                                    <div className={`space-y-2 p-4 rounded-xl ${theme.isLittleH ? 'bg-[#FDF5EC]' : 'bg-slate-50'}`}>
                                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                            <span className="text-slate-400">📧</span> Email
                                        </label>
                                        <input
                                            type="email"
                                            value={userDetails.email}
                                            disabled
                                            className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none cursor-not-allowed text-slate-600"
                                        />
                                    </div>

                                    {/* Phone Number - REQUIRED */}
                                    <div className={`space-y-2 border-2 ${theme.isLittleH ? 'border-[#565A47]/50 bg-[#FDF5EC]' : 'border-cafe-emerald/50 bg-emerald-50'} p-4 rounded-xl`}>
                                        <label className={`text-xs font-bold ${theme.isLittleH ? 'text-[#565A47]' : 'text-cafe-emerald'} uppercase flex items-center gap-2`}>
                                            <Phone className="w-4 h-4" />
                                            Mobile Number <span className="text-red-500">*</span> <span className="text-[10px] font-normal text-red-600 ml-auto">REQUIRED</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-600 font-bold">+91</span>
                                            <input
                                                type="tel"
                                                value={mobile}
                                                onChange={e => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setMobile(value);
                                                }}
                                                placeholder="Enter 10-digit number"
                                                className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border-2 transition-colors ${theme.isLittleH ? 'border-[#565A47]/30 focus:border-[#565A47] focus:ring-[#565A47]/20' : 'border-cafe-emerald/30 focus:border-cafe-emerald focus:ring-cafe-emerald/20'} focus:ring-2 font-medium text-base`}
                                                maxLength="10"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500">Enter your 10-digit phone number without country code</p>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> Address
                                            </label>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDetectLocation(e, 'phone-details')}
                                                disabled={detectingLocation}
                                                className={`text-[10px] font-bold ${theme.isLittleH ? 'text-[#565A47] hover:text-[#3f4233]' : 'text-cafe-emerald hover:text-cafe-teal'} uppercase flex items-center gap-1 transition-colors disabled:opacity-50`}
                                            >
                                                {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                                                Detect
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={userDetails.address}
                                            onChange={e => setUserDetails({ ...userDetails, address: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-white shadow-inner focus:ring-[#565A47]/50' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                            placeholder="Enter your full address"
                                            required
                                        />
                                    </div>

                                    <button
                                        disabled={authLoading || !mobile || mobile.length !== 10}
                                        type="submit"
                                        className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233] shadow-[#565A47]/30' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4`}
                                    >
                                        {authLoading ? 'Creating Account...' : 'Complete & Login'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoginStep('mobile');
                                            setMobile('');
                                        }}
                                        className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {authError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {authError}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER DASHBOARD (AUTHENTICATED) ---
    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'reviews', label: 'My Reviews', icon: Star },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className={`min-h-screen pt-24 pb-20 ${theme.isLittleH ? 'bg-bakery-bg' : 'bg-slate-50'}`}>
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header Card */}
                <div className={`rounded-3xl p-8 mb-8 shadow-sm border flex flex-col md:flex-row items-center gap-6 relative overflow-visible ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${theme.isLittleH ? 'from-[#565A47]/10' : 'from-cafe-emerald/10'} to-transparent rounded-bl-full pointer-events-none`} />

                    <div className="relative group cursor-pointer">
                        <input
                            type="file"
                            id="profile-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                        />
                        <label htmlFor="profile-upload" className="block relative">
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden relative">
                                {profileData?.profileImage ? (
                                    <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-slate-300" />
                                )}

                                {/* Overlay */}
                                <div className={cn(
                                    "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity",
                                    uploadingImage ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-white" />
                                    )}
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="text-center md:text-left flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-slate-800">{profileData?.name || 'User'}</h1>
                        <p className="text-slate-500">{profileData?.email}</p>
                        <p className="text-slate-400 text-sm mt-1">{profileData?.mobile}</p>
                    </div>

                    <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                        <button
                            onClick={() => setShowEditProfileModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Tabs */}
                    <div className="lg:w-72 flex-shrink-0">
                        <div className={`rounded-2xl shadow-sm border overflow-hidden sticky top-24 ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn("inline-flex w-full items-center gap-2 px-6 py-4 border-l-4 transition-all duration-300", isActive ? (theme.isLittleH ? "bg-bakery-light border-bakery-primary text-bakery-primary font-semibold shadow-sm" : "bg-cafe-emerald/5 border-cafe-emerald text-cafe-emerald font-semibold") : "border-transparent text-slate-500 hover:bg-slate-50")}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? (theme.isLittleH ? "text-[#565A47]" : "text-cafe-emerald") : "text-slate-400")} />
                                        {tab.label}
                                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {loadingData ? (
                                    <div className="bg-white rounded-3xl p-12 text-center text-slate-400">Loading...</div>
                                ) : (
                                    <>
                                        {activeTab === 'profile' && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h1 className={cn("text-3xl font-black text-slate-800", theme.isLittleH && "font-playfair")}>My Profile</h1>
                                                </div>
                                                <div className={`rounded-3xl p-8 shadow-sm border ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                                                    <h2 className="text-xl font-bold text-slate-800 mb-6">Personal Information</h2>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-slate-600">Full Name</label>
                                                            <div className={`w-full px-4 py-3 rounded-xl border font-medium ${theme.isLittleH ? 'bg-white border-bakery-accent/30 text-bakery-primary' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>{profileData?.name}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-slate-600">Email Address</label>
                                                            <div className={`w-full px-4 py-3 rounded-xl border font-medium ${theme.isLittleH ? 'bg-[#FDF5EC] border-[#8B8E7B]/20 text-[#565A47]' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>{profileData?.email}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                                                            <div className={`w-full px-4 py-3 rounded-xl border font-medium ${theme.isLittleH ? 'bg-[#FDF5EC] border-[#8B8E7B]/20 text-[#565A47]' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>{profileData?.mobile}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'orders' && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h1 className={cn("text-3xl font-black text-slate-800", theme.isLittleH && "font-playfair")}>Order History</h1>
                                                </div>
                                                {orders.length === 0 ? (
                                                    <div className="text-center py-20">
                                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${theme.isLittleH ? 'bg-[#FDF5EC]' : 'bg-slate-50'}`}>
                                                            <Package className="w-10 h-10 text-slate-300" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-slate-800 mb-2">No orders yet</h3>
                                                        <p className="text-slate-500 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start exploring our menu!</p>
                                                    </div>
                                                ) : orders.map(order => (
                                                    <div key={order._id} className={`rounded-3xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 group ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/20 hover:border-bakery-primary/50' : 'bg-white border-slate-100 hover:border-emerald-100'}`}>

                                                        {/* Header */}
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                                                    <Package className="w-7 h-7" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <span className="font-bold text-lg text-slate-900">
                                                                            #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                                                                        </span>
                                                                        <span className={cn(
                                                                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                                            order.status === 'delivered' ? (theme.isLittleH ? "bg-[#FDF5EC] text-[#565A47] border-[#8B8E7B]/20" : "bg-emerald-50 text-emerald-700 border-emerald-100") :
                                                                                order.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                                                                                    ['waiting_for_rider', 'pending'].includes(order.status) ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                                        "bg-blue-50 text-blue-700 border-blue-100"
                                                                        )}>
                                                                            {order.status?.replace(/_/g, ' ')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                                        <Calendar className="w-3.5 h-3.5" />
                                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 w-full md:w-auto">
                                                                {order.status !== 'cancelled' && (
                                                                    <Link
                                                                        to={`/${brand}/track-order/${order._id}`}
                                                                        className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        Track Order <ArrowRight className="w-4 h-4" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Items Preview */}
                                                        <div className={`mb-6 rounded-2xl p-4 space-y-3 ${theme.isLittleH ? 'bg-[#FDF5EC]' : 'bg-slate-50'}`}>
                                                            {order.items?.slice(0, 3).map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
                                                                            {item.quantity}
                                                                        </span>
                                                                        <span className="text-slate-700 font-medium truncate max-w-[200px] md:max-w-xs">{item.name}</span>
                                                                    </div>
                                                                    <span className="text-slate-900 font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                            {order.items?.length > 3 && (
                                                                <div className="text-xs font-bold text-slate-400 pl-9 pt-1">
                                                                    + {order.items.length - 3} more items
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                                                            <div className="flex-1">
                                                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-2xl font-black text-slate-800">₹{order.total?.toFixed(2)}</p>
                                                                            {order.paymentStatus === 'paid' && (
                                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">Paid</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col justify-center border-l border-slate-100 pl-6">
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Summary</p>
                                                                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                                                                            <span>Sub: ₹{order.subtotal || (order.total - (order.deliveryCharge || 0) - (order.tax || 0) + (order.discount || 0))}</span>
                                                                            {order.discount > 0 && (
                                                                                <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded">Saved: ₹{order.discount}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                                <button
                                                                    onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                                                                    className="flex-1 md:flex-none py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText className="w-4 h-4" /> Invoice
                                                                </button>

                                                                <button
                                                                    onClick={() => handleReorder(order._id)}
                                                                    className={`flex-1 md:flex-none py-2.5 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${theme.isLittleH ? 'bg-[#FDF5EC] text-[#565A47] hover:bg-[#8B8E7B]/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                                >
                                                                    <RotateCcw className="w-4 h-4" /> Reorder
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Rating Nudge */}
                                                        {order.status === 'delivered' && (
                                                            <div className="mt-6 pt-4 border-t border-slate-50 md:flex md:justify-between md:items-center">
                                                                <p className="text-sm text-slate-500 mb-3 md:mb-0">How was your experience?</p>
                                                                <button
                                                                    onClick={() => handleOpenReview(order._id)}
                                                                    className="w-full md:w-auto py-2 px-6 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <Star className="w-4 h-4 fill-amber-700/20" /> Rate Order
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'addresses' && (
                                            <div className="space-y-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                                    <h1 className={cn("text-3xl font-black text-slate-800", theme.isLittleH && "font-playfair")}>Saved Addresses</h1>
                                                    <button
                                                        onClick={handleAddAddressClick}
                                                        className={cn("px-6 py-3 font-bold shadow-lg transition-all flex items-center justify-center gap-2", theme.isLittleH ? "bg-[#565A47] text-[#FAF1E8] hover:bg-[#3f4233]" : "bg-cafe-emerald text-white hover:bg-cafe-teal rounded-xl")}
                                                    >
                                                        <Plus className="w-5 h-5" /> Add Address
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {addresses.map(addr => (
                                                        <div key={addr._id} className={`rounded-2xl p-6 shadow-sm border-2 transition-all relative group ${theme.isLittleH ? 'bg-bakery-light border-transparent hover:border-[#565A47]' : 'bg-white border-transparent hover:border-cafe-emerald'}`}>
                                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!addr.isDefault && (
                                                                    <button
                                                                        onClick={() => handleSetDefaultAddress(addr._id)}
                                                                        className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-colors"
                                                                        title="Set as Default"
                                                                    >
                                                                        <Star className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleEditAddress(addr)}
                                                                    className={`p-2 bg-slate-100 text-slate-600 rounded-lg hover:text-white transition-colors ${theme.isLittleH ? 'hover:bg-[#565A47]' : 'hover:bg-cafe-emerald'}`}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAddress(addr._id)}
                                                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                                {addr.label || addr.tag || 'Home'}
                                                                {addr.isDefault && (
                                                                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${theme.isLittleH ? 'bg-[#FDF5EC] text-[#565A47]' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                        <Star className="w-3 h-3 fill-current" /> Default
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                                                {addr.addressLine}
                                                            </p>
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={handleAddAddressClick}
                                                        className={`border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 transition-all group min-h-[160px] ${theme.isLittleH ? 'hover:border-[#565A47] hover:text-[#565A47] hover:bg-[#565A47]/5' : 'hover:border-cafe-emerald hover:text-cafe-emerald hover:bg-cafe-emerald/5'}`}
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                                                            <Plus className="w-6 h-6" />
                                                        </div>
                                                        <span className="font-bold text-sm">Add New Address</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'reviews' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h1 className={cn("text-3xl font-black text-slate-800", theme.isLittleH && "font-playfair")}>My Reviews</h1>
                                                </div>
                                                {!Array.isArray(reviews) || reviews.length === 0 ? (
                                                    <div className="text-center py-12 text-slate-400">No reviews found.</div>
                                                ) : reviews.map(review => {
                                                    // Debug log
                                                    const displayName = review.productId
                                                        ? review.productId.name
                                                        : (review.type === 'site' || !review.orderId) ? "General Cafe Experience" : `Order #${review.orderId?.orderNumber || (typeof review.orderId === 'string' ? review.orderId : 'Unknown')}`;

                                                    return (
                                                        <div key={review._id} className={`rounded-2xl p-6 shadow-sm border ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <h3 className="font-bold text-slate-800 text-lg">
                                                                        {displayName}
                                                                    </h3>

                                                                    <div className="flex flex-col gap-1 mt-2">
                                                                        {/* Food Rating */}
                                                                        {review.foodRating && (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-slate-500 uppercase w-16">{(review.type === 'site' || !review.orderId) ? 'Cafe' : 'Food'}</span>
                                                                                <div className="flex items-center gap-0.5">
                                                                                    {[...Array(5)].map((_, i) => (
                                                                                        <Star
                                                                                            key={`food-${i}`}
                                                                                            className={cn(
                                                                                                "w-3.5 h-3.5",
                                                                                                i < review.foodRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                                                            )}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Rider Rating */}
                                                                        {review.riderRating && (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-slate-500 uppercase w-16">Delivery</span>
                                                                                <div className="flex items-center gap-0.5">
                                                                                    {[...Array(5)].map((_, i) => (
                                                                                        <Star
                                                                                            key={`rider-${i}`}
                                                                                            className={cn(
                                                                                                "w-3.5 h-3.5",
                                                                                                i < review.riderRating ? (theme.isLittleH ? "fill-[#565A47] text-[#565A47]" : "fill-emerald-400 text-emerald-400") : "text-slate-200"
                                                                                            )}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Fallback for legacy generic rating */}
                                                                        {!review.foodRating && !review.riderRating && review.rating && (
                                                                            <div className="flex items-center gap-1">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                    <Star
                                                                                        key={i}
                                                                                        className={cn(
                                                                                            "w-4 h-4",
                                                                                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                                                        )}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {review.review && (
                                                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm italic">
                                                                    "{review.review}"
                                                                </p>
                                                            )}
                                                            {/* Fallback for comment field name change if any */}
                                                            {review.comment && !review.review && (
                                                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm italic">
                                                                    "{review.comment}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {showEditProfileModal && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className={cn("w-full max-w-md overflow-hidden shadow-2xl", theme.isLittleH ? "bg-white" : "bg-white rounded-3xl")}
                                                    >
                                                        <div className={cn("p-6 border-b flex items-center justify-between", theme.isLittleH ? "bg-[#FAF1E8] border-[#8B8E7B]/15" : "bg-slate-50 border-slate-100")}>
                                                            <h3 className={cn("text-xl font-bold text-slate-800", theme.isLittleH && "font-playfair text-[#565A47]")}>Edit Profile</h3>
                                                            <button onClick={() => setShowEditProfileModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                                <X className="w-5 h-5 text-slate-400" />
                                                            </button>
                                                        </div>

                                                        <div className="p-6 space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                                                <div className="relative">
                                                                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.name}
                                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'} font-medium`}
                                                                        placeholder="Your Name"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                                    <input
                                                                        type="email"
                                                                        value={editForm.email}
                                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'} font-medium`}
                                                                        placeholder="your.email@example.com"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                                                                <div className="relative opacity-60">
                                                                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.mobile}
                                                                        readOnly
                                                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 border-none font-medium cursor-not-allowed"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={handleSaveProfile}
                                                                className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233]' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white ${theme.isLittleH ? '' : 'rounded-xl'} font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4`}
                                                            >
                                                                <Save className="w-4 h-4" /> Save Changes
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        {/* Address Modal */}
                                        <AddressModal
                                             isOpen={showAddressModal}
                                             onClose={() => { setShowAddressModal(false); setEditingAddressId(null); }}
                                             initialView="map"
                                             initialData={editingAddressId ? addresses.find(a => a._id === editingAddressId) : null}
                                             onSaveSuccess={async () => {
                                                 const data = await userService.getAddresses();
                                                 setAddresses(data || []);
                                                 setShowAddressModal(false);
                                                 setEditingAddressId(null);
                                             }}
                                         />



                        {activeTab === 'settings' && (
                            <div className={`rounded-3xl p-8 shadow-sm border ${theme.isLittleH ? 'bg-bakery-light border-bakery-accent/30' : 'bg-white border-slate-100'}`}>
                                <h2 className={cn("text-xl font-bold text-slate-800 mb-6", theme.isLittleH && "font-playfair")}>Preferences</h2>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Email Notifications</h3>
                                                <p className="text-xs text-slate-500">Receive order updates via email</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleNotification('email')}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors",
                                                profileData?.notificationPreferences?.email ? (theme.isLittleH ? "bg-[#565A47]" : "bg-cafe-emerald") : "bg-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                profileData?.notificationPreferences?.email ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">SMS Notifications</h3>
                                                <p className="text-xs text-slate-500">Receive delivery updates via SMS</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleNotification('sms')}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors",
                                                profileData?.notificationPreferences?.sms ? (theme.isLittleH ? "bg-[#565A47]" : "bg-cafe-emerald") : "bg-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                profileData?.notificationPreferences?.sms ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Push Notifications</h3>
                                                <p className="text-xs text-slate-500">Receive app alerts & delivery updates</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleNotification('push')}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors",
                                                profileData?.notificationPreferences?.push ? (theme.isLittleH ? "bg-[#565A47]" : "bg-cafe-emerald") : "bg-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                profileData?.notificationPreferences?.push ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                                <Percent className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Offers & Promotions</h3>
                                                <p className="text-xs text-slate-500">Get notified about sales & coupons</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleNotification('offers')}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors",
                                                profileData?.notificationPreferences?.offers ? (theme.isLittleH ? "bg-[#565A47]" : "bg-cafe-emerald") : "bg-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                profileData?.notificationPreferences?.offers ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                                )}
                </motion.div>
            </AnimatePresence>
        </div>
                </div >
            </div >

    {/* Review Modal */ }
    < AnimatePresence >
    { showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn("w-full max-w-lg overflow-hidden shadow-2xl", theme.isLittleH ? "bg-white" : "bg-white rounded-3xl")}
            >
                <div className={cn("p-6 border-b flex items-center justify-between", theme.isLittleH ? "bg-[#FDF5EC] border-[#8B8E7B]/20" : "bg-slate-50 border-slate-100")}>
                    <h3 className="text-xl font-bold text-slate-800">Rate your experience</h3>
                    <button
                        onClick={() => setShowReviewModal(false)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                    {/* Food Rating */}
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-slate-500 text-sm font-bold">Food Quality</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={`food-${star}`}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, foodRating: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            star <= reviewForm.foodRating
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-slate-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rider Rating */}
                    <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6">
                        <p className="text-slate-500 text-sm font-bold">Delivery Experience</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={`rider-${star}`}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, riderRating: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            star <= reviewForm.riderRating
                                                ? (theme.isLittleH ? "fill-[#565A47] text-[#565A47]" : "fill-emerald-400 text-emerald-400")
                                                : "text-slate-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-bold text-slate-700">Comments (Optional)</label>
                        <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="Tell us what you liked..."
                            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 ${theme.isLittleH ? 'focus:ring-[#565A47]/50' : 'focus:ring-cafe-emerald/50'} min-h-[100px] resize-none`}
                        />
                    </div>

                    <button
                        disabled={submittingReview}
                        type="submit"
                        className={`w-full py-3.5 ${theme.isLittleH ? 'bg-[#565A47] hover:bg-[#3f4233] shadow-[#565A47]/30' : 'bg-cafe-emerald hover:bg-cafe-teal shadow-cafe-emerald/30'} text-white rounded-xl font-bold shadow-lg transition-all`}
                    >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </motion.div>
        </div>
    )}
            </AnimatePresence >
        </div >
    );
};

export default ProfilePage;
