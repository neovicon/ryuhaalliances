import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../store/auth';

const LabyrinthSocketContext = createContext();

export const useLabyrinthSocket = () => {
    return useContext(LabyrinthSocketContext);
};

export const LabyrinthSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Strip /api if present and add /labyrinth namespace
        url = url.replace(/\/api\/?$/, '') + '/labyrinth';

        console.log('Connecting Labyrinth socket to:', url);

        const newSocket = io(url, {
            withCredentials: true,
            autoConnect: true,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Labyrinth socket connected successfully');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Labyrinth socket connection error:', err);
        });

        setSocket(newSocket);

        return () => {
            console.log('Closing Labyrinth socket');
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (socket && user) {
            socket.emit('identify', user);
        }
    }, [socket, user]);

    return (
        <LabyrinthSocketContext.Provider value={socket}>
            {children}
        </LabyrinthSocketContext.Provider>
    );
};
