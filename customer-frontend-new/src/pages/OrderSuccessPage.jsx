import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderService } from '../services/orderService';
import { CheckCircle, Package, ArrowRight, Home, Loader2 } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const { brand, theme } = useBrand();
    const [order, setOrder] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;

            try {
                const data = await orderService.getOrderById(orderId);
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
                // Fallback: We just show the ID from URL if fetch fails
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    return (
        <div className={`min-h-screen ${theme.isLittleH ? 'bg-[#FAF1E8]' : 'bg-cafe-emerald'} flex items-center justify-center p-4`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md text-center shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className={`absolute top-0 left-0 w-full h-2 ${theme.isLittleH ? 'bg-gradient-to-r from-[#565A47] to-[#8B8E7B]' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} />

                <div className={`w-24 h-24 ${theme.isLittleH ? 'bg-[#FDF5EC] text-[#565A47]' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto mb-8`}>
                    <CheckCircle className="w-12 h-12" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Placed! 🥳</h1>
                <p className="text-slate-500 mb-8">
                    Processing your delicious order. <br />
                    Order ID:
                    <span className="font-mono font-bold text-slate-700 ml-2">
                        {loading ? (
                            <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin align-middle" />
                        ) : (
                            `#${order?.orderNumber || orderId?.slice(-6).toUpperCase()}`
                        )}
                    </span>
                </p>

                <div className="space-y-4">
                    <Link
                        to={`/${brand}/track-order/${orderId}`}
                        className="block w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        Track Order <Package className="w-5 h-5" />
                    </Link>

                    <Link
                        to={`/${brand || 'teasntrees'}`}
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
