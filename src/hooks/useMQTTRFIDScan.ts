"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMQTTClient } from '@/components/MQTTprovider';

interface MQTTRFIDScan {
  tagNumber: string;
  timestamp: string;
  topic: string;
  rfid: string;
}

interface UseMQTTRFIDScanOptions {
  enabled?: boolean;
  onNewScan?: (scan: MQTTRFIDScan) => void;
  scanThreshold?: number; // milliseconds to consider a scan "new"
  mode?: 'attendance' | 'registration';
}

export function useMQTTRFIDScan(options: UseMQTTRFIDScanOptions = {}) {
  const { 
    enabled = true, 
    onNewScan, 
    scanThreshold = 2000,
    mode = 'registration' 
  } = options;
  
  const { client, messages, status, mode: mqttMode } = useMQTTClient();
  const [recentScans, setRecentScans] = useState<MQTTRFIDScan[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const lastScanTimeRef = useRef<Date | null>(null);
  const onNewScanRef = useRef(onNewScan);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Update ref when callback changes
  useEffect(() => {
    onNewScanRef.current = onNewScan;
  }, [onNewScan]);

  // Monitor MQTT connection status
  useEffect(() => {
    setIsConnected(status === 'connected' && !!client);
  }, [status, client]);

  // Monitor MQTT messages for new scans
  useEffect(() => {
    if (!enabled || !client || !isConnected) {
      console.log('useMQTTRFIDScan: Not enabled or not connected', { enabled, client: !!client, isConnected });
      return;
    }

    const handleMessage = (message: any) => {
      console.log('useMQTTRFIDScan: Received message:', message);
      console.log('useMQTTRFIDScan: Current mqttMode:', mqttMode, 'Expected mode:', mode);
      
      // Only process messages in the correct mode
      if (mqttMode !== mode) {
        console.log('useMQTTRFIDScan: Mode mismatch, ignoring message');
        return;
      }

      const scanTime = new Date(message.timestamp);
      
      // Check if this is a new scan (avoid duplicates)
      if (lastScanTimeRef.current && 
          scanTime.getTime() - lastScanTimeRef.current.getTime() < scanThreshold) {
        console.log('useMQTTRFIDScan: Duplicate scan detected, ignoring');
        return;
      }

      const scan: MQTTRFIDScan = {
        tagNumber: message.rfid,
        timestamp: message.timestamp,
        topic: message.topic,
        rfid: message.rfid
      };

      console.log('useMQTTRFIDScan: Processing new scan:', scan);
      setRecentScans(prev => [scan, ...prev.slice(0, 9)]); // Keep last 10 scans
      lastScanTimeRef.current = scanTime;

      if (onNewScanRef.current) {
        console.log('useMQTTRFIDScan: Calling onNewScan callback');
        onNewScanRef.current(scan);
      }
    };

    // Process all new messages since last check
    if (messages.length > 0) {
      messages.forEach((message, index) => {
        const messageId = `${message.topic}-${message.timestamp}-${message.rfid}`;
        
        // Skip if we've already processed this message
        if (processedMessagesRef.current.has(messageId)) {
          return;
        }
        
        console.log('useMQTTRFIDScan: Processing new message:', message);
        processedMessagesRef.current.add(messageId);
        handleMessage(message);
      });
    }
  }, [enabled, client, isConnected, messages, mqttMode, mode, scanThreshold]);

  // Clear processed messages when mode changes
  useEffect(() => {
    processedMessagesRef.current.clear();
  }, [mode]);

  // Publish mode change to MQTT
  const setMode = useCallback((newMode: 'attendance' | 'registration') => {
    if (!client || !isConnected) return;
    
    client.publish('/attendance/mode', JSON.stringify({ mode: newMode }));
  }, [client, isConnected]);

  // Publish feedback to MQTT
  const sendFeedback = useCallback((message: string, value: string) => {
    if (!client || !isConnected) return;
    
    client.publish('/attendance/feedback', JSON.stringify({
      topic: '/attendance/feedback',
      message,
      value
    }));
  }, [client, isConnected]);

  return {
    recentScans,
    isConnected,
    mqttMode,
    setMode,
    sendFeedback,
    client
  };
}
