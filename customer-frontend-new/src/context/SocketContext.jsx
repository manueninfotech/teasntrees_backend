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
        let newSocket;

        if (isAuthenticated && token) {
            // Dynamically extract brand from URL path
            const pathSegments = window.location.pathname.split('/');
            const activeBrand = pathSegments[1] || 'teasntrees';

            // Initialize Socket
            // Force 'polling' to allow traffic through the Vercel proxy
            // Connect to '/' (current origin) to use the vercel.json rewrites
            newSocket = io('/', {
                auth: { token, brand: activeBrand },
                transports: ['websocket', 'polling'],
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
