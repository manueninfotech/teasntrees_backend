import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle all order-related WebSocket events
 * Automatically updates React Query cache on events
 */
export const useOrderEvents = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        // New order created
        const handleOrderCreated = (order) => {
            console.log('📦 New order created:', order);

            // Invalidate queries to refetch
            queryClient.invalidateQueries(['dashboard-stats']);
            queryClient.invalidateQueries(['orders']);

            // Update live orders cache
            queryClient.setQueryData(['live-orders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        orders: [order, ...(old.data?.orders || [])].slice(0, 20)
                    }
                };
            });

            // Show notification
            toast.success(`🔔 New Order #${order.orderNumber || order._id}`, {
                duration: 4000,
                icon: '🛒',
            });

            // Play notification sound (optional)
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch (error) {
                // Ignore audio errors
            }
        };

        // Order status updated
        const handleOrderStatusUpdated = ({ orderId, status, order }) => {
            console.log('📝 Order status updated:', orderId, status);

            // Invalidate stats
            queryClient.invalidateQueries(['dashboard-stats']);

            // Update orders cache
            queryClient.setQueryData(['orders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        orders: old.data?.orders?.map(o =>
                            o._id === orderId ? { ...o, status, ...order } : o
                        ) || []
                    }
                };
            });

            // Update live orders cache
            queryClient.setQueryData(['live-orders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        orders: old.data?.orders?.map(o =>
                            o._id === orderId ? { ...o, status, ...order } : o
                        ) || []
                    }
                };
            });

            toast.info(`Order status updated to ${status}`);
        };

        // Order cancelled
        const handleOrderCancelled = ({ orderId, order }) => {
            console.log('❌ Order cancelled:', orderId);

            queryClient.invalidateQueries(['dashboard-stats']);
            queryClient.invalidateQueries(['orders']);

            toast.error('Order cancelled', { icon: '❌' });
        };

        // Delivery assigned (rider assigned to order)
        const handleDeliveryAssigned = ({ orderId, riderId, rider, order }) => {
            console.log('🏍️ Rider assigned:', riderId, 'to order:', orderId);

            // Update orders cache
            queryClient.setQueryData(['orders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        orders: old.data?.orders?.map(o =>
                            o._id === orderId ? { ...o, rider, ...order } : o
                        ) || []
                    }
                };
            });

            // Update live orders cache
            queryClient.setQueryData(['live-orders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        orders: old.data?.orders?.map(o =>
                            o._id === orderId ? { ...o, rider, ...order } : o
                        ) || []
                    }
                };
            });

            toast.success(`Rider ${rider?.name || 'assigned'} assigned to order`);
        };

        // Register event listeners
        socket.on('order:created', handleOrderCreated);
        socket.on('order:new', handleOrderCreated); // Alternative event name
        socket.on('order:status-updated', handleOrderStatusUpdated);
        socket.on('order:cancelled', handleOrderCancelled);
        socket.on('delivery:assigned', handleDeliveryAssigned);

        // Cleanup
        return () => {
            socket.off('order:created', handleOrderCreated);
            socket.off('order:new', handleOrderCreated);
            socket.off('order:status-updated', handleOrderStatusUpdated);
            socket.off('order:cancelled', handleOrderCancelled);
            socket.off('delivery:assigned', handleDeliveryAssigned);
        };
    }, [socket, queryClient]);
};
