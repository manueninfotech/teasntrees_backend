import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_teasntrees.png';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const LoginPage = () => {
    const [step, setStep] = useState('MOBILE');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [profile, setProfile] = useState({ name: '', email: '', address: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const { verifyOtp, completeProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize reCAPTCHA
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-otp-button', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setIsLoading(false);
            return;
        }

        try {
            const phoneNumber = `+91${mobile}`;
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            setStep('OTP');
        } catch (err) {
            console.error('Firebase Auth Error:', err);
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Verify OTP with Firebase
            const result = await confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();

            // 2. Pass ID token to backend via AuthContext
            const authResult = await verifyOtp(mobile, idToken);

            if (authResult.success) {
                if (authResult.isLoggedIn) {
                    navigate('/teasntrees');
                } else if (authResult.needsProfile) {
                    setStep('PROFILE');
                } else if (authResult.requiresApproval) {
                    setStep('APPROVAL_PENDING');
                }
            } else {
                setError(authResult.message);
            }
        } catch (err) {
            console.error('Verification Error:', err);
            setError(err.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
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
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-12 text-center max-w-md shadow-2xl border border-white">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Approval Pending</h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8 italic leading-relaxed">
                        Your profile has been submitted. Please wait for an Admin to approve your account before you can log in.
                    </p>
                    <button
                        onClick={() => setStep('MOBILE')}
                        className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-600 to-green-600 rounded-[2rem] mb-6 shadow-xl transform hover:scale-105 transition-transform duration-500 p-2">
                        <img src={logo} alt="Teas N Trees" className="w-full h-full object-contain filter brightness-0 invert" />
                    </div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent uppercase tracking-tighter mb-2">
                        {step === 'PROFILE' ? 'Join the Fleet' : 'Manager Portal'}
                    </h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] italic">
                        {step === 'PROFILE' ? 'Complete your profile to continue' : 'Secure Access System'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-xs font-black uppercase tracking-widest animate-shake">
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Access</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full bg-white border border-gray-100 rounded-2xl py-5 pl-14 pr-4 text-gray-900 text-lg tracking-[0.2em] focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all font-black shadow-sm"
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                id="send-otp-button"
                                disabled={isLoading || mobile.length < 10}
                                className="btn-primary w-full py-5 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-emerald-200 hover:scale-[1.02]"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Request OTP'}
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
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Device</p>
                                <div className="flex justify-between items-center">
                                    <p className="text-emerald-900 font-black tracking-widest">+91 {mobile}</p>
                                    <button type="button" onClick={() => setStep('MOBILE')} className="text-[10px] text-emerald-600 font-black uppercase tracking-widest hover:underline">Change</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transmission Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-5 text-gray-900 text-2xl tracking-[0.8em] focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all font-black text-center shadow-sm"
                                    placeholder="••••••"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <button
                                disabled={isLoading || otp.length < 6}
                                className="btn-primary w-full py-5 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-emerald-200 hover:scale-[1.02]"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Verify & Enter'}
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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity</label>
                                <input type="text" required
                                    value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-gray-900 text-sm font-bold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm" placeholder="COMMANDER NAME" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Email</label>
                                <input type="email" required
                                    value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-gray-900 text-sm font-bold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm" placeholder="EMAIL ADDRESS" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sector / Branch</label>
                                <textarea required
                                    value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-gray-900 text-sm font-bold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 outline-none h-24 resize-none transition-all shadow-sm" placeholder="STORE LOCATION" />
                            </div>
                            <button
                                disabled={isLoading}
                                className="btn-primary w-full py-5 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-emerald-200 hover:scale-[1.02] mt-4"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Finalize Registration'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-10 pt-8 border-t border-gray-100/50 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                        Secure Manager Node • Little H Encryption
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;

