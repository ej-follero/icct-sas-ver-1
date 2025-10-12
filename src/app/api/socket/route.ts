import { NextRequest, NextResponse } from 'next/server';
import { getSocketIO } from '@/lib/socket';

export async function GET(request: NextRequest) {
  try {
    const socketIO = getSocketIO();
    
    // Get connected clients count
    const connectedClients = socketIO.engine.clientsCount;
    const readerUpdateClients = socketIO.sockets.adapter.rooms.get('reader-updates')?.size || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        connectedClients,
        readerUpdateClients,
        serverStatus: 'running'
      }
    });
  } catch (error: any) {
    console.error('Socket.IO status error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get Socket.IO status'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    const socketIO = getSocketIO();
    
    switch (action) {
      case 'broadcast-new-reader':
        socketIO.to('reader-updates').emit('newReader', {
          type: 'NEW_READER',
          data,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'broadcast-status-update':
        socketIO.to('reader-updates').emit('readerStatusUpdate', {
          type: 'READER_STATUS_UPDATE',
          data,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'broadcast-connection':
        socketIO.to('reader-updates').emit('readerConnection', {
          type: 'READER_CONNECTION',
          data,
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Broadcasted ${action} to connected clients`
    });
  } catch (error: any) {
    console.error('Socket.IO broadcast error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to broadcast message'
    }, { status: 500 });
  }
}
