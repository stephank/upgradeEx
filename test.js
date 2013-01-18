#!/usr/bin/env node

var http = require('http');
var upgradeEx = require('./');

var HOST = '127.0.0.1';
var PORT = 59081;
var TEST_STRING = 'Hello world!';
var UPGRADE_HEADERS = {
  'Connection': 'Upgrade',
  'Upgrade': 'Echo'
};

var server = http.createServer();
upgradeEx.addEvents(server);
server.on('upgradeEx', function(req, res) {
  console.log("Server got upgrade request");

  res.writeHead(101, UPGRADE_HEADERS);
  res.switchProtocols(function(sock) {

    // Use old-style streams here,
    // so we can test on both 0.8 and 0.9.
    sock.on('data', function(chunk) {
      sock.write(chunk);
    });

    sock.on('end', function() {
      sock.end();
    });

  });
});

server.listen(PORT, HOST, function() {
  var req = http.request({
    host: HOST,
    port: PORT,
    headers: UPGRADE_HEADERS
  });
  req.on('response', function(res) {
    throw new Error("Expected upgrade, got: " + res.statusCode);
  });
  req.on('upgrade', function(res, sock, head) {

    console.log("Client got upgrade response");
    server.close();

    sock.setEncoding('utf-8');
    if (head.length) {
      sock.push(head);
    }

    var data = '';
    sock.on('data', function(chunk) {
      data += chunk;
    });

    sock.on('end', function() {
      if (data === TEST_STRING)
        console.log("Client got matching echo");
      else
        throw new Error("Echo did not match, got: " + data);
    });
    sock.end(TEST_STRING);

  });
  req.end();
});
