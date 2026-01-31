import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';

const OrderSuccessPage = () => {
    const { orderId } = useParams();

    return (
        <div className="min-h-screen bg-cafe-emerald flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md text-center shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                    <CheckCircle className="w-12 h-12" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Placed! 🥳</h1>
                <p className="text-slate-500 mb-8">
                    Processing your delicious order. <br />
                    Order ID: <span className="font-mono font-bold text-slate-700">#{orderId?.slice(-6).toUpperCase()}</span>
                </p>

                <div className="space-y-4">
                    <Link
                        to={`/track-order/${orderId}`}
                        className="block w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        Track Order <Package className="w-5 h-5" />
                    </Link>

                    <Link
                        to="/"
                        className="block w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccessPage;
