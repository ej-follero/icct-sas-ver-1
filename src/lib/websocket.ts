import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    path: '/api/socket'
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      socket.data.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.userId} connected to live attendance feed`);
    
    // Join user to relevant rooms based on their role
    socket.join(`user-${socket.data.userId}`);
    
    if (socket.data.userRole === 'ADMIN' || socket.data.userRole === 'SUPER_ADMIN') {
      socket.join('admin-broadcast');
    }
    
    if (socket.data.userRole === 'INSTRUCTOR') {
      socket.join('instructor-broadcast');
    }

    socket.on('join-class', (data) => {
      const { subjectSchedId, roomId } = data;
      socket.join(`class-${subjectSchedId}`);
      socket.join(`room-${roomId}`);
      console.log(`User ${socket.data.userId} joined class ${subjectSchedId}`);
    });

    socket.on('leave-class', (data) => {
      const { subjectSchedId, roomId } = data;
      socket.leave(`class-${subjectSchedId}`);
      socket.leave(`room-${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.userId} disconnected from live attendance feed`);
    });
  });

  return io;
}

export function getWebSocketServer() {
  return io;
}

// Helper functions for emitting events
export function emitAttendanceUpdate(attendanceData: any) {
  if (!io) return;
  
  // Emit to specific class room
  if (attendanceData.subjectSchedId) {
    io.to(`class-${attendanceData.subjectSchedId}`).emit('attendance-update', attendanceData);
  }
  
  // Emit to room-specific listeners
  if (attendanceData.roomId) {
    io.to(`room-${attendanceData.roomId}`).emit('attendance-update', attendanceData);
  }
  
  // Emit to admin broadcast
  io.to('admin-broadcast').emit('attendance-update', attendanceData);
}

export function emitAttendanceStatusChange(attendanceId: number, newStatus: string, userId: number) {
  if (!io) return;
  
  io.to('admin-broadcast').emit('attendance-status-change', {
    attendanceId,
    newStatus,
    changedBy: userId,
    timestamp: new Date().toISOString()
  });
}

export function emitRFIDScan(rfidData: any) {
  if (!io) return;
  
  // Emit to all connected clients for live RFID activity
  io.emit('rfid-scan', {
    rfid: rfidData.rfid,
    timestamp: rfidData.timestamp,
    location: rfidData.location,
    status: rfidData.status
  });
}
