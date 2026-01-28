import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log('[SocketProvider] Auth State Changed:', { isAuthenticated });
        let newSocket = null;

        if (isAuthenticated) {
            const token = localStorage.getItem('auth_token');
            console.log('[SocketProvider] Attempting connection with token:', token ? 'Found' : 'Missing');

            if (!token) return;

            newSocket = io('http://localhost:5000', {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
                console.log('Customer App: Connected to Real-time Server');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Customer App: Disconnected from Real-time Server');
                setIsConnected(false);
            });

            newSocket.on('error', (error) => {
                console.error('Socket Error:', error);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket Connection Error:', err.message);
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
