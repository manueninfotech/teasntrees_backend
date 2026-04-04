import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Edit2,
    X,
    CheckCircle2,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: ''
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
                    address: data.data.address || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
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
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">My Profile</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Manage your account details</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />

                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                            <User className="w-12 h-12 text-emerald-600" />
                        </div>

                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">{profile?.name}</h2>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                                {profile?.role}
                            </span>
                            {profile?.isApproved && (
                                <Briefcase className="w-4 h-4 text-gray-400" />
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-gray-50 text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-xl">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Mobile</p>
                                    <p className="text-xs font-bold text-gray-900">{profile?.mobile}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-xl">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Verified Account</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.form
                                key="edit"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleUpdate}
                                className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-8"
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-sans"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-sans"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <textarea
                                                required
                                                rows="3"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-sans resize-none"
                                                placeholder="Enter full address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <><Save className="w-4 h-4" /> Save Changes</>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-10"
                            >
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}
                                    >
                                        {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                        <span className="text-xs font-bold leading-none">{message.text}</span>
                                    </motion.div>
                                )}

                                <div className="space-y-10">
                                    <div className="relative group cursor-default">
                                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                                                <User className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</p>
                                                <p className="text-lg font-black text-gray-900 tracking-tight capitalize">{profile?.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative group cursor-default">
                                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                                                <Mail className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</p>
                                                <p className="text-lg font-black text-gray-900 tracking-tight lowercase">{profile?.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative group cursor-default">
                                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                                                <MapPin className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Business Location</p>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{profile?.address || 'No address set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50">
                                    <div className="flex flex-wrap gap-3">
                                        {['Management Role', 'Platform Access', 'Inventory Control'].map((label, idx) => (
                                            <span key={idx} className="text-[9px] font-black uppercase text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 tracking-widest">
                                                {label}
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
