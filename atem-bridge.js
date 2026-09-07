// ── ATEM bridge ──────────────────────────────────────────────────────────────
// Holds persistent connections to every ATEM tagged `atems` (with an IP) in
// devices.json and exposes a small control/state surface. UDP protocol on
// port 9910 via the atem-connection package — browsers can't speak it directly,
// so server.js proxies HTTP endpoints to the functions here.

const fs = require('fs');
const path = require('path');
const { Atem, Enums } = require('atem-connection');

const DEVICES_PATH = path.join(__dirname, 'devices.json');

// ip -> { name, ip, atem, connected, lastError }
const conns = new Map();

function atemDevices() {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DEVICES_PATH, 'utf8')); } catch { return []; }
  return list
    .filter(d => (d.category === 'atems' || d.type === 'atems') && d.ip)
    .map(d => ({ name: d.name, ip: String(d.ip).split(':')[0].split('/')[0] }));
}

function attach(name, ip) {
  const atem = new Atem();
  const rec = { name, ip, atem, connected: false, lastError: null };
  conns.set(ip, rec);

  atem.on('connected', () => { rec.connected = true;  rec.lastError = null; console.log(`  ATEM connected:    ${name} (${ip})`); });
  atem.on('disconnected', () => { rec.connected = false; console.log(`  ATEM disconnected: ${name} (${ip})`); });
  atem.on('error', (e) => { rec.lastError = String(e && e.message || e); });

  atem.connect(ip).catch(e => { rec.lastError = String(e && e.message || e); });
  return rec;
}

function init() {
  const devices = atemDevices();
  console.log(`  ATEM bridge: connecting to ${devices.length} switcher(s)`);
  for (const d of devices) if (!conns.has(d.ip)) attach(d.name, d.ip);

  // Re-scan devices.json periodically so added/removed ATEMs are picked up
  setInterval(() => {
    const want = new Map(atemDevices().map(d => [d.ip, d.name]));
    for (const [ip, name] of want) if (!conns.has(ip)) attach(name, ip);
    for (const [ip, rec] of conns) {
      if (!want.has(ip)) { try { rec.atem.disconnect(); } catch {} conns.delete(ip); }
    }
  }, 30000);
}

function require_(ip) {
  const rec = conns.get(ip);
  if (!rec) throw new Error(`No ATEM registered at ${ip} — add it to devices.json under the "atems" category`);
  if (!rec.connected) throw new Error(`ATEM at ${ip} is not connected${rec.lastError ? ` (${rec.lastError})` : ''}`);
  return rec;
}

function inputList(state) {
  // Every source the ATEM knows about, with the names set in ATEM Software
  // Control. internalPortType 0 = External = a physical SDI/HDMI input
  // (a camera), vs. black, colour bars, media players, SuperSource, MEs, etc.
  return Object.keys(state.inputs || {})
    .map(Number)
    .filter(id => id > 0 && id < 1000)          // drop ME outputs / aux / multiviewer pseudo-ids
    .sort((a, b) => a - b)
    .map(id => {
      const inp = state.inputs[id] || {};
      return {
        id,
        label: inp.longName || inp.shortName || `Input ${id}`,
        short: inp.shortName || inp.longName || `In${id}`,
        isCamera: inp.internalPortType === Enums.InternalPortType.External,
      };
    });
}

function summary(rec) {
  const base = { name: rec.name, ip: rec.ip, connected: rec.connected, lastError: rec.lastError };
  if (!rec.connected) return base;
  const state = rec.atem.state;
  const mes = (state.video.mixEffects || []).map((me, i) => ({
    me: i,
    program: me ? me.programInput : null,
    preview: me ? me.previewInput : null,
    inTransition: me ? me.inTransition : false,
  }));
  return {
    ...base,
    model: state.info && state.info.productIdentifier || null,
    mixEffects: mes,
    inputs: inputList(state),
  };
}

module.exports = {
  init,
  list: () => atemDevices().map(d => {
    const rec = conns.get(d.ip);
    return rec ? summary(rec) : { name: d.name, ip: d.ip, connected: false };
  }),
  state: (ip) => summary(require_(ip)),
  program: (ip, input, me = 0) => require_(ip).atem.changeProgramInput(Number(input), Number(me)),
  preview: (ip, input, me = 0) => require_(ip).atem.changePreviewInput(Number(input), Number(me)),
  cut:  (ip, me = 0) => require_(ip).atem.cut(Number(me)),
  auto: (ip, me = 0) => require_(ip).atem.autoTransition(Number(me)),
};
