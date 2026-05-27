import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2, Coffee } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/littleh-logo.png';
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
    const { brand } = useParams();
    const b = brand || 'littleh';

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
            const result = await confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();

            const authResult = await verifyOtp(mobile, idToken);

            if (authResult.success) {
                if (authResult.isLoggedIn) {
                    navigate(`/${b}`);
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
            brand: b,
            ...profile
        });

        if (result.success) {
            if (result.isLoggedIn) {
                navigate(`/${b}`);
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
            <div className="min-h-screen flex items-center justify-center bg-bakery-bg text-bakery-primary p-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-12 text-center max-w-md shadow-2xl border border-white">
                    <div className="w-20 h-20 bg-bakery-light text-bakery-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-bakery-primary uppercase tracking-tighter mb-4">Approval Pending</h2>
                    <p className="text-bakery-accent font-bold uppercase text-[10px] tracking-[0.2em] mb-8 italic leading-relaxed">
                        Your profile has been submitted. Please wait for an Admin to approve your account before you can log in.
                    </p>
                    <button
                        onClick={() => setStep('MOBILE')}
                        className="btn-primary w-full shadow-xl shadow-bakery-primary/20"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bakery-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-bakery-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-bakery-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-bakery-light rounded-[2rem] mb-6 shadow-xl transform hover:scale-105 transition-transform duration-500 p-2">
                        <img src={logo} alt="LittleH" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-black text-bakery-primary uppercase tracking-tighter mb-2">
                        {step === 'PROFILE' ? 'Manager Registration' : 'LittleH Manager'}
                    </h1>
                    <p className="text-bakery-accent font-bold uppercase text-[10px] tracking-[0.2em] italic">
                        {step === 'PROFILE' ? 'Set up your workstation' : 'Secure Management Node'}
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
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Authentication Line</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bakery-accent group-focus-within:text-bakery-primary transition-colors" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="input pl-14 tracking-[0.2em]"
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                id="send-otp-button"
                                disabled={isLoading || mobile.length < 10}
                                className="btn-primary w-full flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Request Access'}
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
                            <div className="bg-bakery-light border border-bakery-accent/10 rounded-2xl p-4 mb-4">
                                <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-1">Target Identity</p>
                                <div className="flex justify-between items-center">
                                    <p className="text-bakery-primary font-black tracking-widest">+91 {mobile}</p>
                                    <button type="button" onClick={() => setStep('MOBILE')} className="text-[10px] text-bakery-accent font-black uppercase tracking-widest hover:underline hover:text-bakery-primary">Retarget</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Verification Key</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                    className="input text-center text-2xl tracking-[0.8em]"
                                    placeholder="••••••"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <button
                                disabled={isLoading || otp.length < 6}
                                className="btn-primary w-full flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Decrypt & Enter'}
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
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Manager Designation</label>
                                <input type="text" required
                                    value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="input p-4 text-sm font-bold" placeholder="MANAGER NAME" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Communication Channel</label>
                                <input type="email" required
                                    value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    className="input p-4 text-sm font-bold" placeholder="EMAIL@BAKERY.COM" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-bakery-accent uppercase tracking-widest ml-1">Assigned Station</label>
                                <textarea required
                                    value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    className="input p-4 text-sm font-bold h-24 resize-none" placeholder="LITTLEH BRANCH LOCATION" />
                            </div>
                            <button
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-4"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Finalize Sync'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-10 pt-8 border-t border-bakery-light text-center">
                    <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest leading-relaxed flex items-center justify-center gap-2">
                        <Coffee className="w-3 h-3" /> Handcrafted Management Node
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
