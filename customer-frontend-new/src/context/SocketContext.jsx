import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Socket.io should connect to the base origin, not the /api namespace
        const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

        let newSocket;

        if (isAuthenticated && token) {
            // Initialize Socket
            newSocket = io(BACKEND_URL, {
                auth: { token },
                transports: ['websocket'], // force websocket for performance
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            // Event Listeners
            newSocket.on('connect', () => {
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('[Socket] Connection Error:', err.message);
                setIsConnected(false);
            });

            setSocket(newSocket);
        } else {

            // If user logs out, disconnect existing socket
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }

        // Cleanup on unmount or token change
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
