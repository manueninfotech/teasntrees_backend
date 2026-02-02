import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, Settings, LogOut, Camera, ChevronRight, Clock, CheckCircle, ArrowRight, Phone, ShieldCheck, Mail, X, Save, Bell, Smartphone, Edit2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { Plus } from 'lucide-react';

const ProfilePage = () => {
    const { user, isAuthenticated, logout, sendOtp, verifyOtp, completeProfile } = useAuth();

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
    const [loadingData, setLoadingData] = useState(false);

    // Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: ''
    });
    const [savingAddress, setSavingAddress] = useState(false);

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
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
            setProfileData(user); // Ensure sync
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
                setProfileData(data);
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        try {
            // Concatenate full address string for simple display if needed, but backend stores fields
            const payload = {
                label: newAddress.tag,
                addressLine: `${newAddress.flatNo}, ${newAddress.street}, ${newAddress.area}, ${newAddress.city} - ${newAddress.pincode}`,
                isDefault: addresses.length === 0 // Make default if it's the first one
            };
            await userService.addAddress(payload);
            setShowAddressModal(false);
            setNewAddress({ tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: '' });
            // Refresh addresses
            const data = await userService.getAddresses();
            setAddresses(data || []);
        } catch (err) {
            console.error("Failed to save address", err);
            // You might want to show a toast here
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
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Failed to update profile");
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
                        {isEditing ? (
                            <div className="space-y-3 max-w-sm">
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-cafe-emerald"
                                    placeholder="Full Name"
                                />
                                <input
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-cafe-emerald"
                                    placeholder="Email Address"
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-slate-800">{profileData?.name || 'User'}</h1>
                                <p className="text-slate-500">{profileData?.email}</p>
                                <p className="text-slate-400 text-sm mt-1">{profileData?.mobile}</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                        {isEditing ? (
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={handleSaveProfile}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-cafe-emerald text-white rounded-xl font-medium hover:bg-cafe-teal transition-colors shadow-lg shadow-cafe-emerald/20"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}

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
                                            <div className="space-y-4">
                                                {orders.length === 0 ? (
                                                    <div className="text-center py-12 text-slate-400">No orders found.</div>
                                                ) : orders.map(order => (
                                                    <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">#{order.orderNumber || order._id.substring(order._id.length - 6).toUpperCase()}</div>
                                                                <div className="text-xs text-slate-500">
                                                                    {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length} items
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                            <div className="font-bold text-slate-900">₹{order.total}</div>
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                                                order.orderStatus === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                            )}>
                                                                {order.orderStatus}
                                                            </span>
                                                            <Link
                                                                to={`/track-order/${order._id}`}
                                                                className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
                                                            >
                                                                Track
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'addresses' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {addresses.map(addr => (
                                                    <div key={addr._id} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-cafe-emerald transition-all">
                                                        <h3 className="font-bold text-slate-800 mb-2">{addr.label || addr.tag || 'Home'}</h3>
                                                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                                            {addr.addressLine}
                                                        </p>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={() => setShowAddressModal(true)}
                                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-cafe-emerald hover:text-cafe-emerald hover:bg-cafe-emerald/5 transition-all group min-h-[160px]"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Add New Address</span>
                                                </button>
                                            </div>
                                        )}

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
                                                            <h3 className="text-xl font-bold text-slate-800">Add New Address</h3>
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

                                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-50 cursor-not-allowed">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                                                <Bell className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-800">Push Notifications</h3>
                                                                <p className="text-xs text-slate-500">Coming soon to mobile app</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-12 h-6 rounded-full bg-slate-200" />
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
        </div>
    );
};

export default ProfilePage;
