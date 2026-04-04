import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, MessageSquarePlus, Quote, ThumbsUp, Send, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const reviewsData = [
    {
        id: 1,
        name: "Sai Sandhya",
        rating: 5,
        text: "The ambience is literally awesome. Cheese garlic bread and normal garlic bread are a must-try. A great place to hang out.",
        platform: "Google Reviews"
    },
    {
        id: 2,
        name: "Akki",
        rating: 5,
        text: "Food, service and ambience is Superb. Can't wait to visit again!",
        platform: "Google Reviews"
    },
    {
        id: 3,
        name: "Gondi Siva Rama Krishna",
        rating: 4,
        text: "Nice vegetarian food and prompt service. Good ambiance for a relaxing evening.",
        platform: "Google Reviews"
    },
    {
        id: 4,
        name: "lucky mourya",
        rating: 5,
        text: "Nice place to enjoy and relax. Definitely a hidden gem in Guntur.",
        platform: "Google Reviews"
    }
];

const littlehReviewsData = [
    {
        id: 1,
        name: "Priya Reddy",
        rating: 5,
        text: "The custom cake for my daughter's birthday was absolutely beautiful and tasted divine! Highly recommend.",
        platform: "Google Reviews"
    },
    {
        id: 2,
        name: "Rahul M",
        rating: 5,
        text: "Best macarons in town. The pink ambience makes it such a happy place to grab a dessert.",
        platform: "Google Reviews"
    },
    {
        id: 3,
        name: "Anjali K",
        rating: 4,
        text: "Got the chocolate truffle pastry and it was incredibly soft. Just wish they had more seating.",
        platform: "Google Reviews"
    },
    {
        id: 4,
        name: "Vikram N",
        rating: 5,
        text: "Ordered a box of assorted cupcakes for an office party. Everyone loved them! Hidden gem.",
        platform: "Google Reviews"
    }
];

import { reviewService } from '../services/reviewService';
import toast from 'react-hot-toast';
import { useBrand } from '../context/BrandContext';

const ReviewsPage = () => {
    const { brand, theme } = useBrand();
    const [dynamicReviews, setDynamicReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [brand]);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const res = await reviewService.getSiteReviews(1, 4);
            setDynamicReviews(res.reviews || []);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await reviewService.createReview({
                rating,
                comment
            });
            setIsSubmitted(true);
            toast.success("Review submitted! It will appear after approval.");
        } catch (error) {
            console.error("Review failed", error);
            if (error.response?.status === 401) {
                toast.error("Please login to submit a review");
            } else {
                toast.error(error.response?.data?.message || "Failed to submit review");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (theme.isLittleH) {
        return (
            <div className="min-h-screen pt-28 pb-20 bg-[#FAF1E8] font-sans selection:bg-[#565A47] selection:text-[#FAF1E8]">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header Section */}
                    <div className="text-center max-w-4xl mx-auto mb-20 border-b border-[#8B8E7B]/20 pb-12">
                        <span className="uppercase tracking-[0.3em] text-[#8B8E7B] text-sm font-semibold mb-6 block">Testimonials</span>
                        <h1 className="text-5xl lg:text-7xl font-playfair font-bold text-[#565A47] mb-8 leading-tight">
                            Words of <span className="italic font-light">Affection</span>
                        </h1>
                        <p className="text-[#8B8E7B] text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Read the lovely experiences shared by our community, whose joy is the greatest testament to our craft.
                        </p>
                    </div>

                    {/* Reviews Grid */}
                    <div className="max-w-6xl mx-auto mb-24">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-10 h-10 border-2 border-[#565A47] border-t-transparent rounded-full animate-spin mb-4" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Static Reviews */}
                                {(littlehReviewsData).map((review, idx) => (
                                    <motion.div
                                        key={`static-${review.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-[#FDF5EC] rounded-none p-10 border border-[#8B8E7B]/10 relative group hover:border-[#565A47]/30 transition-colors"
                                    >
                                        <Quote className="absolute top-6 right-6 w-12 h-12 text-[#565A47] opacity-5 group-hover:opacity-10 transition-opacity" />

                                        <div className="flex items-center gap-1 mb-6">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-[#565A47] fill-[#565A47]" strokeWidth={1} />
                                            ))}
                                        </div>

                                        <p className="text-[#565A47] text-xl leading-loose font-playfair italic mb-8 flex-grow">
                                            "{review.text}"
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto border-t border-[#8B8E7B]/10 pt-6">
                                            <div className="w-12 h-12 bg-[#FAF1E8] flex items-center justify-center font-bold text-[#565A47] border border-[#8B8E7B]/20">
                                                {review.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#565A47] text-sm uppercase tracking-widest">{review.name}</h4>
                                                <span className="text-xs text-[#8B8E7B] italic">{review.platform}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Dynamic Reviews */}
                                {dynamicReviews.map((review, idx) => (
                                    <motion.div
                                        key={review._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (idx + littlehReviewsData.length) * 0.1 }}
                                        className="bg-[#FDF5EC] rounded-none p-10 border border-[#8B8E7B]/10 relative group hover:border-[#565A47]/30 transition-colors"
                                    >
                                        <Quote className="absolute top-6 right-6 w-12 h-12 text-[#565A47] opacity-5 group-hover:opacity-10 transition-opacity" />

                                        <div className="flex items-center gap-1 mb-6">
                                            {[...Array(review.foodRating || 5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-[#565A47] fill-[#565A47]" strokeWidth={1} />
                                            ))}
                                        </div>

                                        <p className="text-[#565A47] text-xl leading-loose font-playfair italic mb-8 flex-grow">
                                            "{review.review}"
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto border-t border-[#8B8E7B]/10 pt-6">
                                            <div className="w-12 h-12 bg-[#FAF1E8] flex items-center justify-center font-bold text-[#565A47] border border-[#8B8E7B]/20">
                                                {(review.customerId?.name || 'Customer')[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#565A47] text-sm uppercase tracking-widest">{review.customerId?.name || 'Verified Customer'}</h4>
                                                <span className="text-xs text-[#8B8E7B] italic">
                                                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Internal Review Form */}
                    <div className="max-w-2xl mx-auto bg-[#FDF5EC] p-12 border border-[#8B8E7B]/20 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF1E8] px-4">
                            <MessageSquarePlus className="w-8 h-8 text-[#565A47]" strokeWidth={1} />
                        </div>

                        <div className="text-center mb-10 pt-4">
                            <h2 className="text-3xl font-playfair font-bold text-[#565A47]">Share Your Experience</h2>
                        </div>

                        <AnimatePresence mode="wait">
                            {isSubmitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <h3 className="text-2xl font-playfair font-bold text-[#565A47] mb-4">With Gratitude</h3>
                                    <p className="text-[#8B8E7B] font-light mb-8 leading-relaxed max-w-sm mx-auto">
                                        Your feedback has been received and will be displayed shortly. Thank you for your support.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsSubmitted(false);
                                            setRating(0);
                                            setComment('');
                                        }}
                                        className="text-xs uppercase tracking-widest text-[#565A47] border-b border-[#565A47] pb-1 hover:text-black transition-colors"
                                    >
                                        Write Another Review
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-8"
                                >
                                    <div className="flex flex-col items-center gap-4 mb-4">
                                        <div className="flex gap-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "w-10 h-10 transition-colors",
                                                            (hoverRating || rating) >= star
                                                                ? "text-[#565A47] fill-[#565A47]"
                                                                : "text-[#8B8E7B]/30"
                                                        )}
                                                        strokeWidth={1}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative group pt-4">
                                        <textarea
                                            required
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={5}
                                            className="w-full bg-transparent border-b border-[#8B8E7B]/30 py-3 text-[#565A47] focus:outline-none focus:border-[#565A47] transition-colors peer placeholder-transparent resize-none font-light"
                                            placeholder="Your thoughts..."
                                        />
                                        <label className="absolute left-0 top-0 text-[#8B8E7B] text-xs uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#565A47]">
                                            Your Experience
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={rating === 0 || isSubmitting}
                                        className="w-full py-4 bg-[#565A47] text-[#FAF1E8] uppercase tracking-widest text-sm font-bold hover:bg-[#3f4233] transition-colors disabled:opacity-70 flex items-center justify-center gap-3 mt-4"
                                    >
                                        {isSubmitting ? "Submitting..." : "Publish Review"}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm mb-6"
                    >
                        <span className="flex gap-1">
                            {[1, 2, 3, 4].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/30" />
                        </span>
                        <span className="font-bold text-slate-800">4.3 / 5</span>
                        <span className="text-slate-400 text-sm border-l border-slate-200 pl-2">Google & Justdial</span>
                    </motion.div>

                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Loved by Guntur</h1>
                    <div className={`w-20 h-1.5 bg-gradient-to-r ${theme.gradientClass} rounded-full mx-auto mb-6`} />
                    <p className="text-slate-500 text-lg">
                        See what our customers are saying about their "{theme.brandName}" moments.
                    </p>
                </div>

                {/* Reviews Grid */}
                <div className="max-w-5xl mx-auto mb-20">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className={`w-12 h-12 border-4 ${theme.primaryColorClass.replace('bg-', 'border-')} border-t-transparent rounded-full animate-spin mb-4`} />
                            <p className="text-slate-500 font-medium">Fetching the latest reviews...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {/* Static Reviews first for established social proof */}
                            {(theme.isTeasNTrees ? reviewsData : littlehReviewsData).map((review, idx) => (
                                <motion.div
                                    key={`static-${review.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative hover:shadow-lg transition-all flex flex-col h-full"
                                >
                                    <Quote className={`absolute top-8 right-8 w-10 h-10 ${theme.textColorClass} opacity-10`} />
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 text-lg leading-relaxed mb-6 italic flex-grow">
                                        "{review.text}"
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {review.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{review.name}</h4>
                                                <span className="text-xs text-slate-400">{review.platform}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Dynamic Reviews from Backend */}
                            {dynamicReviews.map((review, idx) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: (idx + (theme.isTeasNTrees ? reviewsData.length : littlehReviewsData.length)) * 0.1 }}
                                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative hover:shadow-lg transition-all flex flex-col h-full"
                                >
                                    <Quote className={`absolute top-8 right-8 w-10 h-10 ${theme.textColorClass} opacity-10`} />
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(review.foodRating || 5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 text-lg leading-relaxed mb-6 italic flex-grow">
                                        "{review.review}"
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${theme.primaryColorClass.replace('bg-', 'bg-')}/10 flex items-center justify-center font-bold ${theme.textColorClass}`}>
                                                {(review.customerId?.name || 'Customer')[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{review.customerId?.name || 'Verified Customer'}</h4>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Internal Review Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100"
                >
                    <div className="text-center mb-8">
                        <div className={`w-14 h-14 ${theme.primaryColorClass.replace('bg-', 'bg-')}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <MessageSquarePlus className={`w-7 h-7 ${theme.textColorClass}`} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Write a Review</h2>
                        <p className="text-slate-500">Share your experience with us directly.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h3>
                                <p className="text-slate-500">Your review has been submitted successfully and will appear on our page once approved by our team.</p>
                                <button
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setRating(0);
                                        setComment('');
                                        setName('');
                                    }}
                                    className={`mt-8 ${theme.textColorClass} font-medium hover:underline`}
                                >
                                    Write another review
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {/* Star Rating Input */}
                                <div className="flex flex-col items-center gap-3 mb-6">
                                    <label className="text-sm font-medium text-slate-700">Your Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-8 h-8 transition-colors",
                                                        (hoverRating || rating) >= star
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-slate-300"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-sm text-slate-400 h-5">
                                        {rating === 1 && "Need Improvement"}
                                        {rating === 2 && "Fair"}
                                        {rating === 3 && "Good"}
                                        {rating === 4 && "Great"}
                                        {rating === 5 && "Excellent!"}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Review</label>
                                    <textarea
                                        required
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none resize-none`}
                                        placeholder="Tell us what you liked..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={rating === 0 || isSubmitting}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Submit Review</>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </div>
    );
};

export default ReviewsPage;
