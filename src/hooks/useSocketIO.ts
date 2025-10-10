import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketIOConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface SocketIOState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  socket: Socket | null;
}

export function useSocketIO(config: SocketIOConfig = {}) {
  const [state, setState] = useState<SocketIOState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    socket: null
  });

  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    // Check if already connected
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socket = io(config.url || window.location.origin, {
        autoConnect: config.autoConnect !== false,
        reconnection: config.reconnection !== false,
        reconnectionAttempts: config.reconnectionAttempts || 5,
        reconnectionDelay: config.reconnectionDelay || 1000,
      });

      // Store socket in ref
      socketRef.current = socket;

      socket.on('connect', () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          socket
        }));
        console.log('Socket.IO connected');
      });

      socket.on('disconnect', (reason) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: reason === 'io server disconnect' ? 'Server disconnected' : null
        }));
        console.log('Socket.IO disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: error.message,
          socket
        }));
        console.error('Socket.IO connection error:', error);
      });

      socket.on('reconnect', (attemptNumber) => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      });

      socket.on('reconnect_error', (error) => {
        setState(prev => ({
          ...prev,
          error: error.message
        }));
        console.error('Socket.IO reconnection error:', error);
      });

      // Handle custom events
      socket.onAny((eventName, ...args) => {
        const handler = messageHandlersRef.current.get(eventName);
        if (handler) {
          handler(args[0]);
        }
      });

      setState(prev => ({ ...prev, socket }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false
      }));
    }
  }, [config]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        socket: null
      }));
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(event, handler);
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string) => {
    messageHandlersRef.current.delete(event);
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (config.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
    off
  };
}
