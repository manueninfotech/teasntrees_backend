import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, MapPin,
    Save, Edit2, X, CheckCircle2,
    ShieldCheck, LogOut, ChevronRight,
    Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        profileImage: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/manager/profile');
            const data = res.data;
            if (data.success) {
                setProfile(data.data);
                setFormData({
                    name: data.data.name || '',
                    email: data.data.email || '',
                    address: data.data.address || '',
                    profileImage: data.data.profileImage || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await api.post('/manager/upload/image', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const imageUrl = res.data.data.url;
                setFormData(prev => ({ ...prev, profileImage: imageUrl }));
                setProfile(prev => ({ ...prev, profileImage: imageUrl }));
                setMessage({ type: 'success', text: 'Image uploaded! Remember to save changes.' });
            }
        } catch (err) {
            console.error('Upload failed', err);
            setMessage({ type: 'error', text: 'Image upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await api.put('/manager/profile', formData);
            const data = res.data;
            if (data.success) {
                setProfile(data.data);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
                // Clear message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server error. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="w-10 h-10 border-4 border-bakery-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <input
                type="file"
                id="profile-upload"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
            />
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
                    <h1 className="text-5xl font-black text-bakery-primary uppercase tracking-tighter">My Profile</h1>
                    <p className="text-bakery-accent font-bold uppercase text-[10px] tracking-[0.3em] mt-2 italic">Managerial Access & Identity</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-bakery-primary text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-bakery-primary/20"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Column: Identity Card */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-bakery-primary" />

                        <div className="relative inline-block mb-8">
                            <div className="w-32 h-32 bg-bakery-light rounded-[2.5rem] flex items-center justify-center text-bakery-primary border-8 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                {uploading ? (
                                    <div className="w-10 h-10 border-4 border-bakery-primary border-t-transparent rounded-full animate-spin" />
                                ) : profile?.profileImage ? (
                                    <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16" />
                                )}
                            </div>
                            <label
                                htmlFor="profile-upload"
                                className="absolute -bottom-2 -right-2 p-3 bg-bakery-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-all cursor-pointer"
                            >
                                <Camera className="w-5 h-5" />
                            </label>
                        </div>

                        <h2 className="text-2xl font-black text-bakery-primary uppercase tracking-tight mb-2">{profile?.name}</h2>
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <span className="text-[9px] font-black uppercase text-bakery-primary bg-bakery-light px-4 py-1.5 rounded-full tracking-widest">
                                Branch Manager
                            </span>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-bakery-light text-left">
                            <div className="flex items-center gap-4 p-4 bg-bakery-light/20 rounded-2xl group hover:bg-bakery-light/40 transition-colors">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-bakery-accent group-hover:text-bakery-primary transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest mb-0.5">Mobile</p>
                                    <p className="text-xs font-black text-bakery-primary">{profile?.mobile || 'No mobile linked'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-bakery-light/20 rounded-2xl group hover:bg-bakery-light/40 transition-colors">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-500">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest mb-0.5">Account status</p>
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Verified & Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-8 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-[2.5rem] transition-all group shadow-sm hover:shadow-xl hover:shadow-red-200"
                    >
                        <div className="flex items-center gap-4">
                            <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            <span className="font-black uppercase text-xs tracking-widest">Logout Session</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100" />
                    </button>
                </div>

                {/* Right Column: Details & Editing */}
                <div className="xl:col-span-8">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.form
                                key="edit"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleUpdate}
                                className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-2 h-8 bg-bakery-primary rounded-full" />
                                    <h2 className="text-2xl font-black text-bakery-primary uppercase tracking-tight">Modify Identity</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-5 bg-bakery-light/30 border-2 border-transparent rounded-[1.5rem] text-sm font-bold text-bakery-primary focus:outline-none focus:border-bakery-primary/30 focus:bg-white transition-all shadow-inner"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] ml-2">Primary Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-5 bg-bakery-light/30 border-2 border-transparent rounded-[1.5rem] text-sm font-bold text-bakery-primary focus:outline-none focus:border-bakery-primary/30 focus:bg-white transition-all shadow-inner"
                                            placeholder="manager@littleh.com"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] ml-2">Operational Address</label>
                                        <textarea
                                            required
                                            rows="3"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-6 py-5 bg-bakery-light/30 border-2 border-transparent rounded-[1.5rem] text-sm font-bold text-bakery-primary focus:outline-none focus:border-bakery-primary/30 focus:bg-white transition-all shadow-inner resize-none"
                                            placeholder="Store location address..."
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-6">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-3 py-5 bg-bakery-primary text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-bakery-primary/20 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                <span>Commit Changes</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-10 py-5 bg-bakery-light text-bakery-accent rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-white border-2 border-transparent hover:border-bakery-light transition-all active:scale-95"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12"
                            >
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-6 rounded-3xl flex items-center gap-4 ${message.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}
                                    >
                                        {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                        <span className="text-xs font-bold">{message.text}</span>
                                    </motion.div>
                                )}

                                <div className="space-y-10">
                                    <div className="flex items-start gap-8 group">
                                        <div className="w-16 h-16 bg-bakery-light rounded-[1.5rem] flex items-center justify-center border border-bakery-primary/10 shadow-sm shrink-0 group-hover:rotate-6 transition-transform">
                                            <User className="w-7 h-7 text-bakery-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-2">Full Name</p>
                                            <h3 className="text-2xl font-black text-bakery-primary tracking-tight capitalize">{profile?.name}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-8 group">
                                        <div className="w-16 h-16 bg-bakery-light rounded-[1.5rem] flex items-center justify-center border border-bakery-primary/10 shadow-sm shrink-0 group-hover:-rotate-6 transition-transform">
                                            <Mail className="w-7 h-7 text-bakery-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-2">Email Address</p>
                                            <h3 className="text-2xl font-black text-bakery-primary tracking-tight lowercase">{profile?.email || 'Not verified'}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-8 group">
                                        <div className="w-16 h-16 bg-bakery-light rounded-[1.5rem] flex items-center justify-center border border-bakery-primary/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                                            <MapPin className="w-7 h-7 text-bakery-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-2">Business Location</p>
                                            <p className="text-lg font-bold text-bakery-primary/80 leading-relaxed max-w-md">{profile?.address || 'Physical address not set'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-bakery-light">
                                    <p className="text-[9px] font-black uppercase text-bakery-accent tracking-[0.3em] mb-6 italic opacity-50">Authorized Privileges</p>
                                    <div className="flex flex-wrap gap-3">
                                        {['Store Management', 'Fleet Oversight', 'Catalog Control', 'Financial Audit'].map((tag) => (
                                            <span key={tag} className="px-5 py-2.5 bg-bakery-light/40 text-bakery-primary text-[8px] font-black uppercase tracking-widest rounded-xl border border-bakery-primary/5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
