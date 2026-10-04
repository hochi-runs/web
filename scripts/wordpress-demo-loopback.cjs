// Preloaded only into the temporary Playground child. Its CLI otherwise
// listens on every interface, which is unsuitable for an auto-login demo.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node preloads this CommonJS file before the Playground CLI.
const net = require('node:net');
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (args[0] && typeof args[0] === 'object' && 'port' in args[0]) {
    args[0] = { ...args[0], host: '127.0.0.1' };
  } else if (typeof args[0] === 'number' || (typeof args[0] === 'string' && /^\d+$/.test(args[0]))) {
    if (typeof args[1] === 'string') args[1] = '127.0.0.1';
    else args.splice(1, 0, '127.0.0.1');
  }
  return originalListen.apply(this, args);
};
