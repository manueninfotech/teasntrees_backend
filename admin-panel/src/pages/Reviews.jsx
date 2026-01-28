import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Check, X, Trash2 } from 'lucide-react';
import api from '../utils/api';
import ReviewDetailsModal from '../components/ReviewDetailsModal';
import { useSocket } from '../context/SocketContext';

const Reviews = () => {
    const [reviewType, setReviewType] = useState('food'); // 'food' or 'rider'
    const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReviews: 0,
        pendingReviews: 0,
        averageFoodRating: 0,
        averageRiderRating: 0
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // New state for modal
    const [selectedReviewId, setSelectedReviewId] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [activeTab, page, reviewType]);

    useEffect(() => {
        if (socket) {
            const handleReviewChange = (data) => {
                console.log('Real-time review change:', data);
                fetchStats();
                fetchReviews();
            };

            socket.on('review:new', handleReviewChange);
            socket.on('review:updated', handleReviewChange);

            return () => {
                socket.off('review:new', handleReviewChange);
                socket.off('review:updated', handleReviewChange);
            };
        }
    }, [socket]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/reviews/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10, type: reviewType };
            if (activeTab !== 'all') {
                params.status = activeTab;
            }
            const response = await api.get('/admin/reviews', { params });
            if (response.data.success) {
                setReviews(response.data.data.reviews);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/admin/reviews/${id}/approve`);
            fetchReviews();
            fetchStats();
        } catch (error) {
            console.error('Error approving review:', error);
            alert('Failed to approve review');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this review?')) return;
        try {
            await api.patch(`/admin/reviews/${id}/reject`);
            fetchReviews();
            fetchStats();
        } catch (error) {
            console.error('Error rejecting review:', error);
            alert('Failed to reject review');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
        try {
            await api.delete(`/admin/reviews/${id}`);
            fetchReviews();
            fetchStats();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    const handleViewDetails = (id) => {
        setSelectedReviewId(id);
        setShowDetailsModal(true);
    };

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
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reviews & Ratings</h1>
                    <p className="text-sm text-gray-500">Moderate and manage customer feedback</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Reviews</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalReviews}</h3>
                    <div className="mt-2 text-xs text-green-600">Lifetime feedback</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium mb-1">Pending Approval</p>
                    <h3 className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</h3>
                    <div className="mt-2 text-xs text-orange-600">Requires attention</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium mb-1">Avg. Food Rating</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-800">{stats.averageFoodRating}</h3>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium mb-1">Avg. Rider Rating</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-800">{stats.averageRiderRating}</h3>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Type Toggles */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => { setReviewType('food'); setPage(1); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${reviewType === 'food'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                >
                    Food Reviews
                </button>
                <button
                    onClick={() => { setReviewType('rider'); setPage(1); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${reviewType === 'rider'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                >
                    Rider Reviews
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Status Tabs */}
                <div className="border-b border-gray-200 px-6 pt-4 flex gap-6">
                    {['all', 'pending', 'approved'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setPage(1); }}
                            className={`pb-4 px-2 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab} Reviews
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
                            <p className="text-gray-500 mt-1">There are no reviews matching the current filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review._id} className="border border-gray-100 rounded-lg p-5 hover:border-gray-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            {/* Customer Avatar Placeholder */}
                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                {review.customerId?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{review.customerId?.name || 'Unknown User'}</h4>
                                                <p className="text-xs text-gray-500">
                                                    Order #{review.orderId?.orderNumber} • {new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${review.isApproved
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-yellow-50 text-yellow-700'
                                            }`}>
                                            {review.isApproved ? 'Approved' : 'Pending'}
                                        </div>
                                    </div>

                                    {/* Ratings Grid (Conditioned by Type) */}
                                    <div className="flex gap-6 mb-4 text-sm">
                                        {reviewType === 'food' && (
                                            <>
                                                {review.foodRating && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Food:</span>
                                                        <StarRating rating={review.foodRating} />
                                                    </div>
                                                )}
                                                {review.productRating && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Product:</span>
                                                        <StarRating rating={review.productRating} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {reviewType === 'rider' && review.riderId && (
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">Rider:</span>
                                                    <span className="font-medium">{review.riderId.name}</span>
                                                </div>
                                                {review.riderRating && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Rating:</span>
                                                        <StarRating rating={review.riderRating} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Name if Product Review */}
                                    {reviewType === 'food' && review.productId && (
                                        <div className="mb-2 text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded">
                                            Product: {review.productId.name}
                                        </div>
                                    )}

                                    <p className="text-gray-700 text-sm leading-relaxed mb-4 p-3 bg-gray-50 rounded-lg">
                                        "{review.review}"
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 border-t pt-4">
                                        <button
                                            onClick={() => handleViewDetails(review._id)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs font-bold"
                                        >
                                            View
                                        </button>

                                        {!review.isApproved && (
                                            <button
                                                onClick={() => handleApprove(review._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-xs font-bold"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                        )}
                                        {review.isApproved && (
                                            <button
                                                onClick={() => handleReject(review._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors text-xs font-bold"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Reject (Hide)
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-xs font-bold ml-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Details Modal */}
            <ReviewDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                reviewId={selectedReviewId}
            />
        </div>
    );
};

export default Reviews;
