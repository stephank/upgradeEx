## upgradeEx [![Build Status](https://secure.travis-ci.org/stephank/upgradeEx.png)](http://travis-ci.org/stephank/upgradeEx)

A stand-alone version of [this Node.js PR], this module gives you a
`ServerResponse` in `upgrade` and `connect` events.

 [this Node.js PR]: https://github.com/joyent/node/pull/3036

    var http = require('http');
    var upgradeEx = require('upgrade-ex');

    var server = http.createServer();
    upgradeEx.addEvents(server);

    server.on('upgradeEx', function(req, res) {
      res.writeHead(101, {
        'Connection': 'Upgrade',
        'Upgrade': 'Echo'
      });

      res.switchProtocols(function(sock) {
        sock.on('readable', function() {
          var chunk = sock.read();
          sock.write(chunk);
        });
      });
    });

Alternatively, without `addEvents()`:

    server.on('upgrade', upgradeEx.wrap(function(req, res) {
      /* ... */;
    }));

MIT-licensed
