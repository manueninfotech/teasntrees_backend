import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token || !user) return;

        // Dynamically extract brand from URL path
        const pathSegments = window.location.pathname.split('/');
        const activeBrand = pathSegments[1] || 'teasntrees';

        // Connect to backend
        const newSocket = io("http://localhost:5000", {
            auth: { token, brand: activeBrand }, // Pass JWT and Brand in handshake
            transports: ["websocket"],
        });

        newSocket.on("connect", () => {
            console.log("🟢 Connected to System Socket:", newSocket.id);
            setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
            console.log("🔴 Disconnected from System Socket");
            setIsConnected(false);
        });

        // Listen for system messages
        newSocket.on("system:message", (data) => {
            console.log("🔔 System Message:", data);
        });

        // Error handling
        newSocket.on("connect_error", (err) => {
            console.error("Socket Connection Error:", err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);

