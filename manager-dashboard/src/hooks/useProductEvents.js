import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle all product-related WebSocket events
 */
export const useProductEvents = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        // Product updated (availability or other fields changed)
        const handleProductUpdated = ({ productId, product, isAvailable }) => {
            console.log('📦 Product updated:', productId);

            // Update products cache
            queryClient.setQueryData(['products'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        products: old.data?.products?.map(p =>
                            p._id === productId ? { ...p, ...product, isAvailable } : p
                        ) || []
                    }
                };
            });

            // Invalidate dashboard stats (low stock might have changed)
            queryClient.invalidateQueries(['dashboard-stats']);

            toast.info('Product updated');
        };

        // Product created
        const handleProductCreated = (product) => {
            console.log('✨ New product created:', product);

            queryClient.invalidateQueries(['products']);
            toast.success(`New product: ${product.name}`);
        };

        // Product deleted
        const handleProductDeleted = ({ productId }) => {
            console.log('🗑️ Product deleted:', productId);

            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['dashboard-stats']);
        };

        // Register event listeners
        socket.on('product:updated', handleProductUpdated);
        socket.on('product:created', handleProductCreated);
        socket.on('product:deleted', handleProductDeleted);

        // Cleanup
        return () => {
            socket.off('product:updated', handleProductUpdated);
            socket.off('product:created', handleProductCreated);
            socket.off('product:deleted', handleProductDeleted);
        };
    }, [socket, queryClient]);
};
