// Profile Page
// User profile management with backend integration

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import profileService from '../services/profileService';
import reviewService from '../services/reviewService';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Tabs: 'profile' or 'reviews'
    const [activeTab, setActiveTab] = useState('profile');
    const [reviews, setReviews] = useState([]);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        if (activeTab === 'profile') {
            fetchProfile();
        } else if (activeTab === 'reviews') {
            fetchMyReviews();
        }
    }, [isAuthenticated, navigate, activeTab]);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await profileService.getProfile();

            if (response.success && response.data && response.data.user) {
                const userData = response.data.user;
                setProfile(userData);
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    address: userData.address || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyReviews = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await reviewService.getMyReviews();

            if (response.success && response.data) {
                setReviews(response.data.reviews || []);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: profile?.name || '',
            email: profile?.email || '',
            address: profile?.address || ''
        });
        setError('');
    };

    const handleSave = async () => {
        setError('');
        setIsSaving(true);

        try {
            const response = await profileService.updateProfile(formData);

            if (response.success && response.data && response.data.user) {
                const updatedUser = response.data.user;
                setProfile(updatedUser);
                updateUser(updatedUser);
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !profile && activeTab === 'profile') {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If we're on profile tab but profile is null (and not loading), something is wrong
    if (activeTab === 'profile' && !profile && !isLoading) {
        return null;
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                    <p>Manage your account information</p>
                </div>

                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Personal Details
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        My Reviews
                    </button>
                </div>

                <div className="profile-content">
                    {activeTab === 'profile' ? (
                        <div className="profile-card">
                            <div className="card-header">
                                <h3>Personal Information</h3>
                                {!isEditing && (
                                    <button className="btn btn-outline" onClick={handleEdit}>
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="profile-info">
                                <div className="info-item">
                                    <label>Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={isSaving}
                                        />
                                    ) : (
                                        <p>{profile?.name || 'Not provided'}</p>
                                    )}
                                </div>

                                <div className="info-item">
                                    <label>Mobile</label>
                                    <p>{profile?.mobile || user?.mobile}</p>
                                </div>

                                <div className="info-item">
                                    <label>Email</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={isSaving}
                                        />
                                    ) : (
                                        <p>{profile?.email || 'Not provided'}</p>
                                    )}
                                </div>

                                <div className="info-item">
                                    <label>Address</label>
                                    {isEditing ? (
                                        <textarea
                                            name="address"
                                            className="form-textarea"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows="3"
                                            disabled={isSaving}
                                        />
                                    ) : (
                                        <p>{profile?.address || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="profile-actions">
                                    <button
                                        className="btn btn-outline"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="reviews-section">
                            {isLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading reviews...</p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="empty-state">
                                    <p>You haven't posted any reviews yet.</p>
                                    <Link to="/orders" className="btn btn-primary">
                                        Rate your Orders
                                    </Link>
                                </div>
                            ) : (
                                <div className="reviews-list">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="review-card">
                                            <div className="review-header">
                                                {review.productId ? (
                                                    <div className="review-product-info">
                                                        {review.productId.image && (
                                                            <img
                                                                src={review.productId.image}
                                                                alt={review.productId.name}
                                                                className="review-thumb"
                                                            />
                                                        )}
                                                        <div>
                                                            <h4>{review.productId.name}</h4>
                                                            <span className="review-date">
                                                                {new Date(review.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="review-order-info">
                                                        <h4>Order #{review.orderId?.orderNumber || 'N/A'}</h4>
                                                        <span className="review-date">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="review-ratings">
                                                    {review.productRating > 0 && (
                                                        <span className="rating-badge">
                                                            {review.productRating} ★ Product
                                                        </span>
                                                    )}
                                                    {review.foodRating > 0 && (
                                                        <span className="rating-badge">
                                                            {review.foodRating} ★ Food
                                                        </span>
                                                    )}
                                                    {review.riderRating > 0 && (
                                                        <span className="rating-badge">
                                                            {review.riderRating} ★ Rider
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {review.review && (
                                                <p className="review-text">"{review.review}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
