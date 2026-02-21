import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SocketListener = () => {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;


        const handleStatusUpdate = (data) => {

            // Don't show toast if we are already on the tracking page for this order?
            // Actually, showing a toast is always good feedback.

            const statusMap = {
                'confirmed': 'Order Confirmed! 👨‍🍳',
                'preparing': 'Kitchen is preparing your order 🍳',
                'ready': 'Order is Ready! 🥡',
                'assigned': 'Rider assigned to your order 🛵',
                'pending_acceptance': 'Assigning a rider to your order 🛵',
                'picked_up': 'Rider has picked up your order 📦',
                'out-for-delivery': 'Order is Out for Delivery 🚀',
                'delivered': 'Order Delivered! Enjoy 😋',
                'cancelled': 'Order Cancelled ❌'
            };

            const msg = statusMap[data.status] || `Order status: ${data.status}`;

            toast(msg, {
                icon: '🔔',
                duration: 5000,
                style: {
                    borderRadius: '12px',
                    background: '#fff',
                    color: '#333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                },
            });
        };

        const handleDeliveryAssigned = (data) => {
            toast(`Rider ${data.riderName || ''} assigned!`, { icon: '🛵' });
        };

        socket.on('order:status-updated', handleStatusUpdate);
        socket.on('order:rider-assigned', handleDeliveryAssigned);
        socket.on('delivery:assigned', handleDeliveryAssigned); // Legacy support
        socket.on('system:data-updated', () => {
            queryClient.invalidateQueries();
        });

        return () => {
            socket.off('order:status-updated', handleStatusUpdate);
            socket.off('order:rider-assigned', handleDeliveryAssigned);
            socket.off('delivery:assigned', handleDeliveryAssigned);
            socket.off('system:data-updated');
        };
    }, [socket, queryClient]);

    return null; // Logic only component
};

export default SocketListener;
