"use client";

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  newReaderData: any | null;
  readerStatusUpdates: any[];
  readerConnections: any[];
  connect: () => void;
  disconnect: () => void;
  requestReaderUpdates: () => void;
  stopReaderUpdates: () => void;
  clearNewReaderData: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newReaderData, setNewReaderData] = useState<any | null>(null);
  const [readerStatusUpdates, setReaderStatusUpdates] = useState<any[]>([]);
  const [readerConnections, setReaderConnections] = useState<any[]>([]);

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket.IO connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Listen for new reader events
    newSocket.on('newReader', (event: SocketEvent) => {
      console.log('📡 Received new reader:', event.data);
      setNewReaderData(event.data);
    });

    // Listen for reader status updates
    newSocket.on('readerStatusUpdate', (event: SocketEvent) => {
      console.log('📡 Received reader status update:', event.data);
      setReaderStatusUpdates(prev => [...prev.slice(-9), event.data]);
    });

    // Listen for reader connection events
    newSocket.on('readerConnection', (event: SocketEvent) => {
      console.log('📡 Received reader connection update:', event.data);
      setReaderConnections(prev => [...prev.slice(-9), event.data]);
    });

    setSocket(newSocket);
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const requestReaderUpdates = useCallback(() => {
    if (socket?.connected) {
      socket.emit('request-reader-updates');
      console.log('📡 Requested reader updates');
    }
  }, [socket]);

  const stopReaderUpdates = useCallback(() => {
    if (socket?.connected) {
      socket.emit('stop-reader-updates');
      console.log('📡 Stopped reader updates');
    }
  }, [socket]);

  const clearNewReaderData = useCallback(() => {
    setNewReaderData(null);
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    newReaderData,
    readerStatusUpdates,
    readerConnections,
    connect,
    disconnect,
    requestReaderUpdates,
    stopReaderUpdates,
    clearNewReaderData,
  };
};
