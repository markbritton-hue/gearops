// ── HyperDeck bridge ─────────────────────────────────────────────────────────
// Persistent TCP connections to every device tagged `hyperdecks` (with an IP)
// in devices.json, speaking the Blackmagic HyperDeck Ethernet Protocol on
// port 9993. Line-oriented text, CRLF-terminated. Browsers can't open raw TCP,
// so server.js proxies HTTP endpoints to the functions here.

const fs = require('fs');
const net = require('net');
const path = require('path');

const PORT = 9993;
const DEVICES_PATH = path.join(__dirname, 'devices.json');

// ip -> connection record
const conns = new Map();

function hyperdeckDevices() {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DEVICES_PATH, 'utf8')); } catch { return []; }
  return list
    .filter(d => (d.category === 'hyperdecks' || d.type === 'hyperdecks') && d.ip)
    .map(d => ({ name: d.name, ip: String(d.ip).split(':')[0].split('/')[0] }));
}

function makeRec(name, ip) {
  return {
    name, ip,
    socket: null,
    connected: false,
    lastError: null,
    buf: '',
    retry: null,
    pollTimer: null,
    // parsed state
    transport: {},   // status, speed, clip id, slot id, display timecode, timecode, video format, loop
    slot: {},         // slot id, status, volume name, recording time, video format
  };
}

function parseBlock(lines) {
  // lines: ["<code> <label>:", "key: value", ...]  OR  ["<code> <label>"]
  const first = lines[0];
  const m = first.match(/^(\d{3})\s+(.*?):?\s*$/);
  if (!m) return null;
  const code = parseInt(m[1]);
  const kv = {};
  for (let i = 1; i < lines.length; i++) {
    const idx = lines[i].indexOf(':');
    if (idx === -1) continue;
    kv[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
  }
  return { code, kv };
}

function handleBlock(rec, block) {
  const { code, kv } = block;
  // transport info: 208 (sync reply) / 508 (async notification)
  if (code === 208 || code === 508) Object.assign(rec.transport, kv);
  // slot info: 202 (sync) / 502 (async)
  else if (code === 202 || code === 502) Object.assign(rec.slot, kv);
  // connection info on connect: 500
  else if (code === 500) { /* protocol version / model — informational */ }
  // errors are 1xx
  else if (code >= 100 && code < 200) rec.lastError = lines0(block);
}
function lines0(block) { return `${block.code} ${Object.entries(block.kv).map(([k, v]) => `${k}: ${v}`).join(', ') || ''}`.trim(); }

function onData(rec, chunk) {
  rec.buf += chunk;
  // Responses are groups of CRLF lines. A block with a trailing ':' on its
  // header line continues until a blank line; a bare status line stands alone.
  let nl;
  let pending = [];
  const flush = () => { if (pending.length) { const b = parseBlock(pending); if (b) handleBlock(rec, b); pending = []; } };
  while ((nl = rec.buf.indexOf('\n')) !== -1) {
    const line = rec.buf.slice(0, nl).replace(/\r$/, '');
    rec.buf = rec.buf.slice(nl + 1);
    if (line === '') { flush(); continue; }
    if (pending.length === 0) {
      const m = line.match(/^(\d{3})\s+(.*)$/);
      if (!m) continue;                       // stray line, ignore
      if (/:$/.test(line)) pending.push(line); // multi-line block starts
      else { const b = parseBlock([line]); if (b) handleBlock(rec, b); } // single-line response
    } else {
      pending.push(line);
    }
  }
}

function attach(name, ip) {
  const rec = conns.get(ip) || makeRec(name, ip);
  rec.name = name;
  conns.set(ip, rec);

  const connect = () => {
    if (rec.socket) return;
    const s = net.createConnection({ host: ip, port: PORT });
    rec.socket = s;
    s.setEncoding('utf8');
    s.setKeepAlive(true, 10000);
    s.on('connect', () => {
      rec.connected = true; rec.lastError = null;
      console.log(`  HyperDeck connected:    ${name} (${ip})`);
      s.write('notify: transport: true\r\n');
      s.write('notify: slot: true\r\n');
      s.write('transport info\r\n');
      s.write('slot info\r\n');
      clearInterval(rec.pollTimer);
      rec.pollTimer = setInterval(() => {
        if (rec.connected) { try { s.write('transport info\r\n'); s.write('slot info\r\n'); } catch {} }
      }, 5000);
    });
    s.on('data', (d) => onData(rec, d));
    s.on('error', (e) => { rec.lastError = String(e && e.message || e); });
    s.on('close', () => {
      rec.connected = false; rec.socket = null; rec.buf = '';
      clearInterval(rec.pollTimer);
      console.log(`  HyperDeck disconnected: ${name} (${ip})`);
      clearTimeout(rec.retry);
      rec.retry = setTimeout(connect, 4000);
    });
  };
  connect();
  return rec;
}

function init() {
  const devices = hyperdeckDevices();
  console.log(`  HyperDeck bridge: connecting to ${devices.length} deck(s)`);
  for (const d of devices) if (!conns.has(d.ip)) attach(d.name, d.ip);

  setInterval(() => {
    const want = new Map(hyperdeckDevices().map(d => [d.ip, d.name]));
    for (const [ip, name] of want) if (!conns.has(ip)) attach(name, ip);
    for (const [ip, rec] of conns) {
      if (!want.has(ip)) {
        clearTimeout(rec.retry); clearInterval(rec.pollTimer);
        try { rec.socket && rec.socket.destroy(); } catch {}
        conns.delete(ip);
      }
    }
  }, 30000);
}

function req(ip) {
  const rec = conns.get(ip);
  if (!rec) throw new Error(`No HyperDeck registered at ${ip} — add it to devices.json under the "hyperdecks" category`);
  if (!rec.connected) throw new Error(`HyperDeck at ${ip} is not connected${rec.lastError ? ` (${rec.lastError})` : ''}`);
  return rec;
}

function send(ip, line) {
  const rec = req(ip);
  rec.socket.write(line.endsWith('\r\n') ? line : line + '\r\n');
  // Give the deck a beat to answer, then the poller refreshes state anyway
  return new Promise(res => setTimeout(res, 150));
}

function secsToClock(s) {
  const n = parseInt(s);
  if (!Number.isFinite(n)) return null;
  const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), sec = n % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function summary(rec) {
  const base = { name: rec.name, ip: rec.ip, connected: rec.connected, lastError: rec.lastError };
  if (!rec.connected) return base;
  const t = rec.transport, sl = rec.slot;
  return {
    ...base,
    status: t.status || null,                       // preview | stopped | play | forward | rewind | jog | shuttle | record
    recording: t.status === 'record',
    speed: t.speed !== undefined ? Number(t.speed) : null,
    clip: t['clip id'] || null,
    timecode: t['display timecode'] || t.timecode || null,
    videoFormat: t['video format'] || null,
    slotStatus: sl.status || null,                  // empty | mounted | error
    recordingTimeLeft: secsToClock(sl['recording time']),
  };
}

module.exports = {
  init,
  list: () => hyperdeckDevices().map(d => {
    const rec = conns.get(d.ip);
    return rec ? summary(rec) : { name: d.name, ip: d.ip, connected: false };
  }),
  state: (ip) => summary(req(ip)),
  record: (ip) => send(ip, 'record'),
  stop:   (ip) => send(ip, 'stop'),
  play:   (ip) => send(ip, 'play'),
};
