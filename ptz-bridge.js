// ── PTZ bridge ───────────────────────────────────────────────────────────────
// VISCA-over-IP control for PTZ cameras (AVKANS / PTZOptics-compatible).
// Plain VISCA payloads over UDP, default port 1259 (no Sony 8-byte header).
// Verified against AVKANS AV-CM* — camera replies 90 41 FF (ack) / 90 51 FF.
// Browsers can't send UDP, so server.js proxies HTTP endpoints to here.
//
// Per-camera UDP socket is opened lazily and reused. `viscaPort` on the
// devices.json entry overrides the port if a camera needs a different one.

const fs = require('fs');
const dgram = require('dgram');
const path = require('path');

const DEVICES_PATH = path.join(__dirname, 'devices.json');
const DEFAULT_PORT = 1259;

function ptzDevices() {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DEVICES_PATH, 'utf8')); } catch { return []; }
  return list
    .filter(d => d.ip && !/controller|joystick|keyboard/i.test(d.name || '')
      && (d.category === 'cameras' || /\bptz\b|avkans/i.test(d.name || '')))
    .map(d => ({
      name: d.name,
      ip: String(d.ip).split(':')[0].split('/')[0],
      port: parseInt(d.viscaPort) || DEFAULT_PORT,
    }));
}

function findDevice(ip) {
  const d = ptzDevices().find(x => x.ip === ip);
  if (!d) throw new Error(`No PTZ camera registered at ${ip} — add it to devices.json under the "cameras" category`);
  return d;
}

// ip -> { socket, port, lastReply }
const socks = new Map();

function sockFor(d) {
  let rec = socks.get(d.ip);
  if (rec && rec.port === d.port) return rec;
  if (rec) { try { rec.socket.close(); } catch {} }
  const socket = dgram.createSocket('udp4');
  rec = { socket, port: d.port, lastReply: null };
  socket.on('message', (m) => { rec.lastReply = m.toString('hex'); });
  socket.on('error', () => {});
  socket.bind();
  socks.set(d.ip, rec);
  return rec;
}

function sendVisca(ip, bytes) {
  const d = findDevice(ip);
  const rec = sockFor(d);
  const buf = Buffer.from(bytes);
  return new Promise((resolve, reject) => {
    rec.socket.send(buf, d.port, d.ip, (err) => {
      if (err) return reject(new Error(`camera unreachable (${err.code || err.message})`));
      resolve({ ok: true });
    });
  });
}

// ── VISCA command builders ───────────────────────────────────────────────────
const clamp = (n, lo, hi, dflt) => { const v = parseInt(n); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt; };

// pan dir: 1 left, 2 right, 3 none   |   tilt dir: 1 up, 2 down, 3 none
const PAN_TILT = {
  left:      [1, 3], right:     [2, 3],
  up:        [3, 1], down:      [3, 2],
  leftup:    [1, 1], rightup:   [2, 1],
  leftdown:  [1, 2], rightdown: [2, 2],
};

module.exports = {
  list: () => ptzDevices().map(d => ({ name: d.name, ip: d.ip, port: d.port })),

  move: (ip, dir, speed) => {
    const pt = PAN_TILT[dir];
    if (!pt) throw new Error(`bad direction "${dir}"`);
    const pan = clamp(speed, 1, 24, 12);
    const tilt = Math.min(pan, 20);
    return sendVisca(ip, [0x81, 0x01, 0x06, 0x01, pan, tilt, pt[0], pt[1], 0xFF]);
  },
  stop: (ip) => sendVisca(ip, [0x81, 0x01, 0x06, 0x01, 0x10, 0x10, 0x03, 0x03, 0xFF]),

  home: (ip) => sendVisca(ip, [0x81, 0x01, 0x06, 0x04, 0xFF]),

  zoom: (ip, dir) => {
    if (dir === 'stop') return sendVisca(ip, [0x81, 0x01, 0x04, 0x07, 0x00, 0xFF]);
    if (dir === 'in')   return sendVisca(ip, [0x81, 0x01, 0x04, 0x07, 0x25, 0xFF]); // tele, speed 5
    if (dir === 'out')  return sendVisca(ip, [0x81, 0x01, 0x04, 0x07, 0x35, 0xFF]); // wide, speed 5
    throw new Error(`bad zoom "${dir}"`);
  },

  focus: (ip, dir) => {
    if (dir === 'auto') return sendVisca(ip, [0x81, 0x01, 0x04, 0x38, 0x02, 0xFF]);
    if (dir === 'stop') return sendVisca(ip, [0x81, 0x01, 0x04, 0x08, 0x00, 0xFF]);
    if (dir === 'in')   return sendVisca(ip, [0x81, 0x01, 0x04, 0x08, 0x03, 0xFF]); // near
    if (dir === 'out')  return sendVisca(ip, [0x81, 0x01, 0x04, 0x08, 0x02, 0xFF]); // far
    throw new Error(`bad focus "${dir}"`);
  },

  preset: (ip, action, n) => {
    const num = clamp(n, 0, 127, 0);
    if (action === 'call') return sendVisca(ip, [0x81, 0x01, 0x04, 0x3F, 0x02, num, 0xFF]);
    if (action === 'set')  return sendVisca(ip, [0x81, 0x01, 0x04, 0x3F, 0x01, num, 0xFF]);
    throw new Error(`bad preset action "${action}"`);
  },
};
