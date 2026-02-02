import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle all rider-related WebSocket events
 */
export const useRiderEvents = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        // Rider status updated (approved/suspended)
        const handleRiderStatusUpdated = ({ riderId, status, isApproved, isActive }) => {
            console.log('🏍️ Rider status updated:', riderId, status);

            queryClient.invalidateQueries(['riders']);
            queryClient.invalidateQueries(['dashboard-stats']);

            toast.success(`Rider ${status || 'updated'}`);
        };

        // Rider availability changed (online/offline/busy)
        const handleRiderAvailabilityChanged = ({ riderId, isAvailable, status }) => {
            console.log('🏍️ Rider availability changed:', riderId, isAvailable);

            // Update riders cache
            queryClient.setQueryData(['riders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data?.map(r =>
                        r._id === riderId ? { ...r, isAvailable, status } : r
                    ) || []
                };
            });
        };

        // Rider location update (for live tracking)
        const handleRiderLocationUpdate = ({ riderId, location }) => {
            console.log('📍 Rider location updated:', riderId, location);

            // Update riders cache with new location
            queryClient.setQueryData(['riders'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data?.map(r =>
                        r._id === riderId ? { ...r, currentLocation: location } : r
                    ) || []
                };
            });
        };

        // Rider online
        const handleRiderOnline = ({ riderId, rider }) => {
            console.log('🟢 Rider online:', riderId);
            queryClient.invalidateQueries(['riders']);
            queryClient.invalidateQueries(['dashboard-stats']);
        };

        // Rider offline
        const handleRiderOffline = ({ riderId }) => {
            console.log('🔴 Rider offline:', riderId);
            queryClient.invalidateQueries(['riders']);
            queryClient.invalidateQueries(['dashboard-stats']);
        };

        // Register event listeners
        socket.on('rider:status-updated', handleRiderStatusUpdated);
        socket.on('rider:availability-changed', handleRiderAvailabilityChanged);
        socket.on('rider:location-update', handleRiderLocationUpdate);
        socket.on('rider:online', handleRiderOnline);
        socket.on('rider:offline', handleRiderOffline);

        // Cleanup
        return () => {
            socket.off('rider:status-updated', handleRiderStatusUpdated);
            socket.off('rider:availability-changed', handleRiderAvailabilityChanged);
            socket.off('rider:location-update', handleRiderLocationUpdate);
            socket.off('rider:online', handleRiderOnline);
            socket.off('rider:offline', handleRiderOffline);
        };
    }, [socket, queryClient]);
};
