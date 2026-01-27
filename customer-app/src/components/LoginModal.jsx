// Login Modal Component
// OTP-based authentication modal

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CompleteProfileModal from './CompleteProfileModal';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose }) => {
    const { sendOTP, verifyOTP } = useAuth();

    const [step, setStep] = useState('mobile'); // 'mobile' or 'otp'
    const [mobile, setMobile] = useState('');
    const [otp, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Complete profile state
    const [showCompleteProfile, setShowCompleteProfile] = useState(false);
    const [profileData, setProfileData] = useState(null);

    if (!isOpen && !showCompleteProfile) return null;

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile)) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);

        try {
            const response = await sendOTP(mobile);

            if (response.success) {
                setStep('otp');
                setOtpSent(true);
                setError('');
            }
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        // Validate OTP
        if (!/^\d{6}$/.test(otp)) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);

        try {
            const response = await verifyOTP(mobile, otp);

            if (response.success) {
                // Check if profile needs to be completed
                if (response.data.isProfileComplete === false) {
                    // Show complete profile modal
                    setProfileData({
                        mobile: response.data.mobile,
                        isNewUser: response.data.isNewUser,
                        existingData: response.data.existingData || {}
                    });
                    setShowCompleteProfile(true);
                    // Don't close login modal yet
                } else {
                    // Profile complete, close modal and reset state
                    handleClose();
                }
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('mobile');
        setMobile('');
        setOTP('');
        setError('');
        setOtpSent(false);
        setShowCompleteProfile(false);
        setProfileData(null);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // Show complete profile modal if needed
    if (showCompleteProfile && profileData) {
        return (
            <CompleteProfileModal
                isOpen={true}
                mobile={profileData.mobile}
                existingData={profileData.existingData}
                onClose={handleClose}
            />
        );
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="login-modal scale-in">
                <button className="modal-close" onClick={handleClose} aria-label="Close">
                    ✕
                </button>

                <div className="login-modal-content">
                    <div className="login-header">
                        <h2>Welcome to TeasNTrees</h2>
                        <p>Sign in to continue</p>
                    </div>

                    {step === 'mobile' && (
                        <form onSubmit={handleSendOTP} className="login-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="mobile">
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    id="mobile"
                                    className="form-input"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength="10"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="login-form">
                            <div className="otp-info">
                                <p>OTP sent to <strong>{mobile}</strong></p>
                                <button
                                    type="button"
                                    className="change-number-btn"
                                    onClick={() => setStep('mobile')}
                                >
                                    Change number
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="otp">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    className="form-input otp-input"
                                    value={otp}
                                    onChange={(e) => setOTP(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength="6"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Login'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline resend-btn"
                                onClick={handleSendOTP}
                                disabled={isLoading}
                            >
                                Resend OTP
                            </button>
                        </form>
                    )}

                    <div className="login-footer">
                        <p className="login-note">
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
