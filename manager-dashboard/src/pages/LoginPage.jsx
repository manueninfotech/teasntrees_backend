import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_teasntrees.png';

const LoginPage = () => {
    const [step, setStep] = useState('MOBILE');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [profile, setProfile] = useState({ name: '', email: '', address: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { requestOtp, verifyOtp, completeProfile } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setIsLoading(false);
            return;
        }

        const result = await requestOtp(mobile);

        if (result.success) {
            setStep('OTP');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await verifyOtp(mobile, otp);

        if (result.success) {
            if (result.isLoggedIn) {
                navigate('/');
            } else if (result.isNewUser) {
                setStep('PROFILE');
            }
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await completeProfile({
            mobile,
            ...profile
        });

        if (result.success) {
            if (result.isLoggedIn) {
                navigate('/');
            } else if (result.requiresApproval) {
                setStep('APPROVAL_PENDING');
            }
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    if (step === 'APPROVAL_PENDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-4">
                <div className="glass-card p-8 text-center max-w-md bg-white shadow-xl">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Approval Pending</h2>
                    <p className="text-gray-600">Your profile has been submitted. Please wait for an Admin to approve your account before you can log in.</p>
                    <button onClick={() => setStep('MOBILE')} className="mt-8 text-brand-primary text-sm hover:underline font-medium">Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
            {/* Background Elements - Light Mode */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-8 glass-card mx-4 bg-white/80 shadow-2xl backdrop-blur-xl border border-white/50"
            >
                <div className="text-center mb-8">
                    <img src={logo} alt="Teas N Trees" className="h-24 w-auto object-contain mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {step === 'PROFILE' ? 'Complete Profile' : 'Manager Portal'}
                    </h1>
                    <p className="text-gray-500 text-xs font-medium">
                        {step === 'PROFILE' ? 'Tell us a bit about yourself' : 'Secure Login Access'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 'MOBILE' && (
                        <motion.form
                            key="mobile-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleSendOtp}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-900 text-lg tracking-widest focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-mono shadow-sm"
                                        placeholder="9876543210"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                disabled={isLoading}
                                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/25"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Get OTP'}
                                {!isLoading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </motion.form>
                    )}

                    {step === 'OTP' && (
                        <motion.form
                            key="otp-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleVerifyOtp}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enter OTP</label>
                                    <div className="text-right">
                                        <p className="text-gray-900 text-sm font-mono tracking-wider mb-1">+91 {mobile}</p>
                                        <button type="button" onClick={() => setStep('MOBILE')} className="text-xs text-brand-primary font-medium hover:underline">Change Number</button>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 text-gray-900 text-lg tracking-[0.5em] focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-mono text-center shadow-sm"
                                    placeholder="......"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <button
                                disabled={isLoading}
                                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/25"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Verify'}
                            </button>
                        </motion.form>
                    )}

                    {step === 'PROFILE' && (
                        <motion.form
                            key="profile-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleProfileSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                <input type="text" required
                                    value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-brand-primary focus:bg-white outline-none transition-all shadow-sm" placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                <input type="email" required
                                    value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-brand-primary focus:bg-white outline-none transition-all shadow-sm" placeholder="manager@example.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Branch / Address</label>
                                <textarea required
                                    value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-brand-primary focus:bg-white outline-none h-20 resize-none transition-all shadow-sm" placeholder="Store Location" />
                            </div>
                            <button
                                disabled={isLoading}
                                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-50 shadow-lg shadow-brand-primary/25"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Complete Registration'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default LoginPage;

