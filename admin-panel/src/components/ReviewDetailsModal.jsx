import React, { useEffect, useState } from 'react';
import { X, Star, Calendar, MessageSquare, ShoppingBag, User, Bike } from 'lucide-react';
import api from '../utils/api';

export default function ReviewDetailsModal({ isOpen, onClose, reviewId }) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && reviewId) {
            fetchReviewDetails();
        }
    }, [isOpen, reviewId]);

    const fetchReviewDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/reviews/${reviewId}`);
            if (response.data.success) {
                setReview(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch review details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const StarRating = ({ rating }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Review Details
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : review ? (
                        <div className="space-y-8">
                            {/* Order Info */}
                            <div className="flex items-start justify-between bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order #</p>
                                    <p className="font-bold text-gray-900">{review.orderId?.orderNumber || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Date
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(review.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>

                            {/* Ratings Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Food Rating */}
                                {review.foodRating && (
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-center">
                                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <ShoppingBag className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">Food Quality</p>
                                        <div className="flex justify-center mb-1">
                                            <StarRating rating={review.foodRating} />
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{review.foodRating}.0</p>
                                    </div>
                                )}

                                {/* Rider Rating */}
                                {review.riderRating && (
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-center">
                                        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bike className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">Delivery Service</p>
                                        <div className="flex justify-center mb-1">
                                            <StarRating rating={review.riderRating} />
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{review.riderRating}.0</p>
                                    </div>
                                )}

                                {/* Product Rating */}
                                {review.productRating && (
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-center">
                                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Star className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">Product Specific</p>
                                        <div className="flex justify-center mb-1">
                                            <StarRating rating={review.productRating} />
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{review.productRating}.0</p>
                                    </div>
                                )}
                            </div>

                            {/* Review Content */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Customer Feedback</h3>
                                <div className="bg-gray-50 rounded-xl p-6 relative">
                                    <MessageSquare className="absolute top-6 left-6 w-6 h-6 text-gray-200" />
                                    <p className="text-gray-700 italic relative z-10 pl-8">
                                        "{review.review}"
                                    </p>
                                </div>
                            </div>

                            {/* Product Details */}
                            {review.productId && (
                                <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                        {review.productId.image ? (
                                            <img
                                                src={review.productId.image}
                                                alt={review.productId.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-indigo-200" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                Product
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{review.productId.name}</h4>
                                        {review.productId.price && (
                                            <p className="text-sm text-gray-500 mt-0.5">Price: ₹{review.productId.price}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Entities Involved */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                {/* Customer */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {review.customerId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Customer</p>
                                        <p className="font-medium text-gray-900">{review.customerId?.name || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Rider (if applicable) */}
                                {review.riderId && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-bold">
                                            <Bike className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Rider</p>
                                            <p className="font-medium text-gray-900">{review.riderId?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Review not found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
