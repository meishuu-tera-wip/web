var path = require('path');
var events = require('events');
var child_process = require('child_process');

var ipc = require('./ipc');

/*******
 * Web *
 *******/
var singleton = null;

function Web() {
  if (!singleton) {
    this.child = null; 
    this.modules = {};
    singleton = this;
  }
}

Web.load = function() {
  if (!singleton) new Web();
  return singleton.load.apply(singleton, arguments);
};

Web.prototype._init = function() {
  var self = this;

  // set up IPC
  var ipcPath = '\\\\.\\pipe\\tera-proxy_web_' + process.pid;
  self.ipcServer = new ipc.server(ipcPath, function(namespace, args) {
    var emitter = self.modules[namespace];
    if (emitter != null) {
      emitter._emit.apply(emitter, args);
    } else {
      console.error('[web] ipc server received message for unknown namespace "%s"', namespace);
    }
  });

  // set up child process
  self.child = child_process.fork(path.join(__dirname, 'worker'), [ipcPath]);
  self.child.on('exit', function() {
    self.child = null;
  });
};

Web.prototype.load = function(namespace, modulePath) {
  if (!singleton) new Web();
  var self = singleton;
  if (self.child == null) self._init(); // lazy load

  // set up emitter
  var emitter = new events.EventEmitter;
  emitter._emit = emitter.emit;
  emitter.emit = function WebIpcEmit() {
    var args = [].slice.call(arguments);
    self.ipcServer.send('emit', namespace, args);
  };
  self.modules[namespace] = emitter;

  // load over ipc
  self.ipcServer.send('load', namespace, modulePath);
  return emitter;
};

Web.prototype.destructor = function() {
  if (singleton && singleton.child != null) {
    singleton.child.kill();
  }
};

/***********
 * Exports *
 ***********/
module.exports = Web;
