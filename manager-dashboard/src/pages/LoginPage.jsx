import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/managerService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertTriangle, CheckCircle, Sparkles, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
    const [step, setStep] = useState('mobile'); // 'mobile', 'otp', or 'pending-approval'
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [pendingUser, setPendingUser] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Send OTP mutation
    const sendOTPMutation = useMutation({
        mutationFn: () => authService.sendOTP(mobile),
        onSuccess: () => {
            toast.success('OTP sent successfully!');
            setStep('otp');
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        },
    });

    // Verify OTP mutation
    const verifyOTPMutation = useMutation({
        mutationFn: () => authService.verifyOTP(mobile, otp),
        onSuccess: (data) => {
            if (data.success) {
                // Check if profile is complete
                if (data.data.isProfileComplete === false) {
                    toast.error('Please complete your profile first');
                    return;
                }

                // Backend returns 'token' not 'accessToken'
                const { user, token, refreshToken } = data.data;

                if (!token || !refreshToken || !user) {
                    toast.error('Invalid response from server');
                    return;
                }

                login(user, token, refreshToken);
                toast.success('Login successful!');
                navigate('/');
            }
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Invalid OTP';

            // Check if it's a pending approval error
            if (message.includes('pending approval') || message.includes('not approved')) {
                setPendingUser({ mobile, name: 'Manager' });
                setStep('pending-approval');
            } else {
                toast.error(message);
            }
        },
    });

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (mobile.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        sendOTPMutation.mutate();
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        verifyOTPMutation.mutate();
    };

    const handleResendOTP = () => {
        if (countdown > 0) return;
        sendOTPMutation.mutate();
    };

    const handleBackToLogin = () => {
        setStep('mobile');
        setMobile('');
        setOtp('');
        setPendingUser(null);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

                {/* Floating Icons */}
                <div className="absolute top-20 left-20 animate-float">
                    <Sparkles className="w-8 h-8 text-emerald-400/40" />
                </div>
                <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: '0.5s' }}>
                    <Shield className="w-10 h-10 text-teal-400/40" />
                </div>
                <div className="absolute bottom-32 left-40 animate-float" style={{ animationDelay: '1s' }}>
                    <Zap className="w-6 h-6 text-purple-400/40" />
                </div>
            </div>

            {/* Main Card */}
            <div className="relative glass-card p-8 md:p-12 w-full max-w-md shadow-2xl border-2 border-white/20 dark:border-white/10">
                {/* Shine Effect */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
                </div>

                {/* Logo & Header */}
                <div className="text-center mb-8 relative">
                    <div className="inline-block relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50 animate-pulse"></div>
                        <h1 className="text-5xl font-bold gradient-text relative">
                            Teas N Trees
                        </h1>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-500"></div>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                            Manager Dashboard
                        </p>
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-teal-500"></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                        Crystal Glass UI 2026
                    </p>
                </div>

                {/* Mobile Step */}
                {step === 'mobile' && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50 mb-4">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Welcome Back
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter your mobile number to continue
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Mobile Number"
                                type="tel"
                                placeholder="Enter 10-digit mobile number"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300"
                                isLoading={sendOTPMutation.isPending}
                            >
                                {sendOTPMutation.isPending ? 'Sending...' : 'Send OTP'}
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-3 pt-4">
                            <div className="text-center p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
                                <Shield className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600 dark:text-gray-400">Secure</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-200/50 dark:border-teal-800/30">
                                <Zap className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600 dark:text-gray-400">Fast</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-800/30">
                                <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600 dark:text-gray-400">Modern</p>
                            </div>
                        </div>
                    </form>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 mb-4 animate-pulse">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Verify OTP
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter the 6-digit code sent to
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                                {mobile}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="OTP Code"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                                className="text-center text-2xl tracking-widest font-semibold"
                            />

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep('mobile');
                                        setOtp('');
                                    }}
                                    className="flex-1 h-12"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 text-lg font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                                    isLoading={verifyOTPMutation.isPending}
                                >
                                    {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify'}
                                </Button>
                            </div>
                        </div>

                        {/* Resend OTP */}
                        <div className="text-center">
                            {countdown > 0 ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Resend OTP in <span className="font-semibold text-emerald-600">{countdown}s</span>
                                    </p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium underline underline-offset-4"
                                    disabled={sendOTPMutation.isPending}
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Pending Approval Step */}
                {step === 'pending-approval' && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 animate-pulse"></div>
                                <div className="relative w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                                    <AlertTriangle className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Pending Approval
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your manager account is awaiting admin approval
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800/50 space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                                    Account Status: Pending
                                </p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <strong>Mobile:</strong> {pendingUser?.mobile}
                            </p>
                            <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Please contact your admin to approve your account. You'll receive a notification once approved.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleBackToLogin}
                            variant="outline"
                            className="w-full h-12"
                        >
                            Back to Login
                        </Button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Shield className="w-3 h-3" />
                        <span>Secure Manager Access</span>
                        <span>•</span>
                        <span>Powered by Crystal Glass UI</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
