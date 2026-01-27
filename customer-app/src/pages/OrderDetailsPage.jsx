// Order Details Page
// Display full details of a specific order

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import ReviewModal from '../components/ReviewModal';
import './OrderDetailsPage.css';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        fetchOrderDetails();
    }, [isAuthenticated, orderId, navigate]);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await orderService.getOrderById(orderId);
            if (response.success && response.data) {
                console.log('Fetched Order:', response.data); // DEBUG: Check status and foodRating
                setOrder(response.data);
            } else {
                setError('Order not found');
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Failed to load order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            await orderService.cancelOrder(orderId);
            fetchOrderDetails(); // Refresh details
        } catch (err) {
            console.error('Error canceling order:', err);
            alert('Failed to cancel order');
        }
    };

    const handleReorder = async () => {
        try {
            await orderService.reorder(orderId);
            navigate('/cart');
        } catch (err) {
            console.error('Error reordering:', err);
            alert('Failed to reorder');
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const blob = await orderService.downloadInvoice(orderId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order.orderNumber || orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading invoice:', err);
            alert('Failed to download invoice');
        }
    };

    const handleReviewSubmitted = () => {
        setIsReviewModalOpen(false);
        fetchOrderDetails();
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="order-details-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-details-page">
                <div className="container">
                    <div className="error-state">
                        <p>{error || 'Order not found'}</p>
                        <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-details-page">
            <div className="container">
                {/* Header */}
                <div className="details-header">
                    <div className="header-left">
                        <Link to="/orders" className="back-link">← Back to Orders</Link>
                        <h1>Order #{order.orderNumber || order._id.slice(-6)}</h1>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                            {order.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="header-right">
                        <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                </div>

                <div className="details-content">
                    {/* Main Content: Items */}
                    <div className="details-main">
                        <div className="card items-card">
                            <h2>Items Ordered</h2>
                            <div className="items-list">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-image">
                                            {item.product?.image ? (
                                                <img src={item.product.image} alt={item.name} />
                                            ) : (
                                                <div className="placeholder-img">🍵</div>
                                            )}
                                        </div>
                                        <div className="item-info">
                                            <h3>{item.product?.name || item.name}</h3>
                                            {item.customization && (
                                                <p className="item-customization">{item.customization}</p>
                                            )}
                                            <p className="item-meta">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="item-price">
                                            ₹{((item.product?.price || item.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Timeline / Status */}
                        {/* We could add a simple timeline here if needed, or link to tracking */}
                    </div>

                    {/* Sidebar: Summary & Info */}
                    <div className="details-sidebar">
                        {/* Order Summary */}
                        <div className="card summary-card">
                            <h2>Order Summary</h2>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{(order.total - (order.deliveryCharge || 0) - (order.tax || 0)).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Fee</span>
                                <span>₹{(order.deliveryCharge || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax</span>
                                <span>₹{(order.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row total-row">
                                <span>Total</span>
                                <span>₹{order.total.toFixed(2)}</span>
                            </div>
                            <div className="payment-info">
                                <span className="payment-method">Payment: {order.paymentMethod}</span>
                                <span className={`payment-status ${order.paymentStatus}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="card address-card">
                            <h2>Delivery Details</h2>
                            <div className="address-content">
                                <p className="user-name">{user?.name}</p>
                                <p className="address-text">
                                    {order.deliveryAddress?.address || 'Address not available'}
                                </p>
                                <p className="user-phone">{user?.mobile}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="card actions-card">
                            {['assigned', 'picked_up', 'in_transit', 'out-for-delivery'].includes(order.status) && (
                                <Link to={`/delivery/${order._id}`} className="btn btn-primary full-width">
                                    Track Delivery
                                </Link>
                            )}

                            <button onClick={handleReorder} className="btn btn-outline full-width">
                                Reorder Items
                            </button>

                            {order.status === 'delivered' && (
                                <>
                                    {!order.foodRating ? (
                                        <button onClick={() => setIsReviewModalOpen(true)} className="btn btn-primary full-width">
                                            Rate Order & Rider
                                        </button>
                                    ) : (
                                        <div className="btn btn-outline full-width" style={{ cursor: 'default', opacity: 0.8, borderColor: '#10b981', color: '#10b981' }}>
                                            ✓ Review Submitted (★ {order.foodRating})
                                        </div>
                                    )}
                                    <button onClick={handleDownloadInvoice} className="btn btn-secondary full-width">
                                        Download Invoice
                                    </button>
                                </>
                            )}

                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <button onClick={handleCancelOrder} className="btn btn-danger-outline full-width">
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    type="order"
                    orderId={order._id}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            </div>
        </div>
    );
};

export default OrderDetailsPage;
