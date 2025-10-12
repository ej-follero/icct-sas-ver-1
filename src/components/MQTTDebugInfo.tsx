"use client";

import { useMQTTClient } from './MQTTprovider';
import { useState, useEffect } from 'react';

export function MQTTDebugInfo() {
  const { client, status, mode, messages, cardId } = useMQTTClient();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        Debug MQTT
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">MQTT Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Status:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status || 'disconnected'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Mode:</span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
            {mode}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Messages:</span>
          <span className="ml-2 text-gray-600">{messages.length}</span>
        </div>
        
        <div>
          <span className="font-medium">Last Card ID:</span>
          <span className="ml-2 text-gray-600 font-mono text-xs">{cardId || 'None'}</span>
        </div>
        
        {messages.length > 0 && (
          <div>
            <span className="font-medium">Latest Message:</span>
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
              <div>Topic: {messages[messages.length - 1]?.topic}</div>
              <div>RFID: {messages[messages.length - 1]?.rfid}</div>
              <div>Time: {messages[messages.length - 1]?.timestamp}</div>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Broker: {process.env.NEXT_PUBLIC_MQTT_WS_BROKER || 'ws://localhost:9001'}
          </div>
        </div>
      </div>
    </div>
  );
}
