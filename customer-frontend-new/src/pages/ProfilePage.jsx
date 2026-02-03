
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    User, Mail, MapPin, Package, Settings, Camera, Loader2,
    Edit2, LogOut, ChevronRight, Star, AlertCircle, Plus,
    Trash2, Save, X, RotateCcw, Truck, FileText, Calendar, ArrowRight, Phone, Smartphone, Bell, Percent
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';


const ProfilePage = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user, isAuthenticated, logout, sendOtp, verifyOtp, completeProfile } = useAuth();
    const { setIsCartOpen, addToCart } = useCart();

    // Auth State
    const [loginStep, setLoginStep] = useState('mobile'); // mobile, otp, details
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [userDetails, setUserDetails] = useState({ name: '', email: '', address: '' });
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

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

    // --- AUTH LOGIC ---
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            await sendOtp(mobile);
            setLoginStep('otp');
        } catch (err) {
            setAuthError(err);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            const result = await verifyOtp(mobile, otp);
            if (result.success) {
                // Logged in!
            } else {
                // Profile Incomplete
                setLoginStep('details');
            }
        } catch (err) {
            setAuthError(err);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            await completeProfile({ mobile, ...userDetails });
        } catch (err) {
            setAuthError(err);
        } finally {
            setAuthLoading(false);
        }
    };

    // --- DASHBOARD LOGIC ---
    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated, activeTab, user]);

    const loadDashboardData = async () => {
        setLoadingData(true);
        try {
            if (activeTab === 'orders') {
                const data = await userService.getOrders();
                setOrders(data || []);
            } else if (activeTab === 'addresses') {
                const data = await userService.getAddresses();
                setAddresses(data || []);
            } else if (activeTab === 'profile') {
                // Optionally refresh profile
                const data = await userService.getProfile();
                console.log('[FRONTEND DEBUG] Profile data received:', data);
                console.log('[FRONTEND DEBUG] Notification prefs:', data?.notificationPreferences);
                setProfileData(data);
            } else if (activeTab === 'settings') {
                // Settings tab needs profile data with notificationPreferences
                const data = await userService.getProfile();
                console.log('[SETTINGS LOAD] Profile data received:', data);
                console.log('[SETTINGS LOAD] Notification prefs:', data?.notificationPreferences);
                setProfileData(data);
            } else if (activeTab === 'reviews') {
                const data = await reviewService.getMyReviews();
                setReviews(data || []);
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
            console.log('[Profile] Order update received:', data);

            // Allow refresh if we are on 'orders' tab OR 'profile' (dashboard summary might need it later)
            // For now, restrict to 'orders' to save bandwidth, but using Ref ensures we catch it if we just switched.
            if (activeTabRef.current === 'orders') {
                console.log('[Profile] Refreshing orders list with timestamp...');
                userService.getOrders({ _t: Date.now() })
                    .then(data => {
                        console.log('[Profile] Orders refreshed:', data?.length);
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

            // If parsing failed to get valid components, it might be safer to let user fill it again 
            // but populating first field is better than nothing.
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
            <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative border border-slate-100">
                    {/* Header */}
                    <div className="h-32 bg-gradient-to-br from-cafe-emerald to-cafe-teal flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80')] opacity-10 bg-cover bg-center" />
                        <div className="text-white text-center z-10">
                            <h2 className="text-2xl font-bold">Welcome Back</h2>
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
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50 font-medium"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        type="submit"
                                        className="w-full py-3.5 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal transition-all flex items-center justify-center gap-2"
                                    >
                                        {authLoading ? 'Sending...' : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
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
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
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
                                            className="w-full text-center text-2xl tracking-widest py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50 font-bold"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        type="submit"
                                        className="w-full py-3.5 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal transition-all"
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
                                    <h3 className="text-xl font-bold text-center text-slate-800 mb-4">Complete Profile</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                        <input
                                            type="text"
                                            value={userDetails.name}
                                            onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            value={userDetails.email}
                                            onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                        <input
                                            type="text"
                                            value={userDetails.address}
                                            onChange={e => setUserDetails({ ...userDetails, address: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        disabled={authLoading}
                                        type="submit"
                                        className="w-full py-3.5 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg mt-4"
                                    >
                                        {authLoading ? 'Creating Account...' : 'Complete & Login'}
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
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header Card */}
                <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 relative overflow-visible">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cafe-emerald/10 to-transparent rounded-bl-full pointer-events-none" />

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
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-6 py-4 transition-all border-l-4",
                                            isActive
                                                ? "bg-cafe-emerald/5 border-cafe-emerald text-cafe-emerald font-semibold"
                                                : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? "text-cafe-emerald" : "text-slate-400")} />
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
                                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                                <h2 className="text-xl font-bold text-slate-800 mb-6">Personal Information</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-600">Full Name</label>
                                                        <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-medium">{profileData?.name}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-600">Email Address</label>
                                                        <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-medium">{profileData?.email}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                                                        <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-medium">{profileData?.mobile}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'orders' && (
                                            <div className="space-y-6">
                                                {orders.length === 0 ? (
                                                    <div className="text-center py-20">
                                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                            <Package className="w-10 h-10 text-slate-300" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-slate-800 mb-2">No orders yet</h3>
                                                        <p className="text-slate-500 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start exploring our menu!</p>
                                                    </div>
                                                ) : orders.map(order => (
                                                    <div key={order._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300 group">

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
                                                                            order.status === 'delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                                order.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                                                                                    "bg-amber-50 text-amber-700 border-amber-100"
                                                                        )}>
                                                                            {order.status}
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
                                                                        to={`/track-order/${order._id}`}
                                                                        className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        Track Order <ArrowRight className="w-4 h-4" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Items Preview */}
                                                        <div className="mb-6 bg-slate-50/50 rounded-2xl p-4 space-y-3">
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
                                                            <div>
                                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</p>
                                                                <p className="text-2xl font-black text-slate-800">₹{order.total?.toFixed(2)}</p>
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
                                                                    className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {addresses.map(addr => (
                                                    <div key={addr._id} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-cafe-emerald transition-all relative group">
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
                                                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-cafe-emerald hover:text-white transition-colors"
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
                                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
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
                                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-cafe-emerald hover:text-cafe-emerald hover:bg-cafe-emerald/5 transition-all group min-h-[160px]"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Add New Address</span>
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'reviews' && (
                                            <div className="space-y-4">
                                                {!Array.isArray(reviews) || reviews.length === 0 ? (
                                                    <div className="text-center py-12 text-slate-400">No reviews found.</div>
                                                ) : reviews.map(review => {
                                                    // Debug log
                                                    console.log('Rendering Review:', review);
                                                    const displayName = review.productId
                                                        ? review.productId.name
                                                        : `Order #${review.orderId?.orderNumber || (typeof review.orderId === 'string' ? review.orderId : 'Unknown')}`;

                                                    return (
                                                        <div key={review._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <h3 className="font-bold text-slate-800 text-lg">
                                                                        {displayName}
                                                                    </h3>

                                                                    <div className="flex flex-col gap-1 mt-2">
                                                                        {/* Food Rating */}
                                                                        {review.foodRating && (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-slate-500 uppercase w-16">Food</span>
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
                                                                                                i < review.riderRating ? "fill-emerald-400 text-emerald-400" : "text-slate-200"
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

                                        {/* Edit Profile Modal */}
                                        <AnimatePresence>
                                            {showEditProfileModal && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                                                    >
                                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                            <h3 className="text-xl font-bold text-slate-800">Edit Profile</h3>
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
                                                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50 font-medium"
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
                                                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50 font-medium"
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
                                                                className="w-full py-3.5 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal transition-all flex items-center justify-center gap-2 mt-4"
                                                            >
                                                                <Save className="w-4 h-4" /> Save Changes
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        {/* Address Modal */}
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
                                                            <h3 className="text-xl font-bold text-slate-800">
                                                                {editingAddressId ? 'Edit Address' : 'Add New Address'}
                                                            </h3>
                                                            <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                                <X className="w-5 h-5 text-slate-400" />
                                                            </button>
                                                        </div>

                                                        <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
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

                                                            <div className="flex items-center gap-3 pt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="isDefault"
                                                                    checked={newAddress.isDefault}
                                                                    onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                                    className="w-5 h-5 rounded border-slate-300 text-cafe-emerald focus:ring-cafe-emerald"
                                                                />
                                                                <label htmlFor="isDefault" className="text-sm font-medium text-slate-700 cursor-pointer">
                                                                    Set as Default Address
                                                                </label>
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

                                        {activeTab === 'settings' && (
                                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                                <h2 className="text-xl font-bold text-slate-800 mb-6">Preferences</h2>
                                                {console.log('[SETTINGS TAB] profileData:', profileData)}
                                                {console.log('[SETTINGS TAB] notificationPreferences:', profileData?.notificationPreferences)}

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
                                                                profileData?.notificationPreferences?.email ? "bg-cafe-emerald" : "bg-slate-300"
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
                                                                profileData?.notificationPreferences?.sms ? "bg-cafe-emerald" : "bg-slate-300"
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
                                                                profileData?.notificationPreferences?.push ? "bg-cafe-emerald" : "bg-slate-300"
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
                                                                profileData?.notificationPreferences?.offers ? "bg-cafe-emerald" : "bg-slate-300"
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
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
                                                            ? "fill-emerald-400 text-emerald-400"
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
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cafe-emerald/50 min-h-[100px] resize-none"
                                    />
                                </div>

                                <button
                                    disabled={submittingReview}
                                    type="submit"
                                    className="w-full py-3.5 bg-cafe-emerald text-white rounded-xl font-bold shadow-lg shadow-cafe-emerald/30 hover:bg-cafe-teal transition-all"
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
