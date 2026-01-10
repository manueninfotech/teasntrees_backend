import { SOCKET_EVENTS, SOCKET_ROOMS } from '../sockets/socketEvents.js';

/**
 * Socket Service - Helper class for emitting socket events
 */
export class SocketService {
    constructor(io) {
        this.io = io;
    }

    /**
     * Notify a specific user
     */
    notifyUser(userId, event, data) {
        this.io.to(SOCKET_ROOMS.user(userId)).emit(event, {
            ...data,
            timestamp: new Date()
        });
    }

    /**
     * Notify all users of a specific role
     */
    notifyRole(role, event, data) {
        this.io.to(SOCKET_ROOMS.role(role)).emit(event, {
            ...data,
            timestamp: new Date()
        });
    }

    /**
     * Notify all participants in an order
     */
    notifyOrder(orderId, event, data) {
        this.io.to(SOCKET_ROOMS.order(orderId)).emit(event, {
            ...data,
            timestamp: new Date()
        });
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date()
        });
    }

    /**
     * Join a user to an order room
     */
    joinOrderRoom(userId, orderId) {
        const socketId = this.getUserSocket(userId);
        if (socketId) {
            socketId.join(SOCKET_ROOMS.order(orderId));
        }
    }

    /**
     * Get user's socket by userId
     */
    getUserSocket(userId) {
        const sockets = this.io.sockets.sockets;
        for (const [id, socket] of sockets) {
            if (socket.user && socket.user.userId === userId) {
                return socket;
            }
        }
        return null;
    }
}
