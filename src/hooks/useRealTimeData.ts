import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { socketService } from '@/lib/services/socket.service';

interface RealTimeConfig {
  url?: string;
}

interface RealTimeMessage {
  type: 'attendance_update' | 'status_change' | 'error' | 'heartbeat';
  data: any;
  timestamp: number;
}

interface RealTimeState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastMessage: RealTimeMessage | null;
}

export function useRealTimeData(config: RealTimeConfig) {
  const [state, setState] = useState<RealTimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null
  });

  const socketRef = useRef<ReturnType<typeof socketService.connect> | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [config.url]);

  const connect = useCallback(() => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socket = socketService.connect();
      socketRef.current = socket;

      socket.on('connect', () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        }));
      });

      socket.on('attendance_update', (data) => {
        const message: RealTimeMessage = { type: 'attendance_update', data, timestamp: Date.now() };
        setState(prev => ({ ...prev, lastMessage: message }));
        const handler = messageHandlersRef.current.get(message.type);
        if (handler) handler(message.data);
      });

      socket.on('status_change', (data) => {
        const message: RealTimeMessage = { type: 'status_change', data, timestamp: Date.now() };
        setState(prev => ({ ...prev, lastMessage: message }));
        const handler = messageHandlersRef.current.get(message.type);
        if (handler) handler(message.data);
      });

      socket.on('disconnect', (reason) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: reason || 'Connection closed'
        }));
      });

      socket.on('connect_error', () => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket error occurred',
          isConnecting: false
        }));
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false
      }));
    }
  }, [memoizedConfig]);

  const disconnect = useCallback(() => {
    socketService.disconnect();

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    }));
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  const subscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(messageType, handler);
  }, []);

  const unsubscribe = useCallback((messageType: string) => {
    messageHandlersRef.current.delete(messageType);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe
  };
} 