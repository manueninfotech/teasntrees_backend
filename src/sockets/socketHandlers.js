import { SOCKET_EVENTS, SOCKET_ROOMS } from './socketEvents.js';

/**
 * Setup Socket.io event handlers
 */
export const setupSocketHandlers = (io) => {
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        const { userId, role, name } = socket.user;

        console.log(`Socket connected: ${name} (${userId}) - Role: ${role}`);

        // Join user-specific room
        socket.join(SOCKET_ROOMS.user(userId));

        // Join role-based room
        socket.join(SOCKET_ROOMS.role(role));

        // Notify user of successful connection
        socket.emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
            message: 'Connected to real-time server',
            role,
            timestamp: new Date()
        });

        // Handle rider-specific events
        if (role === 'rider') {
            handleRiderEvents(socket, io);
        }

        // Handle manager-specific events
        if (role === 'manager') {
            handleManagerEvents(socket, io);
        }

        // --- NEW: Common Order Events ---
        socket.on('order:join', (orderId) => {
            if (orderId) {
                socket.join(SOCKET_ROOMS.order(orderId));
                console.log(`User ${userId} joined order room: ${orderId}`);
            }
        });

        socket.on('order:leave', (orderId) => {
            if (orderId) {
                socket.leave(SOCKET_ROOMS.order(orderId));
                console.log(`User ${userId} left order room: ${orderId}`);
            }
        });

        // Handle disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            console.log(`Socket disconnected: ${name} (${userId})`);

            // If rider, notify managers they went offline
            if (role === 'rider') {
                io.to(SOCKET_ROOMS.role('manager'))
                    .to(SOCKET_ROOMS.role('admin'))
                    .emit(SOCKET_EVENTS.RIDER_OFFLINE, {
                        riderId: userId,
                        timestamp: new Date()
                    });
            }
        });

        // Handle errors
        socket.on(SOCKET_EVENTS.ERROR, (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });
};

/**
 * Handle rider-specific socket events
 */
const handleRiderEvents = (socket, io) => {
    const { userId } = socket.user;

    // Rider updates their location
    socket.on(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, (data) => {
        const { orderId, location } = data;

        // Broadcast location to customer and managers
        if (orderId) {
            io.to(SOCKET_ROOMS.order(orderId)).emit(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, {
                riderId: userId,
                orderId,
                location,
                timestamp: new Date()
            });
        }
    });

    // Rider changes availability
    socket.on(SOCKET_EVENTS.RIDER_AVAILABILITY_CHANGED, (data) => {
        const { isAvailable } = data;

        // Notify managers and admin
        io.to(SOCKET_ROOMS.role('manager'))
            .to(SOCKET_ROOMS.role('admin'))
            .emit(SOCKET_EVENTS.RIDER_AVAILABILITY_CHANGED, {
                riderId: userId,
                isAvailable,
                timestamp: new Date()
            });
    });

    // Notify managers/admin that rider is online
    io.to(SOCKET_ROOMS.role('manager'))
        .to(SOCKET_ROOMS.role('admin'))
        .emit(SOCKET_EVENTS.RIDER_ONLINE, {
            riderId: userId,
            timestamp: new Date()
        });
};

/**
 * Handle manager-specific socket events
 */
const handleManagerEvents = (socket, io) => {
    // Managers might have specific events in the future
    console.log(`Manager socket events initialized for ${socket.user.userId}`);
};
