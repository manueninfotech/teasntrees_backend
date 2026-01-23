import { useState, useEffect } from 'react';
import { X, User, Bike, FileText, CreditCard, Phone, Star, TrendingUp, MapPin, Calendar, MessageSquare } from 'lucide-react';
import RiderStatusBadge from './RiderStatusBadge';
import api from '../utils/api';

export default function RiderDetailsModal({ isOpen, onClose, rider, onApprove, onReject, onToggleStatus }) {
    const [activeTab, setActiveTab] = useState('details'); // details, reviews
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        if (isOpen && rider && activeTab === 'reviews') {
            fetchRiderReviews();
        }
    }, [isOpen, rider, activeTab]);

    const fetchRiderReviews = async () => {
        setLoadingReviews(true);
        try {
            const response = await api.get(`/admin/reviews/rider/${rider._id}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews || []);
            }
        } catch (error) {
            console.error('Failed to fetch rider reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    if (!isOpen || !rider) return null;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const isLicenseExpired = rider.licenseExpiryDate && new Date(rider.licenseExpiryDate) < new Date();

    const StarRating = ({ rating }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                    <div className="p-6 flex items-center justify-between pb-0">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Rider Details</h2>
                            <p className="text-sm text-gray-500 mt-1">{rider.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-6"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 flex gap-6 mt-4">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                            {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'reviews' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Reviews & Ratings
                            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600 rounded-t-full" />}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                                <RiderStatusBadge type="approval" status={rider.isApproved ? 'approved' : 'pending'} />
                                <RiderStatusBadge type="active" status={rider.isActive} />
                                <RiderStatusBadge type="online" status={rider.isOnline} />
                                <RiderStatusBadge type="delivery" status={rider.isOnDelivery} />
                            </div>

                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{rider.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Mobile</p>
                                        <p className="font-medium">{rider.mobile}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{rider.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Joined Date</p>
                                        <p className="font-medium">{formatDate(rider.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bike className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Vehicle Type</p>
                                        <p className="font-medium capitalize">{rider.vehicleType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Vehicle Number</p>
                                        <p className="font-medium">{rider.vehicleNumber || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Vehicle Model</p>
                                        <p className="font-medium">{rider.vehicleModel || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Documents</h3>
                                </div>
                                <div className="space-y-3">
                                    {/* License */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-gray-900">Driving License</p>
                                            {isLicenseExpired && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">License Number</p>
                                                <p className="font-medium">{rider.licenseNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Expiry Date</p>
                                                <p className={`font-medium ${isLicenseExpired ? 'text-red-600' : ''}`}>
                                                    {formatDate(rider.licenseExpiryDate)}
                                                </p>
                                            </div>
                                        </div>
                                        {rider.licensePhoto && (
                                            <a
                                                href={rider.licensePhoto}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                            >
                                                View Document →
                                            </a>
                                        )}
                                    </div>

                                    {/* Aadhar */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="font-medium text-gray-900 mb-2">Aadhar Card</p>
                                        <div className="text-sm">
                                            <p className="text-gray-500">Aadhar Number</p>
                                            <p className="font-medium">{rider.aadharNumber || 'N/A'}</p>
                                        </div>
                                        {rider.aadharPhoto && (
                                            <a
                                                href={rider.aadharPhoto}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                            >
                                                View Document →
                                            </a>
                                        )}
                                    </div>

                                    {/* PAN */}
                                    {rider.panNumber && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="font-medium text-gray-900 mb-2">PAN Card</p>
                                            <div className="text-sm">
                                                <p className="text-gray-500">PAN Number</p>
                                                <p className="font-medium">{rider.panNumber}</p>
                                            </div>
                                            {rider.panPhoto && (
                                                <a
                                                    href={rider.panPhoto}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                                >
                                                    View Document →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Details */}
                            {rider.bankAccountNumber && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Bank Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Account Number</p>
                                            <p className="font-medium">{rider.bankAccountNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">IFSC Code</p>
                                            <p className="font-medium">{rider.ifscCode || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Account Holder Name</p>
                                            <p className="font-medium">{rider.accountHolderName || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Emergency Contact */}
                            {rider.emergencyContact?.name && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Phone className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Emergency Contact</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{rider.emergencyContact.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Mobile</p>
                                            <p className="font-medium">{rider.emergencyContact.mobile || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Relation</p>
                                            <p className="font-medium">{rider.emergencyContact.relation || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Performance Stats */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Performance Stats</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Deliveries</p>
                                        <p className="text-2xl font-bold text-gray-900">{rider.totalDeliveries || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Average Rating</p>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                            <p className="text-2xl font-bold text-gray-900">{rider.averageRating?.toFixed(1) || '0.0'}</p>
                                            <span className="text-sm text-gray-500">({rider.ratingsCount || 0})</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Earnings</p>
                                        <p className="text-2xl font-bold text-green-600">₹{rider.totalEarnings || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Pending Earnings</p>
                                        <p className="text-2xl font-bold text-orange-600">₹{rider.pendingEarnings || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!rider.isApproved && (
                                    <>
                                        <button
                                            onClick={() => {
                                                onApprove(rider);
                                                onClose();
                                            }}
                                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                        >
                                            Approve Rider
                                        </button>
                                        <button
                                            onClick={() => {
                                                onReject(rider);
                                                onClose();
                                            }}
                                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                        >
                                            Reject Rider
                                        </button>
                                    </>
                                )}
                                {rider.isApproved && (
                                    <button
                                        onClick={() => {
                                            onToggleStatus(rider);
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        {rider.isActive ? 'Deactivate Rider' : 'Activate Rider'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Reviews Tab Content */}
                            {loadingReviews ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-gray-900 font-medium">No Reviews Yet</h3>
                                    <p className="text-gray-500 text-sm">This rider hasn't received any reviews yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="border border-gray-100 rounded-lg p-5 hover:border-gray-200 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                        {review.customerId?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 text-sm">{review.customerId?.name || 'Unknown User'}</h4>
                                                        <p className="text-xs text-gray-500">
                                                            Order #{review.orderId?.orderNumber} • {new Date(review.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-xs font-medium text-yellow-700">
                                                        <span>{review.riderRating}</span>
                                                        <Star className="w-3 h-3 fill-current" />
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded p-3">
                                                "{review.review}"
                                            </p>
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
}
