// MQTT Connection Diagnostic Script
const mqtt = require('mqtt');

console.log('🔍 Checking MQTT Connection...');

const client = mqtt.connect('ws://localhost:8083', {
  clientId: 'diagnostic-client',
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 0
});

client.on('connect', () => {
  console.log('✅ MQTT Broker is running and accessible');
  console.log('📡 Connected to ws://localhost:8083');
  client.end();
});

client.on('error', (error) => {
  console.log('❌ MQTT Connection Failed:');
  console.log('   Error:', error.message);
  console.log('   Possible causes:');
  console.log('   1. MQTT broker is not running');
  console.log('   2. Wrong broker URL (should be ws://localhost:8083)');
  console.log('   3. Firewall blocking port 8083');
  console.log('   4. Broker not configured for WebSocket connections');
});

setTimeout(() => {
  if (!client.connected) {
    console.log('⏰ Connection timeout - MQTT broker may not be running');
    process.exit(1);
  }
}, 10000);
