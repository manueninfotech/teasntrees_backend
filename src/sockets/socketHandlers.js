import mongoose from 'mongoose';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './socketEvents.js';

/**
 * May this socket listen in on this order?
 *
 * `order:join` used to join whatever id it was handed, with no check at all — so
 * any authenticated user could join ANY order's room and receive everything
 * broadcast to it, including the live GPS of the rider delivering someone else's
 * food. Order ids are ObjectIds: semi-predictable, and freely known to anyone
 * who has ever seen one.
 *
 * A customer may follow their own orders; the assigned rider may follow theirs;
 * staff may follow anything.
 */
const canAccessOrder = async (orderId, user) => {
    if (!mongoose.isValidObjectId(orderId)) return false;

    const { userId, role } = user;

    if (role === 'admin' || role === 'manager') return true;

    if (role === 'rider') {
        const Delivery = mongoose.model('Delivery');
        return !!(await Delivery.exists({ orderId, riderId: userId }));
    }

    const Order = mongoose.model('Order');
    return !!(await Order.exists({ _id: orderId, customerId: userId }));
};

/**
 * Setup Socket.io event handlers
 */
export const setupSocketHandlers = (io) => {
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        const { userId, role, name, brand } = socket.user;
        console.log(`🔌 User ${name} (${role}) connected to Brand: ${brand}`);

        // Join user-specific room
        socket.join(SOCKET_ROOMS.user(userId));

        // Join brand-specific role room (CRITICAL for brand isolation)
        socket.join(SOCKET_ROOMS.brandRole(brand, role));

        // Also join legacy global role room for now to avoid breaking existing logic elsewhere
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
        socket.on('order:join', async (orderId) => {
            if (!orderId) return;
            try {
                if (!(await canAccessOrder(orderId, socket.user))) {
                    console.warn(
                        `Blocked order:join — user ${userId} (${role}) tried to follow order ${orderId}`
                    );
                    socket.emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
                        message: 'Not allowed to follow that order',
                        timestamp: new Date()
                    });
                    return;
                }
                socket.join(SOCKET_ROOMS.order(orderId));
            } catch (err) {
                console.error('order:join check failed:', err.message);
            }
        });

        // Leaving needs no check — you can only leave a room you're in.
        socket.on('order:leave', (orderId) => {
            if (orderId) {
                socket.leave(SOCKET_ROOMS.order(orderId));
            }
        });

        // Handle disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            // If rider, notify managers they went offline
            if (role === 'rider') {
                io.to(SOCKET_ROOMS.role('manager'))
                    .to(SOCKET_ROOMS.role('admin'))
                    .emit(SOCKET_EVENTS.RIDER_OFFLINE, {
                        riderId: userId,
                        name: name, // Add name for optimistic UI updates
                        timestamp: new Date()
                    });
            }
        });

        // ... existing error handler ...
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
    socket.on(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, async (data) => {
        const { orderId, location } = data;
        if (!orderId) return;

        try {
            // The orderId came from the rider's own socket and was broadcast
            // unchecked, so a rider could push their GPS into an order they were
            // never assigned to — and the customer watching that order would see
            // a stranger's bike moving on their map.
            const Delivery = mongoose.model('Delivery');
            if (!mongoose.isValidObjectId(orderId)) return;
            const assigned = await Delivery.exists({ orderId, riderId: userId });
            if (!assigned) {
                console.warn(
                    `Blocked rider:location — rider ${userId} is not assigned to order ${orderId}`
                );
                return;
            }

            io.to(SOCKET_ROOMS.order(orderId)).emit(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, {
                riderId: userId,
                orderId,
                location,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('rider location broadcast failed:', err.message);
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
            name: socket.user.name, // Add name
            isOnline: true,
            timestamp: new Date()
        });
};

/**
 * Handle manager-specific socket events
 */
const handleManagerEvents = (socket, io) => {
    // Managers might have specific events in the future
};
