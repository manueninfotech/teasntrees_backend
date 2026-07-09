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

        const pathSegments = window.location.pathname.split('/');
        const activeBrand = pathSegments[1] || 'littleh';

        const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://api.teasntrees.in';
        const newSocket = io(backendUrl, {
            auth: { token, brand: activeBrand },
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

        newSocket.on("error", (err) => {
            console.error("Socket Error:", err);
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
