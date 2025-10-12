# EMQX MQTT Broker Configuration

## Update your .env file with EMQX settings:

```env
# EMQX MQTT Configuration
NEXT_PUBLIC_MQTT_WS_BROKER="ws://localhost:8083"
NEXT_PUBLIC_MQTT_WS_PORT="8083"
NEXT_PUBLIC_MQTT_USERNAME=""
NEXT_PUBLIC_MQTT_PASSWORD=""
NEXT_PUBLIC_MQTT_CLIENT_ID="icct-attendance-web"
NEXT_PUBLIC_MQTT_MASTER_CARD_ID="MASTER123"

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

## EMQX Default Ports:
- **MQTT**: 1883
- **MQTT over WebSocket**: 8083
- **Dashboard**: 18083
- **HTTP API**: 8081

## Test EMQX Connection:
1. Open browser: http://localhost:18083
2. Default login: admin/public
3. Check if broker is running
