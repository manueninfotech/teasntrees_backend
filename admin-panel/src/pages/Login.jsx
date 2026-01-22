import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coffee, ArrowRight, Sparkles, User, Mail } from 'lucide-react';

export default function Login() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('mobile'); // 'mobile', 'otp', 'profile'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        address: ''
    });
    const { verifyOTP, completeProfile } = useAuth();
    const navigate = useNavigate();

    const sendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/admin/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });

            const data = await response.json();

            if (data.success) {
                setStep('otp');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await verifyOTP(mobile, otp);

            if (result.needsProfile) {
                // New user needs to complete profile
                setStep('profile');
            } else {
                // Existing user, redirect to dashboard
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await completeProfile(mobile, profileData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
                        <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        Teas n Trees
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <p className="font-medium">Admin Portal</p>
                        <Sparkles className="w-4 h-4 text-green-600" />
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-shake">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Step 1: Mobile Number */}
                {step === 'mobile' && (
                    <form onSubmit={sendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 10-digit mobile"
                                    className="input pl-12 text-lg"
                                    maxLength="10"
                                    required
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    +91
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || mobile.length !== 10}
                            className="btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    Send OTP
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700">
                                OTP sent to <strong className="text-green-700">+91 {mobile}</strong>
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('mobile');
                                    setOtp('');
                                    setError('');
                                }}
                                className="text-sm text-green-600 hover:text-green-700 font-medium mt-1 hover:underline"
                            >
                                Change number
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="• • • • • •"
                                className="input text-center text-3xl tracking-[1em] font-bold"
                                maxLength="6"
                                autoFocus
                                required
                            />
                            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p>Dev mode: Use <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">123456</code></p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify & Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 3: Complete Profile */}
                {step === 'profile' && (
                    <form onSubmit={handleCompleteProfile} className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-700 font-medium">
                                Welcome! Please complete your profile to continue.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    placeholder="Enter your email"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Address
                            </label>
                            <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                placeholder="Enter your address"
                                className="input resize-none"
                                rows="3"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !profileData.name || !profileData.email || !profileData.address}
                            className="btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Complete Profile
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                        Secure admin access • Protected by JWT
                    </p>
                </div>
            </div>
        </div>
    );
}