# Cloud MQTT Setup (Easiest Option)

## Use a Free Cloud MQTT Broker

1. **Go to**: https://www.hivemq.com/public-mqtt-broker/
2. **Use these settings**:
   - Broker: `broker.hivemq.com`
   - Port: `8000` (WebSocket)
   - No authentication required

## Update your .env file:

```
NEXT_PUBLIC_MQTT_WS_BROKER="wss://broker.hivemq.com"
NEXT_PUBLIC_MQTT_WS_PORT="8000"
NEXT_PUBLIC_MQTT_USERNAME=""
NEXT_PUBLIC_MQTT_PASSWORD=""
NEXT_PUBLIC_MQTT_CLIENT_ID="icct-attendance-web"
NEXT_PUBLIC_MQTT_MASTER_CARD_ID="MASTER123"
```

## Test Connection

Your RFID reader should connect to this cloud broker and send data to your web app.
