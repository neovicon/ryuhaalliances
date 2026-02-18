import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../store/auth';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Strip /api if present to get the root URL for socket.io, otherwise it treats /api as a namespace
        url = url.replace(/\/api\/?$/, '');
        console.log('Connecting socket to:', url);

        const newSocket = io(url, {
            withCredentials: true,
            autoConnect: true,
            transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket && user) {
            socket.emit('identify', user);
        }
    }, [socket, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
