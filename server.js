const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Broadcast status change: connected
    io.emit('status_change', {
      type: 'connected',
      socketId: socket.id,
      connections: io.engine.clientsCount,
      timestamp: new Date().toISOString()
    });

    // Join room for reports updates
    socket.on('join-reports', () => {
      socket.join('reports');
      console.log(`Client ${socket.id} joined reports room`);
    });

    // Leave room
    socket.on('leave-reports', () => {
      socket.leave('reports');
      console.log(`Client ${socket.id} left reports room`);
      io.emit('status_change', {
        type: 'left_room',
        room: 'reports',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Generic room join/leave to mirror ws semantics
    socket.on('join-room', (room) => {
      if (typeof room === 'string' && room.trim().length > 0) {
        socket.join(room);
        console.log(`Client ${socket.id} joined room ${room}`);
        io.emit('status_change', {
          type: 'joined_room',
          room,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    });
    socket.on('leave-room', (room) => {
      if (typeof room === 'string' && room.trim().length > 0) {
        socket.leave(room);
        console.log(`Client ${socket.id} left room ${room}`);
        io.emit('status_change', {
          type: 'left_room',
          room,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle report generation events
    socket.on('report-generated', (data) => {
      console.log('Report generated:', data);
      // Broadcast to all clients in reports room
      io.to('reports').emit('report_generated', data);
    });

    // Handle summary updates
    socket.on('summary-updated', (data) => {
      console.log('Summary updated:', data);
      io.to('reports').emit('summary_update', data);
    });

    // Handle attendance updates
    socket.on('attendance-updated', (data) => {
      console.log('Attendance updated:', data);
      io.to('reports').emit('attendance_update', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      io.emit('status_change', {
        type: 'disconnected',
        socketId: socket.id,
        connections: io.engine.clientsCount,
        timestamp: new Date().toISOString()
      });
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to reports server',
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  server.on('request', (req, res) => {
    if (req.url === '/api/websocket/health' || req.url === '/api/system-status/websocket') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        connections: io.engine.clientsCount,
        timestamp: new Date().toISOString()
      }));
      return;
    }
  });

  const port = process.env.PORT || 3000; // Use port 3000 for Next.js with Socket.IO
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.IO server running on port ${port}`);
  });
});
