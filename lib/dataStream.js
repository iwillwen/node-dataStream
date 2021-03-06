/*!
 * node-dataStream
 *
 * Simple and Powerful data stream for Node.js IO.
 *
 * Author:
 *  Will Wen Gunn (willwengunn@gmail.com)
 */

var Stream       = require('stream').Stream;
var bufferhelper = require('bufferhelper');
var util         = require('util');

function dataStream(opt) {
  var self = this;
  self.opt = opt || {};
  self.writable = (self.opt.writable !== undefined ? self.opt.writable : true);
  self.readable = (self.opt.readable !== undefined ? self.opt.readable : true);
  self.paused = false;
  self.buffer = new bufferhelper();
  self.pausedCache = new bufferhelper();
  self.data = self.opt.data || function (chunk) {
    return chunk;
  };
}
util.inherits(dataStream, Stream);
dataStream.prototype.out = function () {
  var data = this.buffer.toBuffer();
  this.empty();
  this.emit('data', data);
  this.emit('end');
  return this;
};
dataStream.prototype.write = function (chunk) {
  if (typeof chunk == 'string') chunk = new Buffer(chunk);

  if ('function' == typeof this.data) {
    chunk = this.data(chunk);
  }
  // Check the data type again.
  if (typeof chunk == 'string') chunk = new Buffer(chunk);

  if (this.writable) {
    this.buffer.concat(chunk);
    if (this.readable) this.emit('data', chunk);
  } else {
    this.pausedCache.concat(chunk);
  }
  return this;
};
dataStream.prototype.empty = function () {
  this.buffer = new bufferhelper();
  this.pausedCache = new bufferhelper();
  this.writable = this.writable || true;
  this.readable = this.readable || true;
  this.paused = false;
  return this;
};
dataStream.prototype.end = function (chunk) {
  if (chunk)
    this.write(chunk);

  this.emit('complete', this.buffer.toBuffer().toString());
  this.ended = true;
  if (this.readable) this.emit('end');
  return this;
};
dataStream.prototype.pause = function () {
  this.paused = true;
  return this;
};
dataStream.prototype.resume = function () {
  this.emit('data', this.pausedCache.toBuffer());
  this.pausedCache = new bufferhelper();
  if (this.ended) this.emit('end');
  return this;
};
dataStream.prototype.destroy = function () {
  this.empty();
  return this;
};
dataStream.prototype.body = function () {
  return this.buffer.toBuffer();
};
dataStream.prototype.ok = function () {
  if (this.ended) {
    this.emit('data', this.buffer.toBuffer());
    this.emit('end');
  } else {
    this.on('complete', function () {
      this.emit('data', this.buffer.toBuffer());
      this.emit('end');
    });
  }
  return this;
};
module.exports = dataStream;