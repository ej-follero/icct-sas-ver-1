"use client";

import mqtt, { type MqttClient } from "mqtt";
import { toast } from 'sonner';
import React, { type ReactNode, useContext, useEffect, useState } from "react";

const MQTT = {
  BROKER: process.env.NEXT_PUBLIC_MQTT_WS_BROKER as string,
  PORT: Number(process.env.NEXT_PUBLIC_MQTT_WS_PORT),
  USERNAME: process.env.NEXT_PUBLIC_MQTT_USERNAME,
  PASSWORD: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
  CLIENT_ID: process.env.NEXT_PUBLIC_MQTT_CLIENT_ID,
  MASTER_CARD_ID: process.env.NEXT_PUBLIC_MQTT_MASTER_CARD_ID,
};

interface MQTTMessage {
  topic: string;
  timestamp: string;
  rfid: string;
}
interface MQTTContextState {
  client: MqttClient | null;
  status: "connected" | undefined;
  mode: "attendance" | "registration";
  messages: Array<MQTTMessage>;
  cardId: string | undefined;
}

export const MQTT_TOPIC = {
  STATUS: "/attendance/status",
  MODE: "/attendance/mode",
  ATTENDANCE: "/attendance/run",
  REGISTER: "/attendance/register",
  FEEDBACK: "/attendance/feedback",
} as const;

const MQTT_TOPICS = [
  "/attendance/status",
  "/attendance/mode",
  "/attendance/run",
  "/attendance/register",
];

const MQTTContext = React.createContext<MQTTContextState | null>(null);

// test data
// example fo "Registered" IDs
// const registeredUsers = ["CCB6B542", "6C429C42", "C97E41B8"];

export function MQTTProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [status, setStatus] = useState<"connected" | undefined>(undefined);
  const [mode, setMode] = useState<"attendance" | "registration">("attendance");
  const [messages, setMessages] = useState<MQTTContextState["messages"]>([]);
  const [cardId, setcardId] = useState<string>();

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      console.log('MQTT Provider: Server-side rendering, skipping MQTT connection');
      return;
    }

    // Check if required environment variables are available
    if (!MQTT.BROKER || !MQTT.PORT) {
      console.warn('MQTT Provider: Missing required environment variables, skipping connection');
      return;
    }

    console.log('MQTT Config:', {
      BROKER: MQTT.BROKER,
      PORT: MQTT.PORT,
      USERNAME: MQTT.USERNAME,
      CLIENT_ID: MQTT.CLIENT_ID
    });

    try {
      const _client = mqtt.connect(MQTT.BROKER, {
        username: MQTT.USERNAME,
        password: MQTT.PASSWORD,
        port: MQTT.PORT,
        clientId: MQTT.CLIENT_ID,
        connectTimeout: 10000, // 10 seconds timeout
        reconnectPeriod: 5000, // 5 seconds reconnect interval
      });

      if (!_client) {
        console.error('Failed to create MQTT client');
        return;
      }

      _client.on("connect", () => {
        console.log('MQTT Connected successfully');
        setClient(_client);
        setStatus("connected");

        // Check if client is still connected before subscribing
        if (_client && _client.connected) {
          try {
            _client.subscribe(MQTT_TOPICS);
            console.log('MQTT Subscribed to topics:', MQTT_TOPICS);
          } catch (subscribeError) {
            console.error('MQTT Subscription error:', subscribeError);
          }
        }
      });

      _client.on("error", (error) => {
        console.error('MQTT Connection error:', error);
        setStatus(undefined);
      });

      _client.on("disconnect", () => {
        console.log('MQTT Disconnected');
        setStatus(undefined);
      });

      return () => {
        if (_client) {
          try {
            if (_client.connected) {
              _client.unsubscribe(MQTT_TOPICS);
            }
            _client.end();
            console.log('MQTT Client cleaned up');
          } catch (cleanupError) {
            console.error('MQTT Cleanup error:', cleanupError);
          }
        }
      };
    } catch (error) {
      console.error('MQTT Provider initialization error:', error);
    }
  }, []);

  useEffect(() => {
    if (!client || !client.connected) return;

    const handleMessage = (topic: string, payload: Buffer) => {
      try {
        const data = JSON.parse(payload.toString());

        if (!data) return;

        if (topic === MQTT_TOPIC.STATUS && data?.status === "connected") {
          setStatus("connected");
          return;
        }

        if (topic === MQTT_TOPIC.MODE) {
          if (data.mode === "registration") {
            setMode("registration");
          } else if (data.mode === "attendance") {
            setMode("attendance");
          }
        }

        if (data.rfid === MQTT.MASTER_CARD_ID) return;

        if (data.mode === "attendance" && topic === MQTT_TOPIC.ATTENDANCE) {
          console.log('📡 MQTT Attendance scan received:', data);
          console.log('🔍 RFID Tag being scanned:', data.rfid);
          console.log('🔍 Reader ID:', data.readerId);
          console.log('🔍 Location:', data.location);
          
          // Send directly to attendance API - it now handles both Student.rfidTag and RFIDTags.tagNumber
          fetch('/api/attendance/mqtt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rfid: data.rfid,
              readerId: data.readerId || 1,
              location: data.location || 'Unknown',
              deviceInfo: {
                timestamp: data.timestamp || new Date().toISOString(),
                mqttSource: true
              }
            })
          }).then(response => response.json())
            .then(result => {
              if (result.success) {
                console.log('✅ Attendance record created:', result.attendance);
                // success feedback
                if (client.connected) {
                  client.publish(
                    MQTT_TOPIC.FEEDBACK,
                    JSON.stringify({
                      topic: MQTT_TOPIC.FEEDBACK,
                      message: "Recorded!",
                      value: data.rfid,
                    }),
                  );
                }
                toast.success('Attendance recorded');
              } else {
                console.error('❌ Attendance record failed:', result.error);
                console.log('💡 Check if the RFID tag is properly assigned to a student');
                const errMsg = typeof result.error === 'string' ? result.error : 'Failed to record attendance';
                toast.error(`${errMsg}${data?.rfid ? ` (RFID: ${data.rfid})` : ''}`);
                // error feedback
                if (client.connected) {
                  client.publish(
                    MQTT_TOPIC.FEEDBACK,
                    JSON.stringify({
                      topic: MQTT_TOPIC.FEEDBACK,
                      message: errMsg.includes('not found') ? 'Unrecognized card' : 'Error',
                      value: data.rfid,
                    }),
                  );
                }
              }
            })
            .catch(error => {
              console.error('❌ Attendance API error:', error);
              toast.error('Attendance service error');
              if (client.connected) {
                client.publish(
                  MQTT_TOPIC.FEEDBACK,
                  JSON.stringify({
                    topic: MQTT_TOPIC.FEEDBACK,
                    message: 'Service error',
                    value: data.rfid,
                  }),
                );
              }
            });
          
          setMessages((current) => [...current, { topic, ...data }]);
        } else if (
          data.mode === "registration" &&
          topic === MQTT_TOPIC.REGISTER
        ) {
          setcardId(data.rfid);
          setMessages((current) => [...current, { topic, ...data }]);
          
          // Send feedback for registration mode
          if (client.connected) {
            client.publish(
              MQTT_TOPIC.FEEDBACK,
              JSON.stringify({
                topic: MQTT_TOPIC.FEEDBACK,
                message: "Card ready for registration",
                value: data.rfid,
              }),
            );
          }
        } else if (data.mode === "reader_registration" && topic === MQTT_TOPIC.REGISTER) {
          // Handle new RFID reader registration
          console.log('📡 New RFID reader detected via MQTT:', data);
          
          // Send reader registration to backend
          fetch('/api/rfid/readers/mqtt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: data.deviceId || data.rfid,
              deviceName: data.deviceName || `Reader ${data.deviceId || data.rfid}`,
              ipAddress: data.ipAddress,
              macAddress: data.macAddress,
              firmwareVersion: data.firmwareVersion,
              location: data.location
            })
          }).then(response => response.json())
            .then(result => {
              if (result.success) {
                console.log('✅ Reader registered successfully:', result.data);
              } else {
                console.error('❌ Reader registration failed:', result.error);
              }
            })
            .catch(error => {
              console.error('❌ Reader registration error:', error);
            });
          
          setMessages((current) => [...current, { topic, ...data }]);
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.log("Invalid JSON payload");
        } else {
          console.log(error);
        }
      }
    };

    client.on("message", handleMessage);

    return () => {
      if (client) {
        client.removeListener("message", handleMessage);
      }
    };
  }, [client]);

  return (
    <MQTTContext.Provider value={{ client, messages, status, mode, cardId }}>
      {children}
    </MQTTContext.Provider>
  );
}

export function useMQTTClient() {
  const context = useContext(MQTTContext);

  if (!context)
    throw new Error(`useMQTTClient must be used inside a <MQTTProvider />.`);

  return context;
}