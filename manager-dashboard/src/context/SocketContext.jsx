import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, token, isAuthenticated } = useAuth();

    useEffect(() => {
        // Only connect if authenticated
        if (!isAuthenticated || !token || !user) {
            // Disconnect if not authenticated
            if (socket) {
                console.log('🔌 Disconnecting socket - not authenticated');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        console.log('🔌 Initializing socket connection...');
        console.log('User:', user);
        console.log('Token exists:', !!token);

        // Create socket connection
        const newSocket = io('http://localhost:5000', {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);

            // Join manager room
            console.log('📡 Joining manager room...');
            newSocket.emit('join:role', { role: 'manager' });

            toast.success('🟢 Live updates connected', {
                duration: 2000,
                icon: '🔌',
            });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                toast.error('Connection lost, reconnecting...', { duration: 2000 });
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);

            // Only show error after initial connection attempt
            if (socket && socket.connected) {
                toast.error(`Connection error: ${error.message}`, { duration: 3000 });
            }
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);

        // Cleanup
        return () => {
            console.log('🔌 Cleaning up socket connection');
            newSocket.disconnect();
        };
    }, [token, user, isAuthenticated]);

    const value = {
        socket,
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
