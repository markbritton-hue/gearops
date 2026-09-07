// ── gear-control.js ──────────────────────────────────────────────────────────
// Thin browser client for the GearOps device bridge in server.js.
// Served from the same origin, so no CORS concerns. All calls resolve to the
// parsed JSON body and reject on a non-2xx response.
//
//   await gear.atemList()                     -> [{ name, ip, connected, mixEffects, inputs }]
//   await gear.atemState('192.168.0.250')
//   await gear.atemProgram('192.168.0.250', 3)
//   await gear.atemPreview('192.168.0.250', 3)
//   await gear.atemCut('192.168.0.250')
//   await gear.atemAuto('192.168.0.250')

(function (global) {
  async function call(path, params) {
    const qs = params ? '?' + new URLSearchParams(params) : '';
    const r = await fetch(path + qs, { method: 'GET' });
    let body = null;
    try { body = await r.json(); } catch { /* empty body */ }
    if (!r.ok || (body && body.ok === false)) {
      throw new Error((body && body.error) || `${path} failed (${r.status})`);
    }
    return body;
  }

  const gear = {
    atemList:    ()               => call('/atem/list'),
    atemState:   (ip)             => call('/atem/state',   { ip }),
    atemProgram: (ip, input, me)  => call('/atem/program', me != null ? { ip, input, me } : { ip, input }),
    atemPreview: (ip, input, me)  => call('/atem/preview', me != null ? { ip, input, me } : { ip, input }),
    atemCut:     (ip, me)         => call('/atem/cut',     me != null ? { ip, me } : { ip }),
    atemAuto:    (ip, me)         => call('/atem/auto',    me != null ? { ip, me } : { ip }),

    //   await gear.hyperdeckList()  -> [{ name, ip, connected, status, recording, recordingTimeLeft }]
    hyperdeckList:   ()   => call('/hyperdeck/list'),
    hyperdeckState:  (ip) => call('/hyperdeck/state',  { ip }),
    hyperdeckRecord: (ip) => call('/hyperdeck/record', { ip }),
    hyperdeckStop:   (ip) => call('/hyperdeck/stop',   { ip }),
    hyperdeckPlay:   (ip) => call('/hyperdeck/play',   { ip }),

    //   await gear.webPresenterState(ip) -> { connected, status, streaming, bitrateMbps, duration, platform }
    webPresenterList:  ()        => call('/webpresenter/list'),
    webPresenterState: (ip)      => call('/webpresenter/state', { ip }),
    webPresenterStream:(ip, on)  => call('/webpresenter/stream', { ip, on: on ? 'true' : 'false' }),
  };

  global.gear = gear;
  if (typeof module !== 'undefined' && module.exports) module.exports = gear;
})(typeof window !== 'undefined' ? window : globalThis);
