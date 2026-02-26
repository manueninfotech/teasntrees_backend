import { useState } from 'react';
import {
    User, Mail, Phone, MapPin,
    Save, Camera, Shield, LogOut,
    Coffee, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/littleh-logo.png';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex items-end justify-between bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-bakery-bg rounded-full -mr-40 -mt-40"></div>

                <div className="relative z-10 flex items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-bakery-light rounded-[2.5rem] flex items-center justify-center text-bakery-primary border-8 border-white shadow-2xl overflow-hidden">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16" />
                            )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-bakery-primary text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-bakery-primary uppercase tracking-tighter mb-2">{user?.name || 'Manager Name'}</h1>
                        <p className="text-bakery-accent font-bold uppercase text-[10px] tracking-[0.2em] italic flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Branch Manager
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="card space-y-8">
                        <div className="flex items-center justify-between border-b border-bakery-light pb-6">
                            <h2 className="text-xl font-black text-bakery-primary uppercase tracking-tight">Personal Details</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-[10px] font-black uppercase text-bakery-accent hover:text-bakery-primary transition-colors"
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Full Name</label>
                                <div className="p-4 bg-bakery-light/30 rounded-2xl border border-transparent font-bold text-bakery-primary">
                                    {user?.name || '---'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="p-4 bg-bakery-light/30 rounded-2xl border border-transparent font-bold text-bakery-primary">
                                    {user?.mobile || '---'}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Email Address</label>
                                <div className="p-4 bg-bakery-light/30 rounded-2xl border border-transparent font-bold text-bakery-primary">
                                    {user?.email || '---'}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <button className="btn-primary w-full flex items-center justify-center gap-3">
                                <Save className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Store Changes</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-bakery-primary rounded-[2.5rem] p-10 text-white shadow-2xl shadow-bakery-primary/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Coffee className="w-20 h-20" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-6">Security</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/10 rounded-2xl flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Device Auth</span>
                                <span className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase">Active</span>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Last Sync</span>
                                <span className="text-[8px] font-black uppercase">2m ago</span>
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
            </div>
        </div>
    );
}
