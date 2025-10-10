import { io, Socket } from 'socket.io-client';

export interface SocketServiceOptions {
  url?: string;
  path?: string;
  autoConnect?: boolean;
}

export class SocketService {
  private socket: Socket | null = null;

  constructor(private options: SocketServiceOptions = {}) {}

  connect() {
    if (this.socket && this.socket.connected) return this.socket;
    const url = this.options.url || (typeof window !== 'undefined' ? window.location.origin : '');
    this.socket = io(url, {
      path: this.options.path,
      transports: ['websocket'],
      autoConnect: this.options.autoConnect ?? true
    });
    return this.socket;
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void) {
    if (!this.socket) return;
    handler ? this.socket.off(event, handler) : this.socket.off(event);
  }

  emit(event: string, payload?: any) {
    this.socket?.emit(event, payload);
  }

  joinRoom(room: string) {
    this.emit('join-room', room);
  }

  leaveRoom(room: string) {
    this.emit('leave-room', room);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();


