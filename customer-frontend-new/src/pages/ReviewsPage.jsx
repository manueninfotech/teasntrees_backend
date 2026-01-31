import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, MessageSquarePlus, Quote, ThumbsUp, Send, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const reviews = [
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

const ReviewsPage = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) return;

        // Simulate API call
        setTimeout(() => {
            setIsSubmitted(true);
            // Reset after showing success message for a while if needed, or keep it.
        }, 1000);
    };

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
                    <div className="w-20 h-1.5 bg-gradient-to-r from-cafe-emerald to-cafe-teal rounded-full mx-auto mb-6" />
                    <p className="text-slate-500 text-lg">
                        See what our customers are saying about their "LittleH" moments at Teas N Trees.
                    </p>
                </div>

                {/* Reviews Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative hover:shadow-lg transition-all"
                        >
                            <Quote className="absolute top-8 right-8 w-10 h-10 text-cafe-emerald/10" />

                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>

                            <p className="text-slate-600 text-lg leading-relaxed mb-6 italic">
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
                                <div className="flex items-center gap-1 text-slate-400 text-sm">
                                    <ThumbsUp className="w-4 h-4" /> Helpful
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Internal Review Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100"
                >
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-cafe-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquarePlus className="w-7 h-7 text-cafe-emerald" />
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
                                <p className="text-slate-500">Your review has been submitted successfully.</p>
                                <button
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setRating(0);
                                        setComment('');
                                        setName('');
                                    }}
                                    className="mt-8 text-cafe-emerald font-medium hover:underline"
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
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cafe-emerald focus:ring-2 focus:ring-cafe-emerald/20 transition-all outline-none"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Review</label>
                                    <textarea
                                        required
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cafe-emerald focus:ring-2 focus:ring-cafe-emerald/20 transition-all outline-none resize-none"
                                        placeholder="Tell us what you liked..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={rating === 0}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" /> Submit Review
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
