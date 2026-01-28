// Delivery Tracking Page
// Track delivery status and location

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import deliveryService from '../services/deliveryService';
import { useSocket } from '../context/SocketContext';
import './DeliveryTrackingPage.css';

const DeliveryTrackingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { orderId, deliveryId } = useParams();

    const [delivery, setDelivery] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchId, setSearchId] = useState('');
    const { socket } = useSocket();
    const [riderLocation, setRiderLocation] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const fetchData = (isBackground = false) => {
            if (deliveryId) {
                fetchDeliveryById(isBackground);
            } else if (orderId) {
                fetchDeliveryByOrder(isBackground);
            } else {
                fetchMyDeliveries(isBackground);
            }
        };

        fetchData();

        // 15s polling fallback (background refresh)
        const interval = setInterval(() => fetchData(true), 15000);
        return () => clearInterval(interval);
    }, [isAuthenticated, orderId, deliveryId, navigate]);

    // Setup real-time listeners
    useEffect(() => {
        if (socket && delivery?.order?._id) {
            const currentOrderId = delivery.order._id;

            // Join the order room for private updates (like rider location)
            socket.emit('order:join', currentOrderId);

            const handleDeliveryUpdate = (data) => {
                const updatedDeliveryId = data.deliveryId || (data.orderId === currentOrderId ? delivery._id : null);
                if (updatedDeliveryId === delivery._id || data.orderId === currentOrderId) {
                    console.log('Real-time delivery update:', data);
                    // Refresh delivery data
                    if (deliveryId) fetchDeliveryById(true); // Background refresh
                    else if (orderId) fetchDeliveryByOrder(true); // Background refresh
                    else fetchMyDeliveries(true); // Background refresh
                }
            };

            const handleRiderLocation = (data) => {
                if (data.orderId === currentOrderId) {
                    console.log('Real-time rider location:', data.location);
                    setRiderLocation(data.location);
                }
            };

            socket.on('delivery:status-updated', handleDeliveryUpdate);
            socket.on('order:status-updated', handleDeliveryUpdate);
            socket.on('rider:location-update', handleRiderLocation);

            return () => {
                socket.off('delivery:status-updated', handleDeliveryUpdate);
                socket.off('order:status-updated', handleDeliveryUpdate);
                socket.off('rider:location-update', handleRiderLocation);
            };
        }
    }, [socket, delivery?._id, delivery?.order?._id]);

    const fetchDeliveryById = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        setError('');

        try {
            const response = await deliveryService.trackDelivery(deliveryId);

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

    const fetchDeliveryByOrder = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
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

    const fetchMyDeliveries = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
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

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        // Simple heuristic: if it starts with 'DEL-', assume delivery ID
        // Otherwise assume Order ID
        // Real logic could be handled by backend or trying both
        if (searchId.trim().toUpperCase().startsWith('DEL')) {
            navigate(`/delivery/track/${searchId.trim()}`);
        } else {
            navigate(`/delivery/${searchId.trim()}`);
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
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="tracking-search">
                        <input
                            type="text"
                            placeholder="Enter Order ID or Delivery ID"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="search-input"
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSearch}
                        >
                            Track
                        </button>
                    </form>
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
                        {delivery.deliveryOtp && (
                            <div className="delivery-otp-container tracking-otp">
                                <p className="otp-label">Delivery Verification OTP</p>
                                <h3 className="otp-value">{delivery.deliveryOtp}</h3>
                                <p className="otp-hint">Provide this to the rider when you receive your order</p>
                            </div>
                        )}
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
