// Orders Page
// Display user's order history with backend integration

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import ReviewModal from '../components/ReviewModal';
import { useSocket } from '../context/SocketContext';
import './OrdersPage.css';

const OrdersPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const { socket } = useSocket();

    useEffect(() => {
        console.log('[OrdersPage] Checking socket...', { socketExists: !!socket });
        if (socket) {
            console.log('[OrdersPage] Setting up socket listeners');
            socket.on('order:status-updated', (data) => {
                console.log('Order status updated:', data);
                fetchOrders(true); // Background refresh
            });

            socket.on('delivery:status-updated', (data) => {
                console.log('Delivery status updated:', data);
                fetchOrders(true); // Background refresh
            });

            socket.on('order:rider-assigned', (data) => {
                console.log('Rider assigned to order:', data);
                fetchOrders(true); // Background refresh
            });

            socket.on('order:created', () => {
                fetchOrders(true); // Background refresh
            });

            // Re-fetch on reconnect to ensure sync
            const handleConnect = () => {
                console.log('Socket reconnected, fetching orders...');
                fetchOrders(true); // Background refresh
            };
            socket.on('connect', handleConnect);

            return () => {
                socket.off('order:status-updated');
                socket.off('delivery:status-updated');
                socket.off('order:rider-assigned');
                socket.off('order:created');
                socket.off('connect', handleConnect);
            };
        }
    }, [socket]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        fetchOrders();

        // 60s polling fallback (background refresh)
        const interval = setInterval(() => fetchOrders(true), 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated, navigate]);

    const fetchOrders = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        setError('');

        try {
            const response = await orderService.getMyOrders();

            if (response.success && response.data) {
                setOrders(response.data.orders || response.data || []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            await orderService.cancelOrder(orderId);
            // Refresh orders list
            fetchOrders();
        } catch (err) {
            console.error('Error canceling order:', err);
            alert('Failed to cancel order. Please try again.');
        }
    };

    const handleReviewSubmitted = () => {
        setIsReviewModalOpen(false);
        fetchOrders();
    };

    const handleOpenReview = (product, orderId) => {
        setSelectedProduct(product);
        setSelectedOrderId(orderId);
        setIsReviewModalOpen(true);
    };

    const handleReorder = async (orderId) => {
        try {
            await orderService.reorder(orderId);
            navigate('/cart');
        } catch (err) {
            console.error('Error reordering:', err);
            alert('Failed to reorder. Please try again.');
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const blob = await orderService.downloadInvoice(orderId);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading invoice:', err);
            alert('Failed to download invoice. Please try again.');
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'pending': 'badge-warning',
            'confirmed': 'badge-info',
            'accepted': 'badge-info',
            'preparing': 'badge-info',
            'ready': 'badge-info',
            'assigned': 'badge-primary',
            'picked_up': 'badge-primary',
            'out-for-delivery': 'badge-primary',
            'in_transit': 'badge-primary',
            'delivered': 'badge-success',
            'cancelled': 'badge-error'
        };
        return statusMap[status] || 'badge-default';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="orders-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your orders...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="container">
                <div className="orders-header">
                    <h1>My Orders</h1>
                    <p>Track and manage your orders</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {orders.length === 0 ? (
                    <div className="empty-state">
                        <p>No orders yet</p>
                        <button className="btn btn-primary" onClick={() => navigate('/menu')}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3>Order #{order.orderNumber || order._id.slice(-6)}</h3>
                                        <p className="order-date">{formatDate(order.createdAt)}</p>
                                    </div>
                                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="order-items">
                                    {order.items?.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="item-main">
                                                <span className="item-name">
                                                    {item.product?.name || item.name} x {item.quantity}
                                                </span>
                                                <span className="item-price">
                                                    ₹{((item.product?.price || item.price) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                            {order.status === 'delivered' && (
                                                <button
                                                    className="rate-btn"
                                                    onClick={() => handleOpenReview(item.product, order._id)}
                                                >
                                                    Rate Product
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        <span>Total:</span>
                                        <strong>₹{order.total?.toFixed(2)}</strong>
                                    </div>

                                    <div className="order-actions">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                        >
                                            View Details
                                        </button>

                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => handleCancelOrder(order._id)}
                                            >
                                                Cancel Order
                                            </button>
                                        )}

                                        {['assigned', 'picked_up', 'in_transit', 'out-for-delivery'].includes(order.status) && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => navigate(`/delivery/${order._id}`)}
                                            >
                                                Track Order
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleReorder(order._id)}
                                        >
                                            Reorder
                                        </button>

                                        {order.status === 'delivered' && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleDownloadInvoice(order._id)}
                                            >
                                                Download Invoice
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Review Modal */}
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    product={selectedProduct}
                    orderId={selectedOrderId}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            </div>
        </div>
    );
};

export default OrdersPage;
