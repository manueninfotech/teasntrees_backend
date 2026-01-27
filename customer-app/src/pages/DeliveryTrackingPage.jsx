// Delivery Tracking Page
// Track delivery status and location

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import deliveryService from '../services/deliveryService';
import './DeliveryTrackingPage.css';

const DeliveryTrackingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [delivery, setDelivery] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        if (orderId) {
            fetchDeliveryByOrder();
        } else {
            fetchMyDeliveries();
        }
    }, [isAuthenticated, orderId, navigate]);

    const fetchDeliveryByOrder = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await deliveryService.getDeliveryByOrder(orderId);

            if (response.success && response.data) {
                setDelivery(response.data);
            }
        } catch (err) {
            console.error('Error fetching delivery:', err);
            setError('Failed to load delivery information');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyDeliveries = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await deliveryService.getMyDeliveries();

            if (response.success && response.data) {
                const deliveries = response.data.deliveries || response.data || [];
                setDelivery(deliveries[0]); // Show most recent delivery
            }
        } catch (err) {
            console.error('Error fetching deliveries:', err);
            setError('Failed to load deliveries');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'pending': { label: 'Pending', color: '#f59e0b', icon: '⏳' },
            'assigned': { label: 'Assigned', color: '#3b82f6', icon: '👤' },
            'picked_up': { label: 'Picked Up', color: '#8b5cf6', icon: '📦' },
            'in_transit': { label: 'In Transit', color: '#6366f1', icon: '🚚' },
            'delivered': { label: 'Delivered', color: '#10b981', icon: '✅' },
            'cancelled': { label: 'Cancelled', color: '#ef4444', icon: '❌' }
        };
        return statusMap[status] || statusMap['pending'];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="delivery-tracking-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading delivery information...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !delivery) {
        return (
            <div className="delivery-tracking-page">
                <div className="container">
                    <div className="error-state">
                        <p>{error || 'No delivery information found'}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                            View Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(delivery.status);

    return (
        <div className="delivery-tracking-page">
            <div className="container">
                <div className="tracking-header">
                    <h1>Track Delivery</h1>
                    <div className="tracking-ids">
                        <span className="order-no">Order #{delivery.order?.orderNumber || delivery.order?._id?.slice(-6)}</span>
                        {delivery.deliveryNumber && (
                            <span className="delivery-no">Delivery: {delivery.deliveryNumber}</span>
                        )}
                    </div>
                </div>

                <div className="tracking-content">
                    {/* Current Status Card */}
                    <div className="status-card">
                        <div className="status-icon" style={{ backgroundColor: statusInfo.color }}>
                            {statusInfo.icon}
                        </div>
                        <h2>{statusInfo.label}</h2>
                        <p className="status-time">
                            Updated: {formatDate(delivery.updatedAt)}
                        </p>
                    </div>

                    {/* Delivery Details */}
                    <div className="delivery-details">
                        <h3>Delivery Information</h3>

                        <div className="detail-row">
                            <span className="detail-label">Delivery Address:</span>
                            <span className="detail-value">
                                {delivery.deliveryAddress?.address ||
                                    (typeof delivery.deliveryAddress === 'string' ? delivery.deliveryAddress : 'N/A')}
                            </span>
                        </div>

                        {delivery.rider && (
                            <>
                                <div className="detail-row">
                                    <span className="detail-label">Rider Name:</span>
                                    <span className="detail-value">{delivery.rider.name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Rider Phone:</span>
                                    <span className="detail-value">{delivery.rider.mobile}</span>
                                </div>
                            </>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Estimated Delivery:</span>
                            <span className="detail-value">
                                {delivery.estimatedArrival !== null
                                    ? `In approx. ${delivery.estimatedArrival} mins`
                                    : formatDate(delivery.estimatedDeliveryTime)}
                            </span>
                        </div>

                        {delivery.actualDeliveryTime && (
                            <div className="detail-row">
                                <span className="detail-label">Delivered At:</span>
                                <span className="detail-value">
                                    {formatDate(delivery.actualDeliveryTime)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="delivery-timeline">
                        <h3>Delivery Timeline</h3>
                        <div className="timeline">
                            {delivery.statusHistory && delivery.statusHistory.length > 0 ? (
                                delivery.statusHistory.map((item, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <strong>{getStatusInfo(item.status).label}</strong>
                                            <p>{formatDate(item.timestamp)}</p>
                                            {item.notes && <p className="timeline-notes">{item.notes}</p>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-timeline">Waiting for rider updates...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTrackingPage;
