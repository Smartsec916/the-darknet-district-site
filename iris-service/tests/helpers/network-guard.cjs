// Preloaded into a locally started Iris server (node --require) so a test run CANNOT reach production or anything
// private, whatever the environment variables say. Every outbound TCP connection is checked against an allow-list
// of this machine plus the public data providers Iris reads; everything else (Neon, Render, Brevo, thedarknetdistrict.com,
// any other host) is refused with an error and one line on stderr (host only, never a URL, header or key).
const net = require("node:net");
const ALLOWED_EXACT = new Set(["localhost", "127.0.0.1", "::1"]);
const ALLOWED_SUFFIX = [
  "met.no", "weather.gov", "usgs.gov", "openstreetmap.org",
  "bbci.co.uk", "theguardian.com", "npr.org", "nasa.gov", "cisa.gov", "bleepingcomputer.com", "arstechnica.com",
];
const BLOCKED_ALWAYS = /neon\.tech|onrender\.com|brevo|sendinblue|thedarknetdistrict\.com|firebase|googleapis|openai\.com/i;
function allowed(host) {
  if (!host) return true; // unix sockets and the like carry no host
  const h = String(host).toLowerCase().replace(/\.$/, "");
  if (BLOCKED_ALWAYS.test(h)) return false;
  if (ALLOWED_EXACT.has(h) || /^127\.\d+\.\d+\.\d+$/.test(h)) return true;
  return ALLOWED_SUFFIX.some(s => h === s || h.endsWith("." + s));
}
const original = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  // net.connect() hands over a normalised [options, callback] pair; socket.connect() may get options, (port, host) or a path
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = first && typeof first === "object" ? first.host ?? first.hostname : typeof first === "number" ? args[1] : undefined;
  if (typeof first === "object" && first && first.path) return original.apply(this, args); // unix socket
  if (!allowed(host)) {
    process.stderr.write(`[network-guard] blocked connection to ${host}\n`);
    const error = Object.assign(new Error(`network-guard: connection to ${host} is not allowed in this test run`), { code: "EIRISGUARD" });
    process.nextTick(() => this.destroy(error));
    return this;
  }
  return original.apply(this, args);
};
module.exports = { allowed };
