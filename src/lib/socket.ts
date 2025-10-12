import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

let io: SocketIOServer | null = null;

export const initializeSocketIO = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
      console.log('🔌 Client connected:', socket.id);
      
      // Join RFID readers room for real-time updates
      socket.join('rfid-readers');
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });

      // Handle client requests for reader updates
      socket.on('request-reader-updates', () => {
        socket.join('reader-updates');
        console.log('📡 Client joined reader updates room:', socket.id);
      });

      // Handle client requests to stop updates
      socket.on('stop-reader-updates', () => {
        socket.leave('reader-updates');
        console.log('📡 Client left reader updates room:', socket.id);
      });
    });

    console.log('🚀 Socket.IO server initialized');
  }
  
  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call initializeSocketIO first.');
  }
  return io;
};

// Broadcast new reader registration
export const broadcastNewReader = (readerData: any) => {
  const socketIO = getSocketIO();
  socketIO.to('reader-updates').emit('newReader', {
    type: 'NEW_READER',
    data: readerData,
    timestamp: new Date().toISOString()
  });
  console.log('📡 Broadcasted new reader:', readerData);
};

// Broadcast reader status updates
export const broadcastReaderStatusUpdate = (readerId: number, status: string) => {
  const socketIO = getSocketIO();
  socketIO.to('reader-updates').emit('readerStatusUpdate', {
    type: 'READER_STATUS_UPDATE',
    data: { readerId, status },
    timestamp: new Date().toISOString()
  });
  console.log('📡 Broadcasted reader status update:', { readerId, status });
};

// Broadcast reader connection status
export const broadcastReaderConnection = (readerId: number, connected: boolean) => {
  const socketIO = getSocketIO();
  socketIO.to('reader-updates').emit('readerConnection', {
    type: 'READER_CONNECTION',
    data: { readerId, connected },
    timestamp: new Date().toISOString()
  });
  console.log('📡 Broadcasted reader connection:', { readerId, connected });
};

export default io;
