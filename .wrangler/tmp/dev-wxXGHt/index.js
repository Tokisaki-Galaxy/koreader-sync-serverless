var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
    init_modules_watch_stub();
  }
});

// (disabled):buffer
var require_buffer = __commonJS({
  "(disabled):buffer"() {
    init_modules_watch_stub();
  }
});

// node_modules/js-md5/src/md5.js
var require_md5 = __commonJS({
  "node_modules/js-md5/src/md5.js"(exports, module) {
    init_modules_watch_stub();
    (function() {
      "use strict";
      var INPUT_ERROR = "input is invalid type";
      var FINALIZE_ERROR = "finalize already called";
      var WINDOW = typeof window === "object";
      var root = WINDOW ? window : {};
      if (root.JS_MD5_NO_WINDOW) {
        WINDOW = false;
      }
      var WEB_WORKER = !WINDOW && typeof self === "object";
      var NODE_JS = !root.JS_MD5_NO_NODE_JS && typeof process === "object" && process.versions && process.versions.node;
      if (NODE_JS) {
        root = global;
      } else if (WEB_WORKER) {
        root = self;
      }
      var COMMON_JS = !root.JS_MD5_NO_COMMON_JS && typeof module === "object" && module.exports;
      var AMD = typeof define === "function" && define.amd;
      var ARRAY_BUFFER = !root.JS_MD5_NO_ARRAY_BUFFER && typeof ArrayBuffer !== "undefined";
      var HEX_CHARS = "0123456789abcdef".split("");
      var EXTRA = [128, 32768, 8388608, -2147483648];
      var SHIFT = [0, 8, 16, 24];
      var OUTPUT_TYPES = ["hex", "array", "digest", "buffer", "arrayBuffer", "base64"];
      var BASE64_ENCODE_CHAR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
      var blocks = [], buffer8;
      if (ARRAY_BUFFER) {
        var buffer = new ArrayBuffer(68);
        buffer8 = new Uint8Array(buffer);
        blocks = new Uint32Array(buffer);
      }
      var isArray = Array.isArray;
      if (root.JS_MD5_NO_NODE_JS || !isArray) {
        isArray = /* @__PURE__ */ __name(function(obj) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        }, "isArray");
      }
      var isView = ArrayBuffer.isView;
      if (ARRAY_BUFFER && (root.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW || !isView)) {
        isView = /* @__PURE__ */ __name(function(obj) {
          return typeof obj === "object" && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        }, "isView");
      }
      var formatMessage = /* @__PURE__ */ __name(function(message) {
        var type = typeof message;
        if (type === "string") {
          return [message, true];
        }
        if (type !== "object" || message === null) {
          throw new Error(INPUT_ERROR);
        }
        if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          return [new Uint8Array(message), false];
        }
        if (!isArray(message) && !isView(message)) {
          throw new Error(INPUT_ERROR);
        }
        return [message, false];
      }, "formatMessage");
      var createOutputMethod = /* @__PURE__ */ __name(function(outputType) {
        return function(message) {
          return new Md5(true).update(message)[outputType]();
        };
      }, "createOutputMethod");
      var createMethod = /* @__PURE__ */ __name(function() {
        var method = createOutputMethod("hex");
        if (NODE_JS) {
          method = nodeWrap(method);
        }
        method.create = function() {
          return new Md5();
        };
        method.update = function(message) {
          return method.create().update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
          var type = OUTPUT_TYPES[i];
          method[type] = createOutputMethod(type);
        }
        return method;
      }, "createMethod");
      var nodeWrap = /* @__PURE__ */ __name(function(method) {
        var crypto2 = require_crypto();
        var Buffer2 = require_buffer().Buffer;
        var bufferFrom;
        if (Buffer2.from && !root.JS_MD5_NO_BUFFER_FROM) {
          bufferFrom = Buffer2.from;
        } else {
          bufferFrom = /* @__PURE__ */ __name(function(message) {
            return new Buffer2(message);
          }, "bufferFrom");
        }
        var nodeMethod = /* @__PURE__ */ __name(function(message) {
          if (typeof message === "string") {
            return crypto2.createHash("md5").update(message, "utf8").digest("hex");
          } else {
            if (message === null || message === void 0) {
              throw new Error(INPUT_ERROR);
            } else if (message.constructor === ArrayBuffer) {
              message = new Uint8Array(message);
            }
          }
          if (isArray(message) || isView(message) || message.constructor === Buffer2) {
            return crypto2.createHash("md5").update(bufferFrom(message)).digest("hex");
          } else {
            return method(message);
          }
        }, "nodeMethod");
        return nodeMethod;
      }, "nodeWrap");
      var createHmacOutputMethod = /* @__PURE__ */ __name(function(outputType) {
        return function(key, message) {
          return new HmacMd5(key, true).update(message)[outputType]();
        };
      }, "createHmacOutputMethod");
      var createHmacMethod = /* @__PURE__ */ __name(function() {
        var method = createHmacOutputMethod("hex");
        method.create = function(key) {
          return new HmacMd5(key);
        };
        method.update = function(key, message) {
          return method.create(key).update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
          var type = OUTPUT_TYPES[i];
          method[type] = createHmacOutputMethod(type);
        }
        return method;
      }, "createHmacMethod");
      function Md5(sharedMemory) {
        if (sharedMemory) {
          blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          this.blocks = blocks;
          this.buffer8 = buffer8;
        } else {
          if (ARRAY_BUFFER) {
            var buffer2 = new ArrayBuffer(68);
            this.buffer8 = new Uint8Array(buffer2);
            this.blocks = new Uint32Array(buffer2);
          } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
        }
        this.h0 = this.h1 = this.h2 = this.h3 = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
        this.first = true;
      }
      __name(Md5, "Md5");
      Md5.prototype.update = function(message) {
        if (this.finalized) {
          throw new Error(FINALIZE_ERROR);
        }
        var result = formatMessage(message);
        message = result[0];
        var isString = result[1];
        var code, index = 0, i, length = message.length, blocks2 = this.blocks;
        var buffer82 = this.buffer8;
        while (index < length) {
          if (this.hashed) {
            this.hashed = false;
            blocks2[0] = blocks2[16];
            blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
          }
          if (isString) {
            if (ARRAY_BUFFER) {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 128) {
                  buffer82[i++] = code;
                } else if (code < 2048) {
                  buffer82[i++] = 192 | code >>> 6;
                  buffer82[i++] = 128 | code & 63;
                } else if (code < 55296 || code >= 57344) {
                  buffer82[i++] = 224 | code >>> 12;
                  buffer82[i++] = 128 | code >>> 6 & 63;
                  buffer82[i++] = 128 | code & 63;
                } else {
                  code = 65536 + ((code & 1023) << 10 | message.charCodeAt(++index) & 1023);
                  buffer82[i++] = 240 | code >>> 18;
                  buffer82[i++] = 128 | code >>> 12 & 63;
                  buffer82[i++] = 128 | code >>> 6 & 63;
                  buffer82[i++] = 128 | code & 63;
                }
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 128) {
                  blocks2[i >>> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 2048) {
                  blocks2[i >>> 2] |= (192 | code >>> 6) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else if (code < 55296 || code >= 57344) {
                  blocks2[i >>> 2] |= (224 | code >>> 12) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else {
                  code = 65536 + ((code & 1023) << 10 | message.charCodeAt(++index) & 1023);
                  blocks2[i >>> 2] |= (240 | code >>> 18) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 12 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                }
              }
            }
          } else {
            if (ARRAY_BUFFER) {
              for (i = this.start; index < length && i < 64; ++index) {
                buffer82[i++] = message[index];
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                blocks2[i >>> 2] |= message[index] << SHIFT[i++ & 3];
              }
            }
          }
          this.lastByteIndex = i;
          this.bytes += i - this.start;
          if (i >= 64) {
            this.start = i - 64;
            this.hash();
            this.hashed = true;
          } else {
            this.start = i;
          }
        }
        if (this.bytes > 4294967295) {
          this.hBytes += this.bytes / 4294967296 << 0;
          this.bytes = this.bytes % 4294967296;
        }
        return this;
      };
      Md5.prototype.finalize = function() {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        var blocks2 = this.blocks, i = this.lastByteIndex;
        blocks2[i >>> 2] |= EXTRA[i & 3];
        if (i >= 56) {
          if (!this.hashed) {
            this.hash();
          }
          blocks2[0] = blocks2[16];
          blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
        }
        blocks2[14] = this.bytes << 3;
        blocks2[15] = this.hBytes << 3 | this.bytes >>> 29;
        this.hash();
      };
      Md5.prototype.hash = function() {
        var a, b, c, d, bc, da, blocks2 = this.blocks;
        if (this.first) {
          a = blocks2[0] - 680876937;
          a = (a << 7 | a >>> 25) - 271733879 << 0;
          d = (-1732584194 ^ a & 2004318071) + blocks2[1] - 117830708;
          d = (d << 12 | d >>> 20) + a << 0;
          c = (-271733879 ^ d & (a ^ -271733879)) + blocks2[2] - 1126478375;
          c = (c << 17 | c >>> 15) + d << 0;
          b = (a ^ c & (d ^ a)) + blocks2[3] - 1316259209;
          b = (b << 22 | b >>> 10) + c << 0;
        } else {
          a = this.h0;
          b = this.h1;
          c = this.h2;
          d = this.h3;
          a += (d ^ b & (c ^ d)) + blocks2[0] - 680876936;
          a = (a << 7 | a >>> 25) + b << 0;
          d += (c ^ a & (b ^ c)) + blocks2[1] - 389564586;
          d = (d << 12 | d >>> 20) + a << 0;
          c += (b ^ d & (a ^ b)) + blocks2[2] + 606105819;
          c = (c << 17 | c >>> 15) + d << 0;
          b += (a ^ c & (d ^ a)) + blocks2[3] - 1044525330;
          b = (b << 22 | b >>> 10) + c << 0;
        }
        a += (d ^ b & (c ^ d)) + blocks2[4] - 176418897;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks2[5] + 1200080426;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks2[6] - 1473231341;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks2[7] - 45705983;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (d ^ b & (c ^ d)) + blocks2[8] + 1770035416;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks2[9] - 1958414417;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks2[10] - 42063;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks2[11] - 1990404162;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (d ^ b & (c ^ d)) + blocks2[12] + 1804603682;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks2[13] - 40341101;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks2[14] - 1502002290;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks2[15] + 1236535329;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks2[1] - 165796510;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks2[6] - 1069501632;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks2[11] + 643717713;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks2[0] - 373897302;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks2[5] - 701558691;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks2[10] + 38016083;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks2[15] - 660478335;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks2[4] - 405537848;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks2[9] + 568446438;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks2[14] - 1019803690;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks2[3] - 187363961;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks2[8] + 1163531501;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks2[13] - 1444681467;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks2[2] - 51403784;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks2[7] + 1735328473;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks2[12] - 1926607734;
        b = (b << 20 | b >>> 12) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks2[5] - 378558;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks2[8] - 2022574463;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks2[11] + 1839030562;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks2[14] - 35309556;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks2[1] - 1530992060;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks2[4] + 1272893353;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks2[7] - 155497632;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks2[10] - 1094730640;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks2[13] + 681279174;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks2[0] - 358537222;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks2[3] - 722521979;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks2[6] + 76029189;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks2[9] - 640364487;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks2[12] - 421815835;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks2[15] + 530742520;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks2[2] - 995338651;
        b = (b << 23 | b >>> 9) + c << 0;
        a += (c ^ (b | ~d)) + blocks2[0] - 198630844;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks2[7] + 1126891415;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks2[14] - 1416354905;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks2[5] - 57434055;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks2[12] + 1700485571;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks2[3] - 1894986606;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks2[10] - 1051523;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks2[1] - 2054922799;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks2[8] + 1873313359;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks2[15] - 30611744;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks2[6] - 1560198380;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks2[13] + 1309151649;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks2[4] - 145523070;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks2[11] - 1120210379;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks2[2] + 718787259;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks2[9] - 343485551;
        b = (b << 21 | b >>> 11) + c << 0;
        if (this.first) {
          this.h0 = a + 1732584193 << 0;
          this.h1 = b - 271733879 << 0;
          this.h2 = c - 1732584194 << 0;
          this.h3 = d + 271733878 << 0;
          this.first = false;
        } else {
          this.h0 = this.h0 + a << 0;
          this.h1 = this.h1 + b << 0;
          this.h2 = this.h2 + c << 0;
          this.h3 = this.h3 + d << 0;
        }
      };
      Md5.prototype.hex = function() {
        this.finalize();
        var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;
        return HEX_CHARS[h0 >>> 4 & 15] + HEX_CHARS[h0 & 15] + HEX_CHARS[h0 >>> 12 & 15] + HEX_CHARS[h0 >>> 8 & 15] + HEX_CHARS[h0 >>> 20 & 15] + HEX_CHARS[h0 >>> 16 & 15] + HEX_CHARS[h0 >>> 28 & 15] + HEX_CHARS[h0 >>> 24 & 15] + HEX_CHARS[h1 >>> 4 & 15] + HEX_CHARS[h1 & 15] + HEX_CHARS[h1 >>> 12 & 15] + HEX_CHARS[h1 >>> 8 & 15] + HEX_CHARS[h1 >>> 20 & 15] + HEX_CHARS[h1 >>> 16 & 15] + HEX_CHARS[h1 >>> 28 & 15] + HEX_CHARS[h1 >>> 24 & 15] + HEX_CHARS[h2 >>> 4 & 15] + HEX_CHARS[h2 & 15] + HEX_CHARS[h2 >>> 12 & 15] + HEX_CHARS[h2 >>> 8 & 15] + HEX_CHARS[h2 >>> 20 & 15] + HEX_CHARS[h2 >>> 16 & 15] + HEX_CHARS[h2 >>> 28 & 15] + HEX_CHARS[h2 >>> 24 & 15] + HEX_CHARS[h3 >>> 4 & 15] + HEX_CHARS[h3 & 15] + HEX_CHARS[h3 >>> 12 & 15] + HEX_CHARS[h3 >>> 8 & 15] + HEX_CHARS[h3 >>> 20 & 15] + HEX_CHARS[h3 >>> 16 & 15] + HEX_CHARS[h3 >>> 28 & 15] + HEX_CHARS[h3 >>> 24 & 15];
      };
      Md5.prototype.toString = Md5.prototype.hex;
      Md5.prototype.digest = function() {
        this.finalize();
        var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;
        return [
          h0 & 255,
          h0 >>> 8 & 255,
          h0 >>> 16 & 255,
          h0 >>> 24 & 255,
          h1 & 255,
          h1 >>> 8 & 255,
          h1 >>> 16 & 255,
          h1 >>> 24 & 255,
          h2 & 255,
          h2 >>> 8 & 255,
          h2 >>> 16 & 255,
          h2 >>> 24 & 255,
          h3 & 255,
          h3 >>> 8 & 255,
          h3 >>> 16 & 255,
          h3 >>> 24 & 255
        ];
      };
      Md5.prototype.array = Md5.prototype.digest;
      Md5.prototype.arrayBuffer = function() {
        this.finalize();
        var buffer2 = new ArrayBuffer(16);
        var blocks2 = new Uint32Array(buffer2);
        blocks2[0] = this.h0;
        blocks2[1] = this.h1;
        blocks2[2] = this.h2;
        blocks2[3] = this.h3;
        return buffer2;
      };
      Md5.prototype.buffer = Md5.prototype.arrayBuffer;
      Md5.prototype.base64 = function() {
        var v1, v2, v3, base64Str = "", bytes = this.array();
        for (var i = 0; i < 15; ) {
          v1 = bytes[i++];
          v2 = bytes[i++];
          v3 = bytes[i++];
          base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] + BASE64_ENCODE_CHAR[(v1 << 4 | v2 >>> 4) & 63] + BASE64_ENCODE_CHAR[(v2 << 2 | v3 >>> 6) & 63] + BASE64_ENCODE_CHAR[v3 & 63];
        }
        v1 = bytes[i];
        base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] + BASE64_ENCODE_CHAR[v1 << 4 & 63] + "==";
        return base64Str;
      };
      function HmacMd5(key, sharedMemory) {
        var i, result = formatMessage(key);
        key = result[0];
        if (result[1]) {
          var bytes = [], length = key.length, index = 0, code;
          for (i = 0; i < length; ++i) {
            code = key.charCodeAt(i);
            if (code < 128) {
              bytes[index++] = code;
            } else if (code < 2048) {
              bytes[index++] = 192 | code >>> 6;
              bytes[index++] = 128 | code & 63;
            } else if (code < 55296 || code >= 57344) {
              bytes[index++] = 224 | code >>> 12;
              bytes[index++] = 128 | code >>> 6 & 63;
              bytes[index++] = 128 | code & 63;
            } else {
              code = 65536 + ((code & 1023) << 10 | key.charCodeAt(++i) & 1023);
              bytes[index++] = 240 | code >>> 18;
              bytes[index++] = 128 | code >>> 12 & 63;
              bytes[index++] = 128 | code >>> 6 & 63;
              bytes[index++] = 128 | code & 63;
            }
          }
          key = bytes;
        }
        if (key.length > 64) {
          key = new Md5(true).update(key).array();
        }
        var oKeyPad = [], iKeyPad = [];
        for (i = 0; i < 64; ++i) {
          var b = key[i] || 0;
          oKeyPad[i] = 92 ^ b;
          iKeyPad[i] = 54 ^ b;
        }
        Md5.call(this, sharedMemory);
        this.update(iKeyPad);
        this.oKeyPad = oKeyPad;
        this.inner = true;
        this.sharedMemory = sharedMemory;
      }
      __name(HmacMd5, "HmacMd5");
      HmacMd5.prototype = new Md5();
      HmacMd5.prototype.finalize = function() {
        Md5.prototype.finalize.call(this);
        if (this.inner) {
          this.inner = false;
          var innerHash = this.array();
          Md5.call(this, this.sharedMemory);
          this.update(this.oKeyPad);
          this.update(innerHash);
          Md5.prototype.finalize.call(this);
        }
      };
      var exports2 = createMethod();
      exports2.md5 = exports2;
      exports2.md5.hmac = createHmacMethod();
      if (COMMON_JS) {
        module.exports = exports2;
      } else {
        root.md5 = exports2;
        if (AMD) {
          define(function() {
            return exports2;
          });
        }
      }
    })();
  }
});

// .wrangler/tmp/bundle-JmYQWJ/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-JmYQWJ/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();

// node_modules/hono/dist/index.js
init_modules_watch_stub();

// node_modules/hono/dist/hono.js
init_modules_watch_stub();

// node_modules/hono/dist/hono-base.js
init_modules_watch_stub();

// node_modules/hono/dist/compose.js
init_modules_watch_stub();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/context.js
init_modules_watch_stub();

// node_modules/hono/dist/request.js
init_modules_watch_stub();

// node_modules/hono/dist/http-exception.js
init_modules_watch_stub();

// node_modules/hono/dist/request/constants.js
init_modules_watch_stub();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
init_modules_watch_stub();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
init_modules_watch_stub();
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
init_modules_watch_stub();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
init_modules_watch_stub();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
init_modules_watch_stub();
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/reg-exp-router/matcher.js
init_modules_watch_stub();
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
init_modules_watch_stub();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_modules_watch_stub();
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/smart-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/smart-router/router.js
init_modules_watch_stub();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router4 = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router4.add(...routes[i2]);
        }
        res = router4.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router4.match.bind(router4);
      this.#routers = [router4];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/trie-router/router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/trie-router/node.js
init_modules_watch_stub();
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/routes/koreader.ts
init_modules_watch_stub();

// src/db.ts
init_modules_watch_stub();
import initMigrationSql from "./c52473c9af42760a73d3765e2d6b21abf3455baf-0001_init.sql";
import statisticsMigrationSql from "./0b014fdd6bb4c85d3c4ed16f6074108aaa5d9106-0002_statistics_sync.sql";
var REQUIRED_TABLES = ["users", "progress", "sessions", "statistics_snapshot"];
function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];
    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      current += char;
      continue;
    }
    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (!inSingleQuote && !inDoubleQuote && char === "-" && next === "-") {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }
    if (!inSingleQuote && !inDoubleQuote && char === "/" && next === "*") {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }
    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && next === "'") {
        current += char + next;
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }
    if (char === '"' && !inSingleQuote) {
      if (inDoubleQuote && next === '"') {
        current += char + next;
        i++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }
    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }
    current += char;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}
__name(splitSqlStatements, "splitSqlStatements");
async function getDatabaseInitStatus(env) {
  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (tableName) => {
      const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").bind(tableName).first();
      return row?.name ? null : tableName;
    })
  );
  const missingTables = checks.filter((name) => name !== null);
  return { initialized: missingTables.length === 0, missingTables };
}
__name(getDatabaseInitStatus, "getDatabaseInitStatus");
async function initializeDatabase(env) {
  const statements = [
    ...splitSqlStatements(initMigrationSql),
    ...splitSqlStatements(statisticsMigrationSql)
  ];
  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
}
__name(initializeDatabase, "initializeDatabase");
async function findUserByUsername(env, username) {
  const row = await env.DB.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  ).bind(username).first();
  return row ?? null;
}
__name(findUserByUsername, "findUserByUsername");
async function createUser(env, username, passwordHash) {
  await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind(username, passwordHash).run();
}
__name(createUser, "createUser");
async function listUsers(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, username, created_at FROM users ORDER BY created_at DESC, id DESC"
  ).all();
  return results ?? [];
}
__name(listUsers, "listUsers");
async function deleteUserById(env, userId) {
  await env.DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  const result = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  return (result.meta.changes ?? 0) > 0;
}
__name(deleteUserById, "deleteUserById");
async function updateUserPasswordById(env, userId, passwordHash) {
  const result = await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId).run();
  return (result.meta.changes ?? 0) > 0;
}
__name(updateUserPasswordById, "updateUserPasswordById");
async function upsertProgress(env, userId, payload) {
  await env.DB.prepare(
    `INSERT INTO progress (
      user_id, document, progress, percentage, device, device_id, timestamp, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id, document) DO UPDATE SET
      progress = excluded.progress,
      percentage = excluded.percentage,
      device = excluded.device,
      device_id = excluded.device_id,
      timestamp = excluded.timestamp,
      updated_at = unixepoch()`
  ).bind(
    userId,
    payload.document,
    payload.progress,
    payload.percentage,
    payload.device,
    payload.device_id,
    payload.timestamp
  ).run();
}
__name(upsertProgress, "upsertProgress");
async function getLatestProgressByDocument(env, userId, document) {
  const row = await env.DB.prepare(
    `SELECT progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ? AND document = ?
     ORDER BY timestamp DESC
     LIMIT 1`
  ).bind(userId, document).first();
  return row ?? null;
}
__name(getLatestProgressByDocument, "getLatestProgressByDocument");
async function getStatisticsSnapshot(env, userId) {
  const row = await env.DB.prepare(
    `SELECT schema_version, device, device_id, snapshot_json
     FROM statistics_snapshot
     WHERE user_id = ?`
  ).bind(userId).first();
  return row ?? null;
}
__name(getStatisticsSnapshot, "getStatisticsSnapshot");
async function upsertStatisticsSnapshot(env, userId, schemaVersion, device, deviceId, snapshotJson) {
  await env.DB.prepare(
    `INSERT INTO statistics_snapshot (
      user_id, schema_version, device, device_id, snapshot_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET
      schema_version = excluded.schema_version,
      device = excluded.device,
      device_id = excluded.device_id,
      snapshot_json = excluded.snapshot_json,
      updated_at = unixepoch()`
  ).bind(userId, schemaVersion, device, deviceId, snapshotJson).run();
}
__name(upsertStatisticsSnapshot, "upsertStatisticsSnapshot");

// src/routes/koreader.ts
var import_js_md5 = __toESM(require_md5(), 1);

// src/crypto.ts
init_modules_watch_stub();
var encoder = new TextEncoder();
var DEFAULT_PBKDF2_ITERATIONS = 2e4;
async function pbkdf2(password, salt, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      // OWASP recommends higher PBKDF2 iteration counts for SHA-256; default to 20k for perf/compatibility unless overridden.
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(pbkdf2, "pbkdf2");
async function hashPassword(password, username, pepper, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  return pbkdf2(password, `${username}:${pepper}`, iterations);
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, username, pepper, storedHash, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  const digest = await hashPassword(password, username, pepper, iterations);
  return digest === storedHash;
}
__name(verifyPassword, "verifyPassword");
function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(generateSessionToken, "generateSessionToken");
async function sha256(input) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// src/services/auth.ts
init_modules_watch_stub();

// node_modules/hono/dist/helper/cookie/index.js
init_modules_watch_stub();

// node_modules/hono/dist/utils/cookie.js
init_modules_watch_stub();
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// src/services/common.ts
init_modules_watch_stub();
function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" }
  });
}
__name(badRequest, "badRequest");
function parseSessionTtlHours(env) {
  const value = Number(env.SESSION_TTL_HOURS ?? "168");
  return Number.isFinite(value) && value > 0 ? value : 168;
}
__name(parseSessionTtlHours, "parseSessionTtlHours");
function parsePbkdf2Iterations(env) {
  const value = Number(env.PBKDF2_ITERATIONS ?? DEFAULT_PBKDF2_ITERATIONS);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return DEFAULT_PBKDF2_ITERATIONS;
  }
  return value;
}
__name(parsePbkdf2Iterations, "parsePbkdf2Iterations");
function isValidPassword(password) {
  return password.length >= 8;
}
__name(isValidPassword, "isValidPassword");
function withSecurityHeaders(headers) {
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  headers.set(
    "content-security-policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none';"
  );
  return headers;
}
__name(withSecurityHeaders, "withSecurityHeaders");

// src/services/auth.ts
var USER_SESSION_COOKIE = "ks_session";
var ADMIN_SESSION_COOKIE = "ks_admin_session";
var TIMING_COMPARE_STEPS = 256;
function isValidField(field) {
  return typeof field === "string" && field.length > 0;
}
__name(isValidField, "isValidField");
function isValidKeyField(field) {
  return isValidField(field) && !field.includes(":");
}
__name(isValidKeyField, "isValidKeyField");
function timingSafeEqual(a, b) {
  let diff = 0;
  for (let i = 0; i < TIMING_COMPARE_STEPS; i++) {
    const ac = i < a.length ? a.charCodeAt(i) : 0;
    const bc = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ac ^ bc;
  }
  diff |= a.length ^ b.length;
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function authKoreader(c) {
  const username = c.req.header("x-auth-user");
  const password = c.req.header("x-auth-key");
  if (!isValidKeyField(username) || !isValidField(password)) return null;
  const user = await findUserByUsername(c.env, username);
  if (!user) return null;
  const iterations = parsePbkdf2Iterations(c.env);
  const ok = await verifyPassword(password, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
  if (!ok) return null;
  return { userId: user.id, username: user.username };
}
__name(authKoreader, "authKoreader");
async function authWebUser(c) {
  const token = getCookie(c, USER_SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
  const row = await c.env.DB.prepare(
    `SELECT users.id AS id, users.username AS username
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
     LIMIT 1`
  ).bind(tokenHash).first();
  if (!row) return null;
  return { userId: row.id, username: row.username };
}
__name(authWebUser, "authWebUser");
async function authAdmin(c) {
  const adminToken = getCookie(c, ADMIN_SESSION_COOKIE);
  const expectedToken = c.env.ADMIN_TOKEN ?? "";
  if (!adminToken || !expectedToken) return null;
  const expectedTokenHash = await sha256(`${expectedToken}:${c.env.PASSWORD_PEPPER}`);
  const ok = timingSafeEqual(adminToken, expectedTokenHash);
  if (!ok) return null;
  return { mode: "token" };
}
__name(authAdmin, "authAdmin");

// src/routes/koreader.ts
var router = new Hono2();
var INVALID_REQUEST_MESSAGE = "Invalid request";
var DOCUMENT_MISSING_MESSAGE = "Field 'document' not provided.";
var UNAUTHORIZED_MESSAGE = "Unauthorized";
var REGISTRATION_DISABLED_MESSAGE = "User registration is disabled.";
var INVALID_SNAPSHOT_MESSAGE = "Invalid statistics snapshot payload";
function logError(c, label, error) {
  const isDebug = c.env.DEBUG === "1" || c.env.DEBUG === "true";
  if (isDebug) {
    console.error(`[DEBUG ERROR] ${label}:`, error);
    if (error instanceof Error && error.cause) {
      console.error(`[DEBUG CAUSE] ${label}:`, error.cause);
    }
  }
}
__name(logError, "logError");
function isRegistrationEnabled(env) {
  const flag = env.ENABLE_USER_REGISTRATION;
  if (flag === void 0) return true;
  return flag === "true" || flag === "1";
}
__name(isRegistrationEnabled, "isRegistrationEnabled");
function normalizePageStatData(value) {
  if (!Array.isArray(value)) return [];
  const rows = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item;
    const { page, start_time, duration, total_pages, ...rest } = record;
    const normalizedPage = page == null ? null : Number(page);
    const normalizedStartTime = Number(start_time);
    const normalizedDuration = Number(duration);
    const normalizedTotalPages = Number(total_pages);
    if (!Number.isFinite(normalizedStartTime) || !Number.isFinite(normalizedDuration) || !Number.isFinite(normalizedTotalPages)) {
      continue;
    }
    rows.push({
      ...rest,
      page: normalizedPage == null || !Number.isFinite(normalizedPage) ? null : normalizedPage,
      start_time: normalizedStartTime,
      duration: normalizedDuration,
      total_pages: normalizedTotalPages
    });
  }
  return rows;
}
__name(normalizePageStatData, "normalizePageStatData");
function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
__name(numberOrZero, "numberOrZero");
function normalizeBook(value) {
  if (!value || typeof value !== "object") return null;
  const row = value;
  const { md5: md54, page_stat_data, ...rest } = row;
  const md5Value = typeof md54 === "string" ? md54.trim() : "";
  if (!md5Value) return null;
  return {
    ...rest,
    md5: md5Value,
    title: typeof row.title === "string" ? row.title : "",
    authors: typeof row.authors === "string" ? row.authors : "",
    notes: numberOrZero(row.notes),
    last_open: numberOrZero(row.last_open),
    highlights: numberOrZero(row.highlights),
    pages: numberOrZero(row.pages),
    series: typeof row.series === "string" ? row.series : "",
    language: typeof row.language === "string" ? row.language : "",
    total_read_time: numberOrZero(row.total_read_time),
    total_read_pages: numberOrZero(row.total_read_pages),
    page_stat_data: normalizePageStatData(page_stat_data)
  };
}
__name(normalizeBook, "normalizeBook");
function dedupePageStats(rows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const key = JSON.stringify([row.page, row.start_time, row.duration, row.total_pages]);
    map.set(key, row);
  }
  return Array.from(map.values());
}
__name(dedupePageStats, "dedupePageStats");
function mergeBooks(existing, incoming) {
  const {
    page_stat_data: existingPageStats,
    md5: existingMd5,
    title: existingTitle,
    authors: existingAuthors,
    notes: existingNotes,
    last_open: existingLastOpen,
    highlights: existingHighlights,
    pages: existingPages,
    series: existingSeries,
    language: existingLanguage,
    total_read_time: existingTotalReadTime,
    total_read_pages: existingTotalReadPages,
    ...existingRest
  } = existing;
  const {
    page_stat_data: incomingPageStats,
    md5: incomingMd5,
    title: incomingTitle,
    authors: incomingAuthors,
    notes: incomingNotes,
    last_open: incomingLastOpen,
    highlights: incomingHighlights,
    pages: incomingPages,
    series: incomingSeries,
    language: incomingLanguage,
    total_read_time: incomingTotalReadTime,
    total_read_pages: incomingTotalReadPages,
    ...incomingRest
  } = incoming;
  return {
    ...existingRest,
    ...incomingRest,
    md5: incomingMd5 || existingMd5,
    title: incomingTitle || existingTitle,
    authors: incomingAuthors || existingAuthors,
    notes: Math.max(existingNotes, incomingNotes),
    last_open: Math.max(existingLastOpen, incomingLastOpen),
    highlights: Math.max(existingHighlights, incomingHighlights),
    pages: Math.max(existingPages, incomingPages),
    series: incomingSeries || existingSeries,
    language: incomingLanguage || existingLanguage,
    total_read_time: Math.max(existingTotalReadTime, incomingTotalReadTime),
    total_read_pages: Math.max(existingTotalReadPages, incomingTotalReadPages),
    page_stat_data: dedupePageStats([...existingPageStats, ...incomingPageStats])
  };
}
__name(mergeBooks, "mergeBooks");
function mergeSnapshots(existing, incoming) {
  const merged = /* @__PURE__ */ new Map();
  for (const book of existing?.books ?? []) {
    merged.set(book.md5, book);
  }
  for (const book of incoming.books) {
    const current = merged.get(book.md5);
    merged.set(book.md5, current ? mergeBooks(current, book) : book);
  }
  return {
    books: Array.from(merged.values()).sort((a, b) => a.md5.localeCompare(b.md5))
  };
}
__name(mergeSnapshots, "mergeSnapshots");
function parseSnapshotFromJson(value) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const booksRaw = parsed.books;
    const books = Array.isArray(booksRaw) ? booksRaw : [];
    const normalizedBooks = books.map(normalizeBook).filter((row) => row !== null);
    return { books: normalizedBooks };
  } catch {
    return null;
  }
}
__name(parseSnapshotFromJson, "parseSnapshotFromJson");
router.post("/users/create", async (c) => {
  if (!isRegistrationEnabled(c.env)) {
    return c.json({ message: REGISTRATION_DISABLED_MESSAGE }, 402);
  }
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    logError(c, "JSON Parse Error", e);
    return badRequest("Invalid JSON body");
  }
  const { username = "", password = "" } = body;
  if (!isValidKeyField(username) || !isValidField(password)) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }
  try {
    const iterations = parsePbkdf2Iterations(c.env);
    const passwordHash = await hashPassword((0, import_js_md5.md5)(password), username, c.env.PASSWORD_PEPPER, iterations);
    await createUser(c.env, username, passwordHash);
    return c.json({ username }, 201);
  } catch (error) {
    logError(c, "User Creation Failed", error);
    const errorMsg = error?.message ? String(error.message).toUpperCase() : "";
    let causeMsg = "";
    if (error?.cause) {
      causeMsg = typeof error.cause === "string" ? error.cause.toUpperCase() : error.cause.message ? String(error.cause.message).toUpperCase() : "";
    }
    const isDuplicate = errorMsg.includes("UNIQUE") || causeMsg.includes("UNIQUE");
    if (isDuplicate) {
      return c.json({ message: "Username is already registered." }, 402);
    }
    const errMsg = c.env.DEBUG === "1" || c.env.DEBUG === "true" ? `Creation failed: ${error?.message || "Unknown error"}` : "Username is already registered.";
    return c.json({ message: errMsg }, 402);
  }
});
router.get("/users/auth", async (c) => {
  try {
    const auth = await authKoreader(c);
    if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
    return c.json({ authorized: "OK" });
  } catch (error) {
    logError(c, "Auth Error", error);
    return c.json({ message: "Auth internal error" }, 500);
  }
});
router.put("/syncs/progress", async (c) => {
  const auth = await authKoreader(c).catch((e) => {
    logError(c, "Auth Check Error in PUT", e);
    return null;
  });
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    logError(c, "JSON Parse Error (/syncs/progress)", e);
    return badRequest("Invalid JSON body");
  }
  const { document, progress, percentage, device, device_id } = body;
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }
  if (!progress || typeof percentage !== "number" || !device) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }
  try {
    const timestamp = Math.floor(Date.now() / 1e3);
    await upsertProgress(c.env, auth.userId, {
      document,
      progress,
      percentage,
      device,
      device_id: device_id ?? "",
      timestamp
    });
    return c.json({ document, timestamp });
  } catch (error) {
    logError(c, "Upsert Progress Error", error);
    return c.json({ message: "Failed to save progress" }, 500);
  }
});
router.get("/syncs/progress/:document", async (c) => {
  const auth = await authKoreader(c).catch((e) => {
    logError(c, "Auth Check Error in GET", e);
    return null;
  });
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
  const document = c.req.param("document");
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }
  try {
    const row = await getLatestProgressByDocument(c.env, auth.userId, document);
    if (!row) return c.json({ document });
    return c.json({
      document,
      progress: row.progress,
      percentage: row.percentage,
      device: row.device,
      ...row.device_id ? { device_id: row.device_id } : {},
      timestamp: row.timestamp
    });
  } catch (error) {
    logError(c, "Get Progress Error", error);
    return c.json({ message: "Failed to fetch progress" }, 500);
  }
});
router.put("/syncs/statistics", async (c) => {
  const auth = await authKoreader(c).catch((e) => {
    logError(c, "Auth Check Error in PUT /syncs/statistics", e);
    return null;
  });
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    logError(c, "JSON Parse Error (/syncs/statistics)", e);
    return badRequest("Invalid JSON body");
  }
  const schemaVersion = Number(body.schema_version);
  const device = typeof body.device === "string" ? body.device : "";
  const deviceId = typeof body.device_id === "string" ? body.device_id : "";
  const snapshotPayload = body.snapshot;
  if (!Number.isInteger(schemaVersion) || !device || typeof snapshotPayload !== "object" || !snapshotPayload) {
    return c.json({ message: INVALID_SNAPSHOT_MESSAGE }, 400);
  }
  const incomingBooksRaw = snapshotPayload.books;
  if (!Array.isArray(incomingBooksRaw)) {
    return c.json({ message: INVALID_SNAPSHOT_MESSAGE }, 400);
  }
  const incomingSnapshot = {
    books: incomingBooksRaw.map(normalizeBook).filter((row) => row !== null)
  };
  try {
    const existing = await getStatisticsSnapshot(c.env, auth.userId);
    const existingSnapshot = existing ? parseSnapshotFromJson(existing.snapshot_json) : null;
    const mergedSnapshot = mergeSnapshots(existingSnapshot, incomingSnapshot);
    await upsertStatisticsSnapshot(
      c.env,
      auth.userId,
      schemaVersion,
      device,
      deviceId,
      JSON.stringify(mergedSnapshot)
    );
    return c.json({
      ok: true,
      snapshot: mergedSnapshot
    });
  } catch (error) {
    logError(c, "Upsert Statistics Error", error);
    return c.json({ message: "Failed to sync statistics" }, 500);
  }
});
var koreader_default = router;

// src/routes/user.ts
init_modules_watch_stub();
var import_js_md52 = __toESM(require_md5(), 1);

// src/i18n/index.ts
init_modules_watch_stub();

// src/i18n/en.ts
init_modules_watch_stub();
var en = {
  admin: {
    title: "KOReader Sync \xB7 Admin Console",
    heading: "KOReader Sync Admin Console",
    subtitle: "After admin token login, you can manage users (delete/force password reset). User entry:",
    loginSection: "Admin Login (Token)",
    tokenPlaceholder: "Enter ADMIN_TOKEN",
    loginButton: "Login",
    userManagement: "User Management",
    adminSession: "Admin Token Session",
    refreshButton: "Refresh",
    logoutButton: "Logout",
    tableId: "ID",
    tableUsername: "Username",
    tableCreatedAt: "Created At",
    tableActions: "Actions",
    passwordPlaceholder: "New password (at least 8 chars)",
    passwordAriaLabel: "New password for user",
    resetPasswordButton: "Reset Password",
    deleteUserButton: "Delete User",
    requestFailed: "Request failed",
    statusLoggedIn: "Current status: Logged in",
    loginSuccess: "Login successful",
    confirmDeletePrefix: "Confirm deleting user #",
    confirmDeleteSuffix: "? This will delete sessions and reading data.",
    deleteSuccessPrefix: "Delete successful: #",
    resetSuccessPrefix: "Password reset successful: #",
    initTitle: "Database initialization required",
    initDescription: "Required database tables were not found. Click the button below to initialize now.",
    initButton: "Initialize database",
    initRequired: "Database is not initialized. Please initialize first.",
    initSuccess: "Database initialization successful"
  },
  user: {
    title: "KOReader Sync \xB7 User Center",
    heading: "KOReader Sync",
    subtitle: "User Center \xB7 Login with your Kindle account to view personal stats and reading records",
    loginSection: "Login",
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    loginButton: "Login",
    loginSuccess: "Login successful",
    statsTitle: "Personal Statistics",
    realtimeStats: "Real-time Stats",
    refreshButton: "Refresh",
    logoutButton: "Logout",
    recordsTitle: "Reading Records",
    loadButton: "Load",
    tableDocument: "Document",
    tableProgress: "Progress",
    tableDevice: "Device",
    tableDeviceId: "Device ID",
    tableUpdatedAt: "Updated At",
    requestFailed: "Request failed",
    statTotalRecords: "Total Records",
    statTotalDocuments: "Documents",
    statTotalDevices: "Devices",
    statActiveDays: "Active Days",
    statAverageProgress: "Average Progress",
    statLastSync: "Last Sync",
    userPrefix: "User: ",
    deviceDistributionPrefix: "Device Distribution: ",
    readingStatsTitle: "Reading Statistics",
    statTotalBooks: "Books",
    statTotalReadTime: "Total Read Time",
    statTotalReadPages: "Total Read Pages",
    statLastOpen: "Last Open",
    statisticsBooksTitle: "Books Statistics",
    tableMd5: "MD5",
    tableTitle: "Title",
    tableAuthors: "Authors",
    tablePages: "Pages",
    tableReadTime: "Read Time",
    tableReadPages: "Read Pages",
    tableLastOpen: "Last Open",
    emptyStatisticsBooks: "No synchronized statistics books yet."
  }
};
var en_default = en;

// src/i18n/ja.ts
init_modules_watch_stub();
var ja = {
  admin: {
    title: "KOReader Sync \xB7 \u7BA1\u7406\u30B3\u30F3\u30BD\u30FC\u30EB",
    heading: "KOReader Sync \u7BA1\u7406\u30B3\u30F3\u30BD\u30FC\u30EB",
    subtitle: "\u7BA1\u7406\u8005\u306F token \u3067\u30ED\u30B0\u30A4\u30F3\u5F8C\u3001\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406\uFF08\u524A\u9664/\u30D1\u30B9\u30EF\u30FC\u30C9\u5F37\u5236\u30EA\u30BB\u30C3\u30C8\uFF09\u304C\u3067\u304D\u307E\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u5165\u53E3\uFF1A",
    loginSection: "\u7BA1\u7406\u8005\u30ED\u30B0\u30A4\u30F3\uFF08Token\uFF09",
    tokenPlaceholder: "ADMIN_TOKEN \u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    loginButton: "\u30ED\u30B0\u30A4\u30F3",
    userManagement: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406",
    adminSession: "Admin Token Session",
    refreshButton: "\u66F4\u65B0",
    logoutButton: "\u30ED\u30B0\u30A2\u30A6\u30C8",
    tableId: "ID",
    tableUsername: "\u30E6\u30FC\u30B6\u30FC\u540D",
    tableCreatedAt: "\u4F5C\u6210\u65E5\u6642",
    tableActions: "\u64CD\u4F5C",
    passwordPlaceholder: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\uFF088\u6587\u5B57\u4EE5\u4E0A\uFF09",
    passwordAriaLabel: "\u30E6\u30FC\u30B6\u30FC\u306E\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9",
    resetPasswordButton: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8",
    deleteUserButton: "\u30E6\u30FC\u30B6\u30FC\u524A\u9664",
    requestFailed: "\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
    statusLoggedIn: "\u73FE\u5728\u306E\u72B6\u614B\uFF1A\u30ED\u30B0\u30A4\u30F3\u6E08\u307F",
    loginSuccess: "\u30ED\u30B0\u30A4\u30F3\u6210\u529F",
    confirmDeletePrefix: "\u30E6\u30FC\u30B6\u30FC #",
    confirmDeleteSuffix: " \u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\u30BB\u30C3\u30B7\u30E7\u30F3\u3068\u8AAD\u66F8\u30C7\u30FC\u30BF\u3082\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    deleteSuccessPrefix: "\u524A\u9664\u6210\u529F\uFF1A#",
    resetSuccessPrefix: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u6210\u529F\uFF1A#",
    initTitle: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u521D\u671F\u5316\u304C\u5FC5\u8981\u3067\u3059",
    initDescription: "\u5FC5\u8981\u306A\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30C6\u30FC\u30D6\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u4E0B\u306E\u30DC\u30BF\u30F3\u3092\u62BC\u3057\u3066\u521D\u671F\u5316\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    initButton: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u521D\u671F\u5316",
    initRequired: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u304C\u672A\u521D\u671F\u5316\u3067\u3059\u3002\u5148\u306B\u521D\u671F\u5316\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    initSuccess: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u521D\u671F\u5316\u306B\u6210\u529F\u3057\u307E\u3057\u305F"
  },
  user: {
    title: "KOReader Sync \xB7 \u30E6\u30FC\u30B6\u30FC\u30BB\u30F3\u30BF\u30FC",
    heading: "KOReader Sync",
    subtitle: "\u30E6\u30FC\u30B6\u30FC\u30BB\u30F3\u30BF\u30FC \xB7 \u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u500B\u4EBA\u7D71\u8A08\u3068\u8AAD\u66F8\u5C65\u6B74\u3092\u78BA\u8A8D\u3057\u307E\u3059",
    loginSection: "\u30ED\u30B0\u30A4\u30F3",
    usernamePlaceholder: "\u30E6\u30FC\u30B6\u30FC\u540D",
    passwordPlaceholder: "\u30D1\u30B9\u30EF\u30FC\u30C9",
    loginButton: "\u30ED\u30B0\u30A4\u30F3",
    loginSuccess: "\u30ED\u30B0\u30A4\u30F3\u6210\u529F",
    statsTitle: "\u500B\u4EBA\u7D71\u8A08",
    realtimeStats: "\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u7D71\u8A08",
    refreshButton: "\u66F4\u65B0",
    logoutButton: "\u30ED\u30B0\u30A2\u30A6\u30C8",
    recordsTitle: "\u8AAD\u66F8\u5C65\u6B74",
    loadButton: "\u8AAD\u307F\u8FBC\u307F",
    tableDocument: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8",
    tableProgress: "\u9032\u6357",
    tableDevice: "\u30C7\u30D0\u30A4\u30B9",
    tableDeviceId: "\u30C7\u30D0\u30A4\u30B9ID",
    tableUpdatedAt: "\u66F4\u65B0\u65E5\u6642",
    requestFailed: "\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
    statTotalRecords: "\u7DCF\u30EC\u30B3\u30FC\u30C9\u6570",
    statTotalDocuments: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u6570",
    statTotalDevices: "\u30C7\u30D0\u30A4\u30B9\u6570",
    statActiveDays: "\u30A2\u30AF\u30C6\u30A3\u30D6\u65E5\u6570",
    statAverageProgress: "\u5E73\u5747\u9032\u6357",
    statLastSync: "\u6700\u7D42\u540C\u671F",
    userPrefix: "\u30E6\u30FC\u30B6\u30FC\uFF1A",
    deviceDistributionPrefix: "\u30C7\u30D0\u30A4\u30B9\u5206\u5E03\uFF1A",
    readingStatsTitle: "\u8AAD\u66F8\u7D71\u8A08",
    statTotalBooks: "\u66F8\u7C4D\u6570",
    statTotalReadTime: "\u7DCF\u8AAD\u66F8\u6642\u9593",
    statTotalReadPages: "\u7DCF\u8AAD\u66F8\u30DA\u30FC\u30B8",
    statLastOpen: "\u6700\u7D42\u30AA\u30FC\u30D7\u30F3",
    statisticsBooksTitle: "\u66F8\u7C4D\u7D71\u8A08",
    tableMd5: "MD5",
    tableTitle: "\u30BF\u30A4\u30C8\u30EB",
    tableAuthors: "\u8457\u8005",
    tablePages: "\u7DCF\u30DA\u30FC\u30B8",
    tableReadTime: "\u8AAD\u66F8\u6642\u9593",
    tableReadPages: "\u8AAD\u66F8\u30DA\u30FC\u30B8",
    tableLastOpen: "\u6700\u7D42\u30AA\u30FC\u30D7\u30F3",
    emptyStatisticsBooks: "\u540C\u671F\u6E08\u307F\u306E\u8AAD\u66F8\u7D71\u8A08\u66F8\u7C4D\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002"
  }
};
var ja_default = ja;

// src/i18n/zh.ts
init_modules_watch_stub();
var zh = {
  admin: {
    title: "KOReader Sync \xB7 \u7BA1\u7406\u540E\u53F0",
    heading: "KOReader Sync \u7BA1\u7406\u540E\u53F0",
    subtitle: "\u7BA1\u7406\u5458\u901A\u8FC7 token \u767B\u5F55\u540E\u53EF\u7BA1\u7406\u7528\u6237\uFF08\u5220\u9664/\u5F3A\u5236\u6539\u5BC6\uFF09\u3002\u7528\u6237\u5165\u53E3\uFF1A",
    loginSection: "\u7BA1\u7406\u5458\u767B\u5F55\uFF08Token\uFF09",
    tokenPlaceholder: "\u8BF7\u8F93\u5165 ADMIN_TOKEN",
    loginButton: "\u767B\u5F55",
    userManagement: "\u7528\u6237\u7BA1\u7406",
    adminSession: "Admin Token Session",
    refreshButton: "\u5237\u65B0",
    logoutButton: "\u9000\u51FA",
    tableId: "ID",
    tableUsername: "\u7528\u6237\u540D",
    tableCreatedAt: "\u521B\u5EFA\u65F6\u95F4",
    tableActions: "\u64CD\u4F5C",
    passwordPlaceholder: "\u65B0\u5BC6\u7801\uFF08\u81F3\u5C118\u4F4D\uFF09",
    passwordAriaLabel: "\u7528\u6237\u7684\u65B0\u5BC6\u7801",
    resetPasswordButton: "\u91CD\u7F6E\u5BC6\u7801",
    deleteUserButton: "\u5220\u9664\u7528\u6237",
    requestFailed: "\u8BF7\u6C42\u5931\u8D25",
    statusLoggedIn: "\u5F53\u524D\u72B6\u6001\uFF1A\u5DF2\u767B\u5F55",
    loginSuccess: "\u767B\u5F55\u6210\u529F",
    confirmDeletePrefix: "\u786E\u8BA4\u5220\u9664\u7528\u6237 #",
    confirmDeleteSuffix: "\uFF1F\u6B64\u64CD\u4F5C\u4F1A\u5220\u9664\u5176\u4F1A\u8BDD\u4E0E\u9605\u8BFB\u6570\u636E\u3002",
    deleteSuccessPrefix: "\u5220\u9664\u6210\u529F\uFF1A#",
    resetSuccessPrefix: "\u5BC6\u7801\u91CD\u7F6E\u6210\u529F\uFF1A#",
    initTitle: "\u9700\u8981\u521D\u59CB\u5316\u6570\u636E\u5E93",
    initDescription: "\u68C0\u6D4B\u5230\u7F3A\u5C11\u5FC5\u8981\u6570\u636E\u8868\uFF0C\u8BF7\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u81EA\u52A8\u521D\u59CB\u5316\u6570\u636E\u5E93\u3002",
    initButton: "\u521D\u59CB\u5316\u6570\u636E\u5E93",
    initRequired: "\u6570\u636E\u5E93\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u521D\u59CB\u5316\u3002",
    initSuccess: "\u6570\u636E\u5E93\u521D\u59CB\u5316\u6210\u529F"
  },
  user: {
    title: "KOReader Sync \xB7 \u7528\u6237\u4E2D\u5FC3",
    heading: "KOReader Sync",
    subtitle: "\u7528\u6237\u4E2D\u5FC3 \xB7 \u4F7F\u7528 Kindle \u6CE8\u518C\u8D26\u6237\u767B\u5F55\u67E5\u770B\u4E2A\u4EBA\u7EDF\u8BA1\u4E0E\u9605\u8BFB\u8BB0\u5F55",
    loginSection: "\u767B\u5F55",
    usernamePlaceholder: "\u7528\u6237\u540D",
    passwordPlaceholder: "\u5BC6\u7801",
    loginButton: "\u767B\u5F55",
    loginSuccess: "\u767B\u5F55\u6210\u529F",
    statsTitle: "\u4E2A\u4EBA\u7EDF\u8BA1",
    realtimeStats: "\u5B9E\u65F6\u7EDF\u8BA1",
    refreshButton: "\u5237\u65B0",
    logoutButton: "\u9000\u51FA",
    recordsTitle: "\u9605\u8BFB\u8BB0\u5F55",
    loadButton: "\u52A0\u8F7D",
    tableDocument: "\u6587\u6863",
    tableProgress: "\u8FDB\u5EA6",
    tableDevice: "\u8BBE\u5907",
    tableDeviceId: "\u8BBE\u5907ID",
    tableUpdatedAt: "\u66F4\u65B0\u65F6\u95F4",
    requestFailed: "\u8BF7\u6C42\u5931\u8D25",
    statTotalRecords: "\u603B\u8BB0\u5F55\u6570",
    statTotalDocuments: "\u6587\u6863\u6570",
    statTotalDevices: "\u8BBE\u5907\u6570",
    statActiveDays: "\u6D3B\u8DC3\u5929\u6570",
    statAverageProgress: "\u5E73\u5747\u8FDB\u5EA6",
    statLastSync: "\u6700\u540E\u540C\u6B65",
    userPrefix: "\u7528\u6237\uFF1A",
    deviceDistributionPrefix: "\u8BBE\u5907\u5206\u5E03\uFF1A",
    readingStatsTitle: "\u9605\u8BFB\u7EDF\u8BA1",
    statTotalBooks: "\u4E66\u7C4D\u6570",
    statTotalReadTime: "\u603B\u9605\u8BFB\u65F6\u957F",
    statTotalReadPages: "\u603B\u9605\u8BFB\u9875\u6570",
    statLastOpen: "\u6700\u540E\u6253\u5F00",
    statisticsBooksTitle: "\u4E66\u7C4D\u7EDF\u8BA1",
    tableMd5: "MD5",
    tableTitle: "\u6807\u9898",
    tableAuthors: "\u4F5C\u8005",
    tablePages: "\u603B\u9875\u6570",
    tableReadTime: "\u9605\u8BFB\u65F6\u957F",
    tableReadPages: "\u9605\u8BFB\u9875\u6570",
    tableLastOpen: "\u6700\u540E\u6253\u5F00",
    emptyStatisticsBooks: "\u6682\u65E0\u540C\u6B65\u7684\u9605\u8BFB\u7EDF\u8BA1\u4E66\u7C4D\u3002"
  }
};
var zh_default = zh;

// src/i18n/index.ts
var locales = {
  zh: zh_default,
  en: en_default,
  ja: ja_default
};
function pickLocale(acceptLanguageHeader) {
  const value = (acceptLanguageHeader || "").toLowerCase();
  if (value.includes("zh")) return "zh";
  if (value.includes("ja")) return "ja";
  return "en";
}
__name(pickLocale, "pickLocale");
function getMessages(locale) {
  return locales[locale] ?? locales.en;
}
__name(getMessages, "getMessages");

// src/ui/userPage.ts
init_modules_watch_stub();
function toScriptJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
__name(toScriptJson, "toScriptJson");
function renderUserPage(locale) {
  const m = getMessages(locale).user;
  const i18nJson = toScriptJson(m);
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${m.title}</title>
  <style>
    :root {
      --bg-start: #0f172a;
      --bg-end: #1e293b;
      --card: rgba(255,255,255,.9);
      --text: #0f172a;
      --subtle: #64748b;
      --primary: #2563eb;
      --primary-soft: #dbeafe;
      --danger: #dc2626;
      --ok: #059669;
      --border: #e2e8f0;
      --shadow: 0 20px 36px rgba(2, 6, 23, .16);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(1000px 640px at 8% 10%, #475569 0%, transparent 60%),
                  radial-gradient(1000px 640px at 85% 92%, #1d4ed8 0%, transparent 60%),
                  linear-gradient(135deg, var(--bg-start), var(--bg-end));
      min-height: 100vh;
      padding: 30px 14px;
    }
    .container { max-width: 1140px; margin: 0 auto; }
    .title { margin: 0 0 8px; color: #f8fafc; font-size: 32px; }
    .subtitle { margin: 0 0 18px; color: #cbd5e1; }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.4);
      border-radius: 18px;
      padding: 16px;
      box-shadow: var(--shadow);
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
    }
    .hidden { display: none; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .muted { color: var(--subtle); margin: 0; font-size: 13px; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    input, button {
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid var(--border);
    }
    input { background: #fff; min-width: 180px; }
    button {
      cursor: pointer;
      border: none;
      color: #fff;
      background: var(--primary);
      font-weight: 600;
    }
    button.secondary { background: #475569; }
    .pill {
      font-size: 12px;
      font-weight: 600;
      background: var(--primary-soft);
      color: #1d4ed8;
      border-radius: 999px;
      padding: 4px 9px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .grid-4 { grid-template-columns: repeat(4, minmax(170px, 1fr)); }
    .stat {
      border: 1px solid var(--border);
      background: #fff;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .stat .k { color: var(--subtle); font-size: 12px; }
    .stat .v { margin-top: 2px; font-size: 19px; font-weight: 700; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #334155;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .table-wrap { overflow: auto; margin-top: 10px; max-height: 520px; }
    .empty { color: var(--subtle); padding: 14px 0; font-size: 13px; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
      .grid-4 { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
    }
    @media (max-width: 640px) {
      .title { font-size: 26px; }
      input { min-width: 100%; }
      .grid, .grid-4 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${m.heading}</h1>
    <p class="subtitle">${m.subtitle}</p>

    <section class="card" id="loginCard">
      <h3 style="margin: 0 0 10px;">${m.loginSection}</h3>
      <div class="row">
        <input id="username" placeholder="${m.usernamePlaceholder}" />
        <input id="password" type="password" placeholder="${m.passwordPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top: 8px;"></p>
    </section>

    <section class="card hidden" id="dashboardCard">
      <div class="row row-between">
        <div>
          <h3 style="margin:0;">${m.statsTitle}</h3>
          <p id="userInfo" class="muted"></p>
        </div>
        <div class="row">
          <span class="pill">${m.realtimeStats}</span>
          <button id="refreshStatsBtn" class="secondary">${m.refreshButton}</button>
          <button id="logoutBtn" class="secondary">${m.logoutButton}</button>
        </div>
      </div>
      <div class="grid" id="statsGrid"></div>
      <p class="muted" id="deviceSummary" style="margin-top: 10px;"></p>
    </section>

    <section class="card hidden" id="readingStatsCard">
      <div class="row row-between">
        <h3 style="margin:0;">${m.readingStatsTitle}</h3>
        <button id="refreshBooksBtn" class="secondary">${m.refreshButton}</button>
      </div>
      <div class="grid grid-4" id="readingStatsGrid"></div>
    </section>

    <section class="card hidden" id="booksCard">
      <h3 style="margin:0;">${m.statisticsBooksTitle}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${m.tableTitle}</th>
              <th>${m.tableAuthors}</th>
              <th>${m.tableMd5}</th>
              <th>${m.tablePages}</th>
              <th>${m.tableReadTime}</th>
              <th>${m.tableReadPages}</th>
              <th>${m.tableLastOpen}</th>
            </tr>
          </thead>
          <tbody id="booksBody"></tbody>
        </table>
      </div>
      <div id="booksEmpty" class="empty hidden">${m.emptyStatisticsBooks}</div>
    </section>

    <section class="card hidden" id="recordsCard">
      <div class="row row-between">
        <h3 style="margin:0;">${m.recordsTitle}</h3>
        <div class="row">
          <input id="page" type="number" value="1" min="1" style="width:88px; min-width:88px;" />
          <input id="pageSize" type="number" value="20" min="1" max="100" style="width:100px; min-width:100px;" />
          <button id="loadBtn">${m.loadButton}</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${m.tableDocument}</th>
              <th>${m.tableProgress}</th>
              <th>${m.tableDevice}</th>
              <th>${m.tableDeviceId}</th>
              <th>${m.tableUpdatedAt}</th>
            </tr>
          </thead>
          <tbody id="recordsBody"></tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const dashboardCard = document.getElementById('dashboardCard');
    const recordsCard = document.getElementById('recordsCard');
    const readingStatsCard = document.getElementById('readingStatsCard');
    const booksCard = document.getElementById('booksCard');
    const loginMsg = document.getElementById('loginMsg');

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function formatPercent(value) {
      return (Number(value || 0) * 100).toFixed(2) + '%';
    }

    function formatDate(epochSec) {
      const sec = Number(epochSec || 0);
      if (!sec) return '-';
      return new Date(sec * MS_PER_SECOND).toLocaleString();
    }

    function formatDuration(totalSeconds) {
      const sec = Math.max(0, Number(totalSeconds || 0));
      const hour = Math.floor(sec / 3600);
      const minute = Math.floor((sec % 3600) / 60);
      if (hour > 0) return hour + 'h ' + minute + 'm';
      return minute + 'm';
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || I18N.requestFailed);
      return data;
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
    }

    function renderStats(summary) {
      const items = [
        [I18N.statTotalRecords, Number(summary.totalRecords || 0)],
        [I18N.statTotalDocuments, Number(summary.totalDocuments || 0)],
        [I18N.statTotalDevices, Number(summary.totalDevices || 0)],
        [I18N.statActiveDays, Number(summary.activeDays || 0)],
        [I18N.statAverageProgress, formatPercent(summary.averagePercentage)],
        [I18N.statLastSync, formatDate(summary.lastSyncAt)],
      ];
      document.getElementById('statsGrid').innerHTML = items
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(v) + '</div></div>')
        .join('');
    }

    function renderReadingStats(readingStatistics) {
      const items = [
        [I18N.statTotalBooks, Number(readingStatistics.totalBooks || 0)],
        [I18N.statTotalReadTime, formatDuration(readingStatistics.totalReadTime)],
        [I18N.statTotalReadPages, Number(readingStatistics.totalReadPages || 0)],
        [I18N.statLastOpen, formatDate(readingStatistics.lastOpenAt)],
      ];
      document.getElementById('readingStatsGrid').innerHTML = items
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(v) + '</div></div>')
        .join('');
    }

    function renderBooks(items) {
      const body = document.getElementById('booksBody');
      const empty = document.getElementById('booksEmpty');
      body.innerHTML = '';
      if (!Array.isArray(items) || items.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      for (const item of items) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(item.title) + '</td>' +
          '<td>' + escapeHtml(item.authors) + '</td>' +
          '<td>' + escapeHtml(item.md5) + '</td>' +
          '<td>' + escapeHtml(Number(item.pages || 0)) + '</td>' +
          '<td>' + escapeHtml(formatDuration(item.total_read_time)) + '</td>' +
          '<td>' + escapeHtml(Number(item.total_read_pages || 0)) + '</td>' +
          '<td>' + escapeHtml(formatDate(item.last_open)) + '</td>';
        body.appendChild(tr);
      }
    }

    async function loadMe() {
      try {
        const me = await jsonFetch('/web/me');
        document.getElementById('userInfo').textContent = I18N.userPrefix + me.username + ' (ID: ' + me.id + ')';
        loginCard.classList.add('hidden');
        dashboardCard.classList.remove('hidden');
        recordsCard.classList.remove('hidden');
        readingStatsCard.classList.remove('hidden');
        booksCard.classList.remove('hidden');
        await Promise.all([loadStats(), loadRecords(), loadBooks()]);
      } catch {
        loginCard.classList.remove('hidden');
        dashboardCard.classList.add('hidden');
        recordsCard.classList.add('hidden');
        readingStatsCard.classList.add('hidden');
        booksCard.classList.add('hidden');
      }
    }

    async function loadStats() {
      const data = await jsonFetch('/web/stats');
      renderStats(data.summary || {});
      renderReadingStats(data.readingStatistics || {});
      const devices = (data.devices || [])
        .map((d) => String(d.device) + ': ' + Number(d.count))
        .join(' / ') || '-';
      document.getElementById('deviceSummary').textContent = I18N.deviceDistributionPrefix + devices;
    }

    async function loadBooks() {
      const data = await jsonFetch('/web/statistics/books');
      renderBooks(data.items || []);
    }

    async function loadRecords() {
      const page = Number(document.getElementById('page').value || 1);
      const pageSize = Number(document.getElementById('pageSize').value || 20);
      const data = await jsonFetch('/web/records?page=' + page + '&pageSize=' + pageSize);
      const tbody = document.getElementById('recordsBody');
      tbody.innerHTML = '';
      for (const item of data.items || []) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(item.document) + '</td>' +
          '<td>' + formatPercent(item.percentage) + '</td>' +
          '<td>' + escapeHtml(item.device) + '</td>' +
          '<td>' + escapeHtml(item.device_id) + '</td>' +
          '<td>' + escapeHtml(formatDate(item.timestamp)) + '</td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        await jsonFetch('/web/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        setMessage(loginMsg, I18N.loginSuccess, false);
        await loadMe();
      } catch (e) {
        setMessage(loginMsg, e.message, true);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await jsonFetch('/web/auth/logout', { method: 'POST', body: '{}' });
      await loadMe();
    });

    document.getElementById('loadBtn').addEventListener('click', async () => {
      try { await loadRecords(); } catch {}
    });

    document.getElementById('refreshStatsBtn').addEventListener('click', async () => {
      try { await loadStats(); } catch {}
    });

    document.getElementById('refreshBooksBtn').addEventListener('click', async () => {
      try {
        await Promise.all([loadStats(), loadBooks()]);
      } catch {}
    });

    loadMe();
  <\/script>
</body>
</html>`;
}
__name(renderUserPage, "renderUserPage");

// src/routes/user.ts
var router2 = new Hono2();
function numberOrZero2(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
__name(numberOrZero2, "numberOrZero");
function parseStatisticsSnapshot(snapshotJson) {
  try {
    const parsed = JSON.parse(snapshotJson);
    if (!parsed || typeof parsed !== "object") return null;
    const booksRaw = parsed.books;
    if (!Array.isArray(booksRaw)) return { books: [] };
    const books = [];
    for (const item of booksRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item;
      const md5Value = typeof row.md5 === "string" ? row.md5.trim() : "";
      if (!md5Value) continue;
      books.push({
        md5: md5Value,
        title: typeof row.title === "string" ? row.title : "",
        authors: typeof row.authors === "string" ? row.authors : "",
        notes: numberOrZero2(row.notes),
        last_open: numberOrZero2(row.last_open),
        highlights: numberOrZero2(row.highlights),
        pages: numberOrZero2(row.pages),
        series: typeof row.series === "string" ? row.series : "",
        language: typeof row.language === "string" ? row.language : "",
        total_read_time: numberOrZero2(row.total_read_time),
        total_read_pages: numberOrZero2(row.total_read_pages),
        page_stat_data: []
      });
    }
    return { books };
  } catch {
    return null;
  }
}
__name(parseStatisticsSnapshot, "parseStatisticsSnapshot");
router2.post("/web/auth/login", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const username = (body.username || "").trim();
  const password = body.password || "";
  const user = await findUserByUsername(c.env, username);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  const md5HashedPassword = (0, import_js_md52.md5)(password);
  const iterations = parsePbkdf2Iterations(c.env);
  const ok = await verifyPassword(md5HashedPassword, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);
  const token = generateSessionToken();
  const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
  const ttlHours = parseSessionTtlHours(c.env);
  const expiresAt = Math.floor(Date.now() / 1e3) + ttlHours * 3600;
  await c.env.DB.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").bind(user.id, tokenHash, expiresAt).run();
  setCookie(c, USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: ttlHours * 3600
  });
  return c.json({ username: user.username });
});
router2.post("/web/auth/logout", async (c) => {
  const token = getCookie(c, USER_SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  deleteCookie(c, USER_SESSION_COOKIE, { path: "/" });
  return c.json({ status: "ok" });
});
router2.get("/web/me", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ id: auth.userId, username: auth.username });
});
router2.get("/web/records", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "20")));
  const offset = (page - 1) * pageSize;
  const { results } = await c.env.DB.prepare(
    `SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`
  ).bind(auth.userId, pageSize, offset).all();
  return c.json({ page, pageSize, items: results ?? [] });
});
router2.get("/web/stats", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const summary = await c.env.DB.prepare(
    `SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT document) AS total_documents,
      COUNT(DISTINCT device) AS total_devices,
      COUNT(DISTINCT date(timestamp, 'unixepoch')) AS active_days,
      AVG(percentage) AS avg_percentage,
      MAX(timestamp) AS last_sync_at
     FROM progress
     WHERE user_id = ?`
  ).bind(auth.userId).first();
  const { results: devices } = await c.env.DB.prepare(
    `SELECT device, COUNT(*) as count
     FROM progress
     WHERE user_id = ?
     GROUP BY device
     ORDER BY count DESC`
  ).bind(auth.userId).all();
  const statistics = await getStatisticsSnapshot(c.env, auth.userId);
  const snapshot = statistics ? parseStatisticsSnapshot(statistics.snapshot_json) : null;
  const books = snapshot?.books ?? [];
  const totalReadTime = books.reduce((sum, item) => sum + Number(item.total_read_time || 0), 0);
  const totalReadPages = books.reduce((sum, item) => sum + Number(item.total_read_pages || 0), 0);
  const statisticsLastOpen = books.reduce((max, item) => Math.max(max, Number(item.last_open || 0)), 0);
  return c.json({
    summary: {
      totalRecords: summary?.total_records ?? 0,
      totalDocuments: summary?.total_documents ?? 0,
      totalDevices: summary?.total_devices ?? 0,
      activeDays: summary?.active_days ?? 0,
      averagePercentage: summary?.avg_percentage ?? 0,
      lastSyncAt: summary?.last_sync_at ?? null
    },
    readingStatistics: {
      totalBooks: books.length,
      totalReadTime,
      totalReadPages,
      lastOpenAt: statisticsLastOpen || null
    },
    devices: devices ?? []
  });
});
router2.get("/web/statistics/books", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const statistics = await getStatisticsSnapshot(c.env, auth.userId);
  if (!statistics) return c.json({ schemaVersion: null, items: [] });
  const snapshot = parseStatisticsSnapshot(statistics.snapshot_json);
  const books = (snapshot?.books ?? []).sort(
    (a, b) => Number(b.total_read_time || 0) - Number(a.total_read_time || 0)
  );
  return c.json({
    schemaVersion: statistics.schema_version,
    device: statistics.device,
    deviceId: statistics.device_id,
    items: books
  });
});
router2.get("/", (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  return c.html(renderUserPage(locale));
});
var user_default = router2;

// src/routes/admin.ts
init_modules_watch_stub();
var import_js_md53 = __toESM(require_md5(), 1);

// src/ui/adminPage.ts
init_modules_watch_stub();
function toScriptJson2(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
__name(toScriptJson2, "toScriptJson");
function renderAdminPage(locale) {
  const m = getMessages(locale).admin;
  const i18nJson = toScriptJson2(m);
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${m.title}</title>
  <style>
    :root {
      --bg: #0b1220;
      --bg2: #111827;
      --card: rgba(255,255,255,.92);
      --muted: #64748b;
      --primary: #1d4ed8;
      --danger: #dc2626;
      --ok: #16a34a;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: linear-gradient(120deg, var(--bg), var(--bg2));
      color: #0f172a;
      min-height: 100vh;
      padding: 28px 16px;
    }
    .wrap { max-width: 1120px; margin: 0 auto; }
    .title { color: #e2e8f0; margin: 0 0 10px; font-size: 30px; }
    .subtitle { color: #cbd5e1; margin: 0 0 16px; font-size: 14px; }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 16px;
      box-shadow: 0 10px 28px rgba(2, 6, 23, .25);
      padding: 16px;
      margin-bottom: 14px;
      backdrop-filter: blur(8px);
    }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    input, button {
      font-size: 14px;
      border-radius: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
    }
    input { min-width: 280px; }
    button { border: 0; background: var(--primary); color: #fff; cursor: pointer; font-weight: 600; }
    button.secondary { background: #475569; }
    button.danger { background: var(--danger); }
    .hidden { display: none; }
    .muted { color: var(--muted); font-size: 13px; margin: 0; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    .badge {
      display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 999px;
      background: #dbeafe; color: #1d4ed8; font-weight: 600;
    }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
    th { background: #f8fafc; color: #334155; position: sticky; top: 0; }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .action-row input { min-width: 170px; max-width: 220px; }
    @media (max-width: 760px) {
      .title { font-size: 24px; }
      input { min-width: 100%; }
      .action-row input { min-width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="title">${m.heading}</h1>
    <p class="subtitle">${m.subtitle}<a href="/" style="color:#93c5fd;">/</a></p>

    <section class="card" id="loginCard">
      <h3 style="margin-top:0;">${m.loginSection}</h3>
      <div class="row">
        <input id="token" type="password" placeholder="${m.tokenPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </section>

    <section class="card hidden" id="adminCard">
      <div class="row" style="justify-content:space-between;">
        <div class="row">
          <h3 style="margin:0;">${m.userManagement}</h3>
          <span class="badge">${m.adminSession}</span>
        </div>
        <div class="row">
          <button id="refreshBtn" class="secondary">${m.refreshButton}</button>
          <button id="logoutBtn" class="secondary">${m.logoutButton}</button>
        </div>
      </div>
      <p id="adminInfo" class="muted" style="margin-top:8px;"></p>
      <section class="card hidden" id="initCard" style="margin-top:10px;">
        <h4 style="margin:0 0 8px;">${m.initTitle}</h4>
        <p class="muted" style="margin:0 0 10px;" id="initDesc">${m.initDescription}</p>
        <div class="row">
          <button id="initBtn">${m.initButton}</button>
        </div>
      </section>
      <div id="usersTableWrap" style="overflow:auto; margin-top:10px; max-height:580px;">
        <table>
          <thead>
            <tr><th>${m.tableId}</th><th>${m.tableUsername}</th><th>${m.tableCreatedAt}</th><th>${m.tableActions}</th></tr>
          </thead>
          <tbody id="usersBody"></tbody>
        </table>
      </div>
      <p id="adminMsg" class="muted" style="margin-top:10px;"></p>
    </section>
  </div>

  <script>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const adminCard = document.getElementById('adminCard');
    const initCard = document.getElementById('initCard');
    const usersTableWrap = document.getElementById('usersTableWrap');
    const loginMsg = document.getElementById('loginMsg');
    const adminMsg = document.getElementById('adminMsg');

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
    }

    function isDbNotInitializedError(error) {
      return Boolean(error && typeof error === 'object' && error.code === 'DB_NOT_INITIALIZED');
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || I18N.requestFailed);
        err.code = data.code;
        throw err;
      }
      return data;
    }

    async function loadInitStatus() {
      const status = await jsonFetch('/admin/init/status');
      if (status.initialized) {
        initCard.classList.add('hidden');
        usersTableWrap.classList.remove('hidden');
        await loadUsers();
        return;
      }
      initCard.classList.remove('hidden');
      usersTableWrap.classList.add('hidden');
      setMessage(adminMsg, I18N.initRequired, true);
    }

    async function loadAdmin() {
      try {
        await jsonFetch('/admin/me');
        loginCard.classList.add('hidden');
        adminCard.classList.remove('hidden');
        document.getElementById('adminInfo').textContent = I18N.statusLoggedIn;
        await loadInitStatus();
      } catch (e) {
        if (isDbNotInitializedError(e)) {
          loginCard.classList.add('hidden');
          adminCard.classList.remove('hidden');
          document.getElementById('adminInfo').textContent = I18N.statusLoggedIn;
          initCard.classList.remove('hidden');
          usersTableWrap.classList.add('hidden');
          setMessage(adminMsg, I18N.initRequired, true);
          return;
        }
        loginCard.classList.remove('hidden');
        adminCard.classList.add('hidden');
      }
    }

    async function loadUsers() {
      const data = await jsonFetch('/admin/users');
      const tbody = document.getElementById('usersBody');
      tbody.innerHTML = '';
      for (const item of data.items || []) {
        const tr = document.createElement('tr');
        const createdAt = item.created_at ? new Date(item.created_at * MS_PER_SECOND).toLocaleString() : '-';
        tr.innerHTML =
          '<td>' + Number(item.id) + '</td>' +
          '<td>' + escapeHtml(item.username) + '</td>' +
          '<td>' + createdAt + '</td>' +
          '<td><div class="action-row">' +
            '<input data-kind="password" type="password" aria-label="' + I18N.passwordAriaLabel + ' ' + escapeHtml(item.username) + '\uFF08ID: ' + Number(item.id) + '\uFF09" placeholder="' + I18N.passwordPlaceholder + '" />' +
            '<button data-kind="reset" data-id="' + Number(item.id) + '">' + I18N.resetPasswordButton + '</button>' +
            '<button class="danger" data-kind="delete" data-id="' + Number(item.id) + '">' + I18N.deleteUserButton + '</button>' +
          '</div></td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const token = document.getElementById('token').value;
      try {
        await jsonFetch('/admin/auth/login', { method: 'POST', body: JSON.stringify({ token }) });
        setMessage(loginMsg, I18N.loginSuccess, false);
        await loadAdmin();
      } catch (e) {
        setMessage(loginMsg, e.message, true);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await jsonFetch('/admin/auth/logout', { method: 'POST', body: '{}' });
      await loadAdmin();
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
      try { await loadInitStatus(); } catch {}
    });

    document.getElementById('initBtn').addEventListener('click', async () => {
      try {
        await jsonFetch('/admin/init', { method: 'POST', body: '{}' });
        setMessage(adminMsg, I18N.initSuccess, false);
        await loadInitStatus();
      } catch (e) {
        setMessage(adminMsg, e.message, true);
      }
    });

    document.getElementById('usersBody').addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const kind = target.getAttribute('data-kind');
      const id = Number(target.getAttribute('data-id'));
      if (!Number.isInteger(id) || id <= 0) return;

      try {
        if (kind === 'delete') {
          if (!confirm(I18N.confirmDeletePrefix + id + I18N.confirmDeleteSuffix)) return;
          await jsonFetch('/admin/users/' + id, { method: 'DELETE' });
          setMessage(adminMsg, I18N.deleteSuccessPrefix + id, false);
        } else if (kind === 'reset') {
          const row = target.closest('tr');
          const input = row ? row.querySelector('input[data-kind="password"]') : null;
          const password = input ? input.value : '';
          await jsonFetch('/admin/users/' + id + '/password', { method: 'PUT', body: JSON.stringify({ password }) });
          if (input) input.value = '';
          setMessage(adminMsg, I18N.resetSuccessPrefix + id, false);
        }
        await loadUsers();
      } catch (e) {
        setMessage(adminMsg, e.message, true);
      }
    });

    loadAdmin();
  <\/script>
</body>
</html>`;
}
__name(renderAdminPage, "renderAdminPage");

// src/routes/admin.ts
var router3 = new Hono2();
router3.post("/admin/auth/login", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const token = body.token || "";
  const expectedToken = c.env.ADMIN_TOKEN ?? "";
  if (!expectedToken) return c.json({ error: "Admin token is not configured" }, 500);
  if (!token || !timingSafeEqual(token, expectedToken)) return c.json({ error: "Invalid token" }, 401);
  const ttlHours = parseSessionTtlHours(c.env);
  const adminSessionHash = await sha256(`${expectedToken}:${c.env.PASSWORD_PEPPER}`);
  setCookie(c, ADMIN_SESSION_COOKIE, adminSessionHash, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: ttlHours * 3600
  });
  return c.json({ status: "ok" });
});
router3.post("/admin/auth/logout", async (c) => {
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: "/" });
  return c.json({ status: "ok" });
});
router3.get("/admin/me", async (c) => {
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ mode: auth.mode });
});
router3.get("/admin/users", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const users = await listUsers(c.env);
  return c.json({ items: users });
});
router3.delete("/admin/users/:id", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) return badRequest("Invalid user id");
  const deleted = await deleteUserById(c.env, userId);
  if (!deleted) return c.json({ error: "User not found" }, 404);
  return c.json({ status: "ok" });
});
router3.put("/admin/users/:id/password", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) return badRequest("Invalid user id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const newPassword = body.password || "";
  if (!isValidPassword(newPassword)) return badRequest("Password must be at least 8 characters");
  const user = await c.env.DB.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first();
  if (!user) return c.json({ error: "User not found" }, 404);
  const iterations = parsePbkdf2Iterations(c.env);
  const passwordHash = await hashPassword((0, import_js_md53.md5)(newPassword), user.username, c.env.PASSWORD_PEPPER, iterations);
  const updated = await updateUserPasswordById(c.env, userId, passwordHash);
  if (!updated) return c.json({ error: "User not found" }, 404);
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  return c.json({ status: "ok" });
});
router3.get("/admin/init/status", async (c) => {
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  return c.json(status);
});
router3.post("/admin/init", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  await initializeDatabase(c.env);
  return c.json({ status: "ok", message: messages.initSuccess });
});
router3.get("/admin", (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  return c.html(renderAdminPage(locale));
});
var admin_default = router3;

// src/index.ts
var app = new Hono2();
app.use("*", async (c, next) => {
  await next();
  withSecurityHeaders(c.res.headers);
});
app.route("/", koreader_default);
app.route("/", user_default);
app.route("/", admin_default);
app.get("/healthcheck", (c) => c.json({ state: "OK" }));
app.get("/health", (c) => c.json({ status: "ok" }));
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-JmYQWJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-JmYQWJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

js-md5/src/md5.js:
  (**
   * [js-md5]{@link https://github.com/emn178/js-md5}
   *
   * @namespace md5
   * @version 0.8.3
   * @author Chen, Yi-Cyuan [emn178@gmail.com]
   * @copyright Chen, Yi-Cyuan 2014-2023
   * @license MIT
   *)
*/
//# sourceMappingURL=index.js.map
