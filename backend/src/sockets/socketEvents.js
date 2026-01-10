/**
 * Socket.io event names
 * Centralized event definitions for consistency
 */
export const SOCKET_EVENTS = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // Order events
    ORDER_CREATED: 'order:created',
    ORDER_STATUS_UPDATED: 'order:status-updated',
    ORDER_CANCELLED: 'order:cancelled',
    ORDER_NEW: 'order:new', // For managers/admin

    // Delivery events
    DELIVERY_ASSIGNED: 'delivery:assigned',
    DELIVERY_ACCEPTED: 'delivery:accepted',
    DELIVERY_REJECTED: 'delivery:rejected',
    DELIVERY_PICKED_UP: 'delivery:picked-up',
    DELIVERY_IN_TRANSIT: 'delivery:in-transit',
    DELIVERY_DELIVERED: 'delivery:delivered',

    // Rider events
    RIDER_LOCATION_UPDATE: 'rider:location-update',
    RIDER_AVAILABILITY_CHANGED: 'rider:availability-changed',
    RIDER_ONLINE: 'rider:online',
    RIDER_OFFLINE: 'rider:offline',

    // Notification events
    NOTIFICATION_NEW: 'notification:new',
    NOTIFICATION_READ: 'notification:read',

    // System events
    SYSTEM_MESSAGE: 'system:message'
};

/**
 * Socket.io room names
 */
export const SOCKET_ROOMS = {
    // User-specific rooms
    user: (userId) => `user:${userId}`,

    // Role-based rooms
    role: (role) => `role:${role}`,

    // Order-specific rooms
    order: (orderId) => `order:${orderId}`,

    // General rooms
    all: 'all'
};
