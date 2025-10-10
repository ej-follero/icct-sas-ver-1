// Configuration for API and Socket.IO endpoints
export const config = {
  // API endpoints (Next.js server)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  
  // Socket.IO server (same as Next.js server)
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  
  // WebSocket fallback
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000',
  
  // Development mode
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Production mode
  isProduction: process.env.NODE_ENV === 'production'
};

// API endpoint helpers
export const apiEndpoints = {
  reports: {
    summary: `${config.apiUrl}/api/reports/summary`,
    recent: (limit = 5, days = 7) => `${config.apiUrl}/api/reports/recent?limit=${limit}&days=${days}`,
    attendance: (type: 'students' | 'instructors') => `${config.apiUrl}/api/reports/attendance?type=${type}`,
    rfidLogs: `${config.apiUrl}/api/reports/rfid-logs`,
    communication: `${config.apiUrl}/api/reports/communication`,
    generate: `${config.apiUrl}/api/reports/generate`,
    download: (id: string) => `${config.apiUrl}/api/reports/download/${id}`
  }
};
