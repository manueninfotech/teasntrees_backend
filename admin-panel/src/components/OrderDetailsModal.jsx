import { useState } from 'react';
import { X, User, MapPin, Package, DollarSign, Bike, Calendar, Phone, Mail } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import api from '../utils/api';

export default function OrderDetailsModal({ isOpen, onClose, order, onSuccess }) {
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [newPaymentStatus, setNewPaymentStatus] = useState('');
    const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);

    if (!isOpen || !order) return null;

    const statusOptions = [
        'pending', 'confirmed', 'preparing', 'ready', 'assigned',
        'picked_up', 'out-for-delivery', 'in_transit', 'delivered'
    ];

    const handleUpdateStatus = async () => {
        if (!newStatus) return;

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/status`, { status: newStatus });
            onSuccess();
            setShowStatusUpdate(false);
            setNewStatus('');
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a cancellation reason');
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/cancel`, { cancelReason });
            onSuccess();
            setShowCancelModal(false);
            setCancelReason('');
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!newPaymentStatus) return;

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/payment-status`, { paymentStatus: newPaymentStatus });
            onSuccess();
            setShowPaymentUpdate(false);
            setNewPaymentStatus('');
        } catch (error) {
            console.error('Failed to update payment status:', error);
            alert(error.response?.data?.message || 'Failed to update payment status');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                        <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status and Actions */}
                    <div className="flex items-center justify-between">
                        <OrderStatusBadge status={order.status} />
                        <div className="flex gap-2">
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <>
                                    <button
                                        onClick={() => setShowStatusUpdate(true)}
                                        className="btn-secondary text-sm"
                                    >
                                        Update Status
                                    </button>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                                    >
                                        Cancel Order
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{order.customerId?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Mobile</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {order.customerId?.mobile || 'N/A'}
                                </p>
                            </div>
                            {order.customerId?.email && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {order.customerId.email}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                        </div>
                        <p className="text-gray-700">{order.deliveryAddress?.address || 'N/A'}</p>
                        {order.specialInstructions && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                                <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Order Items</h3>
                        </div>
                        <div className="space-y-3">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-lg">
                                    {item.product?.image && (
                                        <img
                                            src={item.product.image}
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        {item.customization && (
                                            <p className="text-sm text-gray-500">{item.customization}</p>
                                        )}
                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Pricing Details</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">₹{order.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Delivery Charge</span>
                                <span className="font-medium">₹{order.deliveryCharge || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium">₹{order.tax || 0}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg text-green-600">₹{order.total}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-600">Payment Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'refunded' ? 'text-red-600' : 'text-orange-600'}`}>
                                        {order.paymentStatus}
                                    </span>
                                    {order.status !== 'cancelled' && (
                                        <button
                                            onClick={() => setShowPaymentUpdate(true)}
                                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                        >
                                            Update
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rider Information */}
                    {order.riderId && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Bike className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Delivery Rider</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-medium">{order.riderId?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Mobile</p>
                                    <p className="font-medium">{order.riderId?.mobile || 'N/A'}</p>
                                </div>
                                {order.riderEarning && (
                                    <div>
                                        <p className="text-sm text-gray-500">Rider Earning</p>
                                        <p className="font-medium">₹{order.riderEarning}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Timeline</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order Placed</span>
                                <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                            {order.confirmedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Confirmed</span>
                                    <span className="font-medium">{new Date(order.confirmedAt).toLocaleString()}</span>
                                </div>
                            )}
                            {order.outForDeliveryAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Out for Delivery</span>
                                    <span className="font-medium">{new Date(order.outForDeliveryAt).toLocaleString()}</span>
                                </div>
                            )}
                            {order.deliveredAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivered</span>
                                    <span className="font-medium">{new Date(order.deliveredAt).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {showStatusUpdate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Update Order Status</h3>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="input mb-4"
                            >
                                <option value="">Select new status</option>
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowStatusUpdate(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={updating || !newStatus}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Order Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Cancel Order</h3>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation..."
                                className="input resize-none mb-4"
                                rows="3"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={updating}
                                    className="flex-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {updating ? 'Cancelling...' : 'Cancel Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Status Update Modal */}
                {showPaymentUpdate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Update Payment Status</h3>
                            <select
                                value={newPaymentStatus}
                                onChange={(e) => setNewPaymentStatus(e.target.value)}
                                className="input mb-4"
                            >
                                <option value="">Select payment status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowPaymentUpdate(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePaymentStatus}
                                    disabled={updating || !newPaymentStatus}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
