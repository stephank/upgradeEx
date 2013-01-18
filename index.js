var http = require('http');

// Add `upgradeEx` and `connectEx` events to a server.
exports.addEvents = function(server) {
  server.on('upgrade', exports.wrap(function(req, res) {
    server.emit('upgradeEx', req, res);
  }));
  server.on('connect', exports.wrap(function(req, res) {
    server.emit('connectEx', req, res);
  }));
};

// Wrap a new-style upgrade/connect callback with an old-style signature.
exports.wrap = function(callback) {
  return function(req, sock, head) {
    var res;
    // Check if we need to wrap at all.
    if (sock.switchProtocols) {
      res = sock;
    }
    else {
      // 'shouldKeepAlive == false' ensures we send 'Connection: close' for
      // responses that don't successfully switch protocols.
      res = new http.ServerResponse(req);
      res.shouldKeepAlive = false;
      res.useChunkedEncodingByDefault = false;

      // The alternate exit for a handler that accepts the upgrade.
      var switchCb = null;
      res.switchProtocols = function(fn) {
        switchCb = fn;
        this.end();
      };

      res.assignSocket(sock);
      res.on('finish', function() {
        res.detachSocket(sock);

        // When finished, either upgrade, or close the socket.
        if (!switchCb) {
          sock.destroySoon();
          return;
        }

        // Push the body part already received back in the socket buffer.
        if (head.length) {
          sock.push(head);
        }

        switchCb(sock);
      });
    }
    // Now run the new-style callback.
    callback(req, res);
  };
};
