import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useRefresh } from '../context/RefreshContext';

const SocketGlobalRefresh = () => {
    const { socket } = useSocket();
    const { bump } = useRefresh();

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            bump();
        };

        socket.on('system:data-updated', handleUpdate);

        return () => {
            socket.off('system:data-updated', handleUpdate);
        };
    }, [socket, bump]);

    return null;
};

export default SocketGlobalRefresh;
