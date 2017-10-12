var events = require('events');
var express = require('express');
var socket_io = require('socket.io');

var ipc = require('./ipc');

var app = express();
var server = app.listen(3000, '127.0.0.1', function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('[web] http server listening at http://%s:%s', host, port); // TODO #4261 ??
});
var io = socket_io.listen(server);

var modules = {};
var ipcClient = new ipc.client(process.argv[2], function(event, namespace, args) {
  switch (event) {
    case 'load': // `args` is namespace
      // set up emitter
      var emitter = new events.EventEmitter;
      emitter._emit = emitter.emit;
      emitter.emit = function() {
        ipcClient.send(namespace, [].slice.call(arguments));
      };
      modules[namespace] = emitter;

      // set up router & socket
      var router = express.Router();
      router.static = express.static;

      var socket = io.of(namespace);

      // load worker
      var worker = require(args);
      new worker(emitter, router, socket);

      // add route
      app.use(namespace, router);
      break;

    case 'emit':
      var emitter = modules[namespace];
      if (emitter != null) {
        emitter._emit.apply(emitter, args);
      } else {
        console.error('[web] ipc client received message for unknown namespace "%s"', namespace);
      }
      break;

    default:
      console.error('[web] ipc client received unknown event type "%s"', event);
  }
});
