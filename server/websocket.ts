import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  // Send mock data every 5 seconds for testing
  const interval = setInterval(() => {
    const mockData = {
      id: Math.random().toString(36).substr(2, 9),
      name: ['Juan Dela Cruz', 'Maria Santos', 'Ana Villanueva'][Math.floor(Math.random() * 3)],
      role: Math.random() > 0.5 ? 'Student' : 'Instructor',
      idNumber: Math.floor(Math.random() * 1000000).toString(),
      subject: 'ICT 101',
      section: 'BSIT 2A',
      room: 'Room 203',
      status: ['Present', 'Late', 'Absent'][Math.floor(Math.random() * 3)]
    };

    ws.send(JSON.stringify(mockData));
  }, 5000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
    clearInterval(interval);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
}); 