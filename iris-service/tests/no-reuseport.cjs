// Test-only preload for Windows, which rejects the reusePort listen option that
// Linux hosts (Replit, Render) accept.
const net = require("net");
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (options, ...rest) {
  if (options && typeof options === "object") {
    options = { ...options };
    delete options.reusePort;
  }
  return listen.call(this, options, ...rest);
};
