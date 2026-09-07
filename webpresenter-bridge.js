// ── Web Presenter bridge ─────────────────────────────────────────────────────
// Persistent TCP connection to the Blackmagic Web Presenter, speaking the
// Blackmagic Streaming Encoder Ethernet Protocol on port 9977. Line-oriented
// text (LF), state arrives in "HEADER:\nKey: Value\n...\n\n" blocks.
//
// Which device: any devices.json entry whose name contains "web presenter"
// (case-insensitive) and has an IP. Usually one; multiple are supported.

const fs = require('fs');
const net = require('net');
const path = require('path');

const PORT = 9977;
const DEVICES_PATH = path.join(__dirname, 'devices.json');

const conns = new Map(); // ip -> record

function wpDevices() {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DEVICES_PATH, 'utf8')); } catch { return []; }
  return list
    .filter(d => d.ip && /web\s*presenter/i.test(d.name || ''))
    .map(d => ({ name: d.name, ip: String(d.ip).split(':')[0].split('/')[0] }));
}

function makeRec(name, ip) {
  return {
    name, ip,
    socket: null, connected: false, lastError: null,
    buf: '', retry: null, pollTimer: null,
    identity: {},       // Model, Label
    streamState: {},     // Status, Bitrate, Duration, Cache Used
    streamSettings: {},   // Current Platform, Video Mode, ...
  };
}

function handleBlock(rec, header, kv) {
  const h = header.toUpperCase();
  if (h === 'IDENTITY') Object.assign(rec.identity, kv);
  else if (h === 'STREAM STATE') Object.assign(rec.streamState, kv);
  else if (h === 'STREAM SETTINGS') Object.assign(rec.streamSettings, kv);
  // ignore everything else (network, audio, ui, version, ...)
}

function onData(rec, chunk) {
  rec.buf += chunk;
  let nl;
  // Accumulate lines into the current block until a blank line closes it.
  rec._block = rec._block || null;   // { header, kv }
  while ((nl = rec.buf.indexOf('\n')) !== -1) {
    const line = rec.buf.slice(0, nl).replace(/\r$/, '');
    rec.buf = rec.buf.slice(nl + 1);

    if (line === 'ACK') { rec.lastError = null; continue; }
    if (line === 'NACK') { rec.lastError = 'device rejected the last command (NACK)'; continue; }

    if (rec._block) {
      if (line === '') { handleBlock(rec, rec._block.header, rec._block.kv); rec._block = null; continue; }
      const idx = line.indexOf(':');
      if (idx !== -1) rec._block.kv[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      continue;
    }

    // expecting a new block header "SOMETHING:"
    if (/^[A-Za-z].*:$/.test(line)) {
      const header = line.slice(0, -1).trim();
      if (/^END PRELUDE$/i.test(header)) continue;
      rec._block = { header, kv: {} };
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
      console.log(`  Web Presenter connected:    ${name} (${ip})`);
      clearInterval(rec.pollTimer);
      // Status is pushed on change; Bitrate/Duration/Cache Used must be polled.
      rec.pollTimer = setInterval(() => {
        if (rec.connected) { try { s.write('STREAM STATE:\n\n'); } catch {} }
      }, 3000);
    });
    s.on('data', (d) => onData(rec, d));
    s.on('error', (e) => { rec.lastError = String(e && e.message || e); });
    s.on('close', () => {
      rec.connected = false; rec.socket = null; rec.buf = ''; rec._block = null;
      clearInterval(rec.pollTimer);
      console.log(`  Web Presenter disconnected: ${name} (${ip})`);
      clearTimeout(rec.retry);
      rec.retry = setTimeout(connect, 4000);
    });
  };
  connect();
  return rec;
}

function init() {
  const devices = wpDevices();
  console.log(`  Web Presenter bridge: connecting to ${devices.length} device(s)`);
  for (const d of devices) if (!conns.has(d.ip)) attach(d.name, d.ip);

  setInterval(() => {
    const want = new Map(wpDevices().map(d => [d.ip, d.name]));
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
  if (!rec) throw new Error(`No Web Presenter registered at ${ip} — its devices.json name must contain "Web Presenter" and have an IP`);
  if (!rec.connected) throw new Error(`Web Presenter at ${ip} is not connected${rec.lastError ? ` (${rec.lastError})` : ''}`);
  return rec;
}

function setStream(ip, on) {
  const rec = req(ip);
  rec.socket.write(`STREAM STATE:\nAction: ${on ? 'Start' : 'Stop'}\n\n`);
  return new Promise(res => setTimeout(res, 200));
}

function fmtDuration(d) {
  // protocol format DD:HH:MM:SS
  if (!d) return null;
  const p = d.split(':');
  if (p.length === 4) return `${+p[0] ? p[0] + 'd ' : ''}${p[1]}:${p[2]}:${p[3]}`;
  return d;
}

function summary(rec) {
  const base = { name: rec.name, ip: rec.ip, connected: rec.connected, lastError: rec.lastError };
  if (!rec.connected) return base;
  const st = rec.streamState;
  const bitrate = st.Bitrate !== undefined ? Number(st.Bitrate) : null;
  return {
    ...base,
    model: rec.identity.Model || null,
    status: st.Status || null,                 // Idle | Connecting | Streaming | Interrupted
    streaming: st.Status === 'Streaming',
    bitrate,                                     // bits/sec
    bitrateMbps: bitrate != null ? +(bitrate / 1e6).toFixed(2) : null,
    duration: fmtDuration(st.Duration),
    cacheUsed: st['Cache Used'] !== undefined ? Number(st['Cache Used']) : null,  // percent
    platform: rec.streamSettings['Current Platform'] || null,
  };
}

module.exports = {
  init,
  list: () => wpDevices().map(d => {
    const rec = conns.get(d.ip);
    return rec ? summary(rec) : { name: d.name, ip: d.ip, connected: false };
  }),
  state: (ip) => summary(req(ip)),
  start: (ip) => setStream(ip, true),
  stop:  (ip) => setStream(ip, false),
};
