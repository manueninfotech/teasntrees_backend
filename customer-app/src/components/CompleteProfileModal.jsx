// Complete Profile Modal Component
// Shown after OTP verification for new users or incomplete profiles

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CompleteProfileModal.css';

const CompleteProfileModal = ({ isOpen, mobile, existingData, onClose }) => {
    const { completeProfile } = useAuth();

    const [formData, setFormData] = useState({
        name: existingData?.name || '',
        email: existingData?.email || '',
        address: existingData?.address || ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate inputs
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!formData.address.trim()) {
            setError('Please enter your address');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Calling completeProfile with:', {
                mobile,
                name: formData.name,
                email: formData.email,
                address: formData.address
            });

            const response = await completeProfile(mobile, formData.name, formData.email, formData.address);

            console.log('Complete profile response:', response);

            // Profile completed successfully, modal will close automatically
            onClose();
        } catch (err) {
            console.error('Complete profile error:', err);
            setError(err.message || 'Failed to complete profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="complete-profile-modal scale-in">
                <div className="complete-profile-content">
                    <div className="profile-header">
                        <h2>Complete Your Profile</h2>
                        <p>Just a few more details to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="address">
                                Address *
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                className="form-textarea"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter your delivery address"
                                rows="3"
                                disabled={isLoading}
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Completing Profile...' : 'Complete Profile'}
                        </button>
                    </form>

                    <div className="profile-footer">
                        <p className="profile-note">
                            Mobile: <strong>{mobile}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfileModal;
