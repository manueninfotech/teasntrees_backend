import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const SocketGlobalRefresh = () => {
    const { socket } = useSocket();
    const timerRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            if (timerRef.current) return;
            timerRef.current = setTimeout(() => {
                window.location.reload();
            }, 300);
        };

        socket.on('system:data-updated', handleUpdate);

        return () => {
            socket.off('system:data-updated', handleUpdate);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [socket]);

    return null;
};

export default SocketGlobalRefresh;
