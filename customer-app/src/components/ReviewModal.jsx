// Product Review Modal Component
// Submit reviews and ratings for products

import { useState } from 'react';
import reviewService from '../services/reviewService';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, type = 'product', product, orderId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0); // Used for product rating
    const [foodRating, setFoodRating] = useState(0);
    const [riderRating, setRiderRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [hoverFoodRating, setHoverFoodRating] = useState(0);
    const [hoverRiderRating, setHoverRiderRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (type === 'product' && rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (type === 'order' && (foodRating === 0 || riderRating === 0)) {
            setError('Please provide both food and rider ratings');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            if (type === 'product') {
                await reviewService.rateProduct({
                    productId: product._id,
                    orderId,
                    rating,
                    review: comment
                });
            } else {
                await reviewService.createReview({
                    orderId,
                    foodRating,
                    riderRating,
                    review: comment
                });
            }

            // Reset form
            setRating(0);
            setFoodRating(0);
            setRiderRating(0);
            setComment('');

            if (onReviewSubmitted) {
                onReviewSubmitted();
            }

            onClose();
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{type === 'product' ? 'Rate Product' : 'Rate Your Order'}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {type === 'product' && product && (
                        <div className="product-info">
                            <img src={product.image} alt={product.name} />
                            <h3>{product.name}</h3>
                        </div>
                    )}

                    {type === 'order' && (
                        <div className="order-info-text">
                            <h3>Order #{orderId?.slice ? orderId.slice(-6) : orderId}</h3>
                            <p>How was your food and delivery experience?</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {type === 'product' ? (
                            <div className="form-group">
                                <label>Your Rating *</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Food Rating *</label>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star ${star <= (hoverFoodRating || foodRating) ? 'active' : ''}`}
                                                onClick={() => setFoodRating(star)}
                                                onMouseEnter={() => setHoverFoodRating(star)}
                                                onMouseLeave={() => setHoverFoodRating(0)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Rider Rating *</label>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star ${star <= (hoverRiderRating || riderRating) ? 'active' : ''}`}
                                                onClick={() => setRiderRating(star)}
                                                onMouseEnter={() => setHoverRiderRating(star)}
                                                onMouseLeave={() => setHoverRiderRating(0)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Your Review (Optional)</label>
                            <textarea
                                className="form-textarea"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={type === 'product' ? "Share your experience with this product..." : "Tell us about the food taste and delivery service..."}
                                rows="4"
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
