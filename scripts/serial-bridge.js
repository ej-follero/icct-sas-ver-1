// Tiny serial->HTTP bridge for Arduino UNO R4 (or any serial device)
// Requires: npm i serialport node-fetch@2

const { SerialPort } = require('serialport');
const fetch = require('node-fetch');

const SERIAL_PATH = process.env.SERIAL_PATH || undefined; // e.g. 'COM3' on Windows, '/dev/ttyACM0' on Linux
const BAUD_RATE = Number(process.env.BAUD_RATE || 115200);
const API_URL = process.env.API_URL || 'http://localhost:3000/api/rfid/readers/discovered';

async function pickPort() {
  if (SERIAL_PATH) return SERIAL_PATH;
  const ports = await SerialPort.list();
  const candidate = ports.find(p => /arduino|usb|acm|wch/i.test(`${p.path} ${p.friendlyName} ${p.manufacturer}`));
  if (!candidate) throw new Error('No serial device found. Set SERIAL_PATH=...');
  return candidate.path;
}

(async () => {
  try {
    const portPath = await pickPort();
    console.log(`[serial-bridge] Using port ${portPath} at ${BAUD_RATE} baud`);
    const port = new SerialPort({ path: portPath, baudRate: BAUD_RATE });

    let buffer = '';
    port.on('data', async (chunk) => {
      buffer += chunk.toString('utf8');
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const payload = JSON.parse(line);
          // Only post discovery-style payloads (with device identity)
          const deviceIdVal = payload.deviceId || payload.deviceID || payload.id || payload.readerId;
          const deviceNameVal = payload.deviceName || payload.name || payload.readerName;
          if (!deviceIdVal && !deviceNameVal) {
            // ignore regular scan packets like { rfid, timestamp, ... }
            return;
          }
          // POST to Next.js API
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            console.error('[serial-bridge] API error', await res.text());
          } else {
            console.log('[serial-bridge] Posted discovered reader');
          }
        } catch (e) {
          // non-JSON line; ignore
        }
      }
    });

    port.on('error', (e) => console.error('[serial-bridge] Serial error', e.message));
  } catch (e) {
    console.error('[serial-bridge] Failed:', e.message);
    process.exit(1);
  }
})();


