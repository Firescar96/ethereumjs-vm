'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var safeBuffer = require('safe-buffer');
var utils = _interopDefault(require('ethereumjs-util'));
var Trie = _interopDefault(require('merkle-patricia-tree/secure.js'));
var fees = _interopDefault(require('ethereum-common'));
var async = _interopDefault(require('async'));
var Account = _interopDefault(require('ethereumjs-account'));
var Tree = _interopDefault(require('functional-red-black-tree'));
var AsyncEventEmitter = _interopDefault(require('async-eventemitter'));
var Block = _interopDefault(require('ethereumjs-block'));
var Trie$1 = _interopDefault(require('merkle-patricia-tree'));
var bn128Module = _interopDefault(require('rustbn.js'));

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var env = {};
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}
function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = global.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var process$1 = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

var inherits;
if (typeof Object.create === 'function'){
  inherits = function inherits(ctor, superCtor) {
    // implementation from standard node.js 'util' module
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
var inherits$1 = inherits;

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
var formatRegExp = /%[sdj%]/g;
function format(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
}


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process$1.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process$1.throwDeprecation) {
        throw new Error(msg);
      } else if (process$1.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}


var debugs = {};
var debugEnviron;
function debuglog(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process$1.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = 0;
      debugs[set] = function() {
        var msg = format.apply(null, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
}


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isNull(arg) {
  return arg === null;
}

function isNullOrUndefined(arg) {
  return arg == null;
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isSymbol(arg) {
  return typeof arg === 'symbol';
}

function isUndefined(arg) {
  return arg === void 0;
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}

function isBuffer(maybeBuf) {
  return Buffer.isBuffer(maybeBuf);
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
function log() {
  console.log('%s - %s', timestamp(), format.apply(null, arguments));
}


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var util = {
  inherits: inherits$1,
  _extend: _extend,
  log: log,
  isBuffer: isBuffer,
  isPrimitive: isPrimitive,
  isFunction: isFunction,
  isError: isError,
  isDate: isDate,
  isObject: isObject,
  isRegExp: isRegExp,
  isUndefined: isUndefined,
  isSymbol: isSymbol,
  isString: isString,
  isNumber: isNumber,
  isNullOrUndefined: isNullOrUndefined,
  isNull: isNull,
  isBoolean: isBoolean,
  isArray: isArray,
  inspect: inspect,
  deprecate: deprecate,
  format: format,
  debuglog: debuglog
}

var fakeBlockchain = {
  getBlock: function getBlock(blockTag, cb) {
    var _hash;

    if (safeBuffer.Buffer.isBuffer(blockTag)) {
      _hash = utils.sha3(blockTag);
    } else if (Number.isInteger(blockTag)) {
      _hash = utils.sha3('0x' + utils.toBuffer(blockTag).toString('hex'));
    } else {
      cb(new Error('Unknown blockTag type'));
    }

    var block = {
      hash: function hash() {
        return _hash;
      }
    };

    cb(null, block);
  },

  delBlock: function delBlock(hash, cb) {
    cb(null);
  }
};

var Cache = function Cache(trie) {
  this._cache = Tree();
  this._checkpoints = [];
  this._deletes = [];
  this._trie = trie;
};

Cache.prototype.put = function (key, val, fromTrie) {
  var modified = !fromTrie;
  this._update(key, val, modified, true);
};

// returns the queried account or an empty account
Cache.prototype.get = function (key) {
  var account = this.lookup(key);
  if (!account) {
    account = new Account();
    account.exists = false;
  }
  return account;
};

// returns the queried account or undefined
Cache.prototype.lookup = function (key) {
  key = key.toString('hex');

  var it = this._cache.find(key);
  if (it.node) {
    var account = new Account(it.value.val);
    account.exists = it.value.exists;
    return account;
  }
};

Cache.prototype._lookupAccount = function (address, cb) {
  var self = this;
  self._trie.get(address, function (err, raw) {
    if (err) return cb(err);
    var account = new Account(raw);
    var exists = !!raw;
    account.exists = exists;
    cb(null, account, exists);
  });
};

Cache.prototype.getOrLoad = function (key, cb) {
  var self = this;
  var account = this.lookup(key);
  if (account) {
    cb(null, account);
  } else {
    self._lookupAccount(key, function (err, account, exists) {
      if (err) return cb(err);
      self._update(key, account, false, exists);
      cb(null, account);
    });
  }
};

Cache.prototype.warm = function (addresses, cb) {
  var self = this;
  // shim till async supports iterators
  var accountArr = [];
  addresses.forEach(function (val) {
    if (val) accountArr.push(val);
  });

  async.eachSeries(accountArr, function (addressHex, done) {
    var address = safeBuffer.Buffer.from(addressHex, 'hex');
    self._lookupAccount(address, function (err, account) {
      if (err) return done(err);
      self._update(address, account, false, account.exists);
      done();
    });
  }, cb);
};

Cache.prototype.flush = function (cb) {
  var it = this._cache.begin;
  var self = this;
  var next = true;
  async.whilst(function () {
    return next;
  }, function (done) {
    if (it.value && it.value.modified) {
      it.value.modified = false;
      it.value.val = it.value.val.serialize();
      self._trie.put(safeBuffer.Buffer.from(it.key, 'hex'), it.value.val, function () {
        next = it.hasNext;
        it.next();
        done();
      });
    } else {
      next = it.hasNext;
      it.next();
      done();
    }
  }, function () {
    async.eachSeries(self._deletes, function (address, done) {
      self._trie.del(address, done);
    }, function () {
      self._deletes = [];
      cb();
    });
  });
};

Cache.prototype.checkpoint = function () {
  this._checkpoints.push(this._cache);
};

Cache.prototype.revert = function () {
  this._cache = this._checkpoints.pop(this._cache);
};

Cache.prototype.commit = function () {
  this._checkpoints.pop();
};

Cache.prototype.clear = function () {
  this._deletes = [];
  this._cache = Tree();
};

Cache.prototype.del = function (key) {
  this._deletes.push(key);
  key = key.toString('hex');
  this._cache = this._cache.remove(key);
};

Cache.prototype._update = function (key, val, modified, exists) {
  key = key.toString('hex');
  var it = this._cache.find(key);
  if (it.node) {
    this._cache = it.update({
      val: val,
      modified: modified,
      exists: true
    });
  } else {
    this._cache = this._cache.insert(key, {
      val: val,
      modified: modified,
      exists: exists
    });
  }
};

var BN = utils.BN;
var rlp = utils.rlp;

function StateManager(opts) {
  var self = this;

  var trie = opts.trie;
  if (!trie) {
    trie = new Trie(trie);
  }

  var blockchain = opts.blockchain;
  if (!blockchain) {
    blockchain = fakeBlockchain;
  }

  self.blockchain = blockchain;
  self.trie = trie;
  self._storageTries = {}; // the storage trie cache
  self.cache = new Cache(trie);
  self.touched = [];
}

var proto = StateManager.prototype;

// gets the account from the cache, or triggers a lookup and stores
// the result in the cache
proto.getAccount = function (address, cb) {
  this.cache.getOrLoad(address, cb);
};

// checks if an account exists
proto.exists = function (address, cb) {
  this.cache.getOrLoad(address, function (err, account) {
    cb(err, account.exists);
  });
};

// saves the account
proto._putAccount = function (address, account, cb) {
  var self = this;
  var addressHex = safeBuffer.Buffer.from(address, 'hex');
  // TODO: dont save newly created accounts that have no balance
  // if (toAccount.balance.toString('hex') === '00') {
  // if they have money or a non-zero nonce or code, then write to tree
  self.cache.put(addressHex, account);
  self.touched.push(address);
  // self.trie.put(addressHex, account.serialize(), cb)
  cb();
};

proto.getAccountBalance = function (address, cb) {
  var self = this;
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }
    cb(null, account.balance);
  });
};

proto.putAccountBalance = function (address, balance, cb) {
  var self = this;

  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }

    if (new BN(balance).isZero() && !account.exists) {
      return cb(null);
    }

    account.balance = balance;
    self._putAccount(address, account, cb);
  });
};

// sets the contract code on the account
proto.putContractCode = function (address, value, cb) {
  var self = this;
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }
    // TODO: setCode use trie.setRaw which creates a storage leak
    account.setCode(self.trie, value, function (err) {
      if (err) {
        return cb(err);
      }
      self._putAccount(address, account, cb);
    });
  });
};

// given an account object, returns the code
proto.getContractCode = function (address, cb) {
  var self = this;
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }
    account.getCode(self.trie, cb);
  });
};

// creates a storage trie from the primary storage trie
proto._lookupStorageTrie = function (address, cb) {
  var self = this;
  // from state trie
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }
    var storageTrie = self.trie.copy();
    storageTrie.root = account.stateRoot;
    storageTrie._checkpoints = [];
    cb(null, storageTrie);
  });
};

// gets the storage trie from the storage cache or does lookup
proto._getStorageTrie = function (address, cb) {
  var self = this;
  var storageTrie = self._storageTries[address.toString('hex')];
  // from storage cache
  if (storageTrie) {
    return cb(null, storageTrie);
  }
  // lookup from state
  self._lookupStorageTrie(address, cb);
};

proto.getContractStorage = function (address, key, cb) {
  var self = this;
  self._getStorageTrie(address, function (err, trie) {
    if (err) {
      return cb(err);
    }
    trie.get(key, function (err, value) {
      if (err) {
        return cb(err);
      }
      var decoded = rlp.decode(value);
      cb(null, decoded);
    });
  });
};

proto.putContractStorage = function (address, key, value, cb) {
  var self = this;
  self._getStorageTrie(address, function (err, storageTrie) {
    if (err) {
      return cb(err);
    }

    if (value && value.length) {
      // format input
      var encodedValue = rlp.encode(value);
      storageTrie.put(key, encodedValue, finalize);
    } else {
      // deleting a value
      storageTrie.del(key, finalize);
    }

    function finalize(err) {
      if (err) return cb(err);
      // update storage cache
      self._storageTries[address.toString('hex')] = storageTrie;
      // update contract stateRoot
      var contract = self.cache.get(address);
      contract.stateRoot = storageTrie.root;
      self._putAccount(address, contract, cb);
      self.touched.push(address);
    }
  });
};

proto.commitContracts = function (cb) {
  var self = this;
  async.each(Object.keys(self._storageTries), function (address, cb) {
    var trie = self._storageTries[address];
    delete self._storageTries[address];
    // TODO: this is broken on the block level; all the contracts get written to
    // disk redardless of whether or not the block is valid
    if (trie.isCheckpoint) {
      trie.commit(cb);
    } else {
      cb();
    }
  }, cb);
};

proto.revertContracts = function () {
  var self = this;
  self._storageTries = {};
};

//
// blockchain
//
proto.getBlockHash = function (number, cb) {
  var self = this;
  self.blockchain.getBlock(number, function (err, block) {
    if (err) {
      return cb(err);
    }
    var blockHash = block.hash();
    cb(null, blockHash);
  });
};

//
// revision history
//
proto.checkpoint = function () {
  var self = this;
  self.trie.checkpoint();
  self.cache.checkpoint();
};

proto.commit = function (cb) {
  var self = this;
  // setup trie checkpointing
  self.trie.commit(function () {
    // setup cache checkpointing
    self.cache.commit();
    cb();
  });
};

proto.revert = function (cb) {
  var self = this;
  // setup trie checkpointing
  self.trie.revert();
  // setup cache checkpointing
  self.cache.revert();
  cb();
};

//
// cache stuff
//
proto.getStateRoot = function (cb) {
  var self = this;
  self.cacheFlush(function (err) {
    if (err) {
      return cb(err);
    }
    var stateRoot = self.trie.root;
    cb(null, stateRoot);
  });
};

/**
 * @param {Set} address
 * @param {cb} function
 */
proto.warmCache = function (addresses, cb) {
  this.cache.warm(addresses, cb);
};

proto.dumpStorage = function (address, cb) {
  var self = this;
  self._getStorageTrie(address, function (err, trie) {
    if (err) {
      return cb(err);
    }
    var storage = {};
    var stream = trie.createReadStream();
    stream.on('data', function (val) {
      storage[val.key.toString('hex')] = val.value.toString('hex');
    });
    stream.on('end', function () {
      cb(storage);
    });
  });
};

proto.hasGenesisState = function (cb) {
  var root = fees.genesisStateRoot.v;
  this.trie.checkRoot(root, cb);
};

proto.generateCanonicalGenesis = function (cb) {
  var self = this;

  this.hasGenesisState(function (err, genesis) {
    if (!genesis && !err) {
      self.generateGenesis(fees.genesisState, cb);
    } else {
      cb(err);
    }
  });
};

proto.generateGenesis = function (initState, cb) {
  var self = this;
  var addresses = Object.keys(initState);
  async.eachSeries(addresses, function (address, done) {
    var account = new Account();
    account.balance = new BN(initState[address]).toArrayLike(safeBuffer.Buffer);
    address = safeBuffer.Buffer.from(address, 'hex');
    self.trie.put(address, account.serialize(), done);
  }, cb);
};

proto.accountIsEmpty = function (address, cb) {
  var self = this;
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err);
    }

    cb(null, account.nonce.toString('hex') === '' && account.balance.toString('hex') === '' && account.codeHash.toString('hex') === utils.SHA3_NULL_S);
  });
};

var codes = {
  // 0x0 range - arithmetic ops
  // name, baseCost, off stack, on stack, dynamic, async
  0x00: ['STOP', 0, 0, 0, false],
  0x01: ['ADD', 3, 2, 1, false],
  0x02: ['MUL', 5, 2, 1, false],
  0x03: ['SUB', 3, 2, 1, false],
  0x04: ['DIV', 5, 2, 1, false],
  0x05: ['SDIV', 5, 2, 1, false],
  0x06: ['MOD', 5, 2, 1, false],
  0x07: ['SMOD', 5, 2, 1, false],
  0x08: ['ADDMOD', 8, 3, 1, false],
  0x09: ['MULMOD', 8, 3, 1, false],
  0x0a: ['EXP', 10, 2, 1, false],
  0x0b: ['SIGNEXTEND', 5, 2, 1, false],

  // 0x10 range - bit ops
  0x10: ['LT', 3, 2, 1, false],
  0x11: ['GT', 3, 2, 1, false],
  0x12: ['SLT', 3, 2, 1, false],
  0x13: ['SGT', 3, 2, 1, false],
  0x14: ['EQ', 3, 2, 1, false],
  0x15: ['ISZERO', 3, 1, 1, false],
  0x16: ['AND', 3, 2, 1, false],
  0x17: ['OR', 3, 2, 1, false],
  0x18: ['XOR', 3, 2, 1, false],
  0x19: ['NOT', 3, 1, 1, false],
  0x1a: ['BYTE', 3, 2, 1, false],

  // 0x20 range - crypto
  0x20: ['SHA3', 30, 2, 1, false],

  // 0x30 range - closure state
  0x30: ['ADDRESS', 2, 0, 1, true],
  0x31: ['BALANCE', 400, 1, 1, true, true],
  0x32: ['ORIGIN', 2, 0, 1, true],
  0x33: ['CALLER', 2, 0, 1, true],
  0x34: ['CALLVALUE', 2, 0, 1, true],
  0x35: ['CALLDATALOAD', 3, 1, 1, true],
  0x36: ['CALLDATASIZE', 2, 0, 1, true],
  0x37: ['CALLDATACOPY', 3, 3, 0, true],
  0x38: ['CODESIZE', 2, 0, 1, false],
  0x39: ['CODECOPY', 3, 3, 0, false],
  0x3a: ['GASPRICE', 2, 0, 1, false],
  0x3b: ['EXTCODESIZE', 700, 1, 1, true, true],
  0x3c: ['EXTCODECOPY', 700, 4, 0, true, true],
  0x3d: ['RETURNDATASIZE', 2, 0, 1, true],
  0x3e: ['RETURNDATACOPY', 3, 3, 0, true],

  // '0x40' range - block operations
  0x40: ['BLOCKHASH', 20, 1, 1, true, true],
  0x41: ['COINBASE', 2, 0, 1, true],
  0x42: ['TIMESTAMP', 2, 0, 1, true],
  0x43: ['NUMBER', 2, 0, 1, true],
  0x44: ['DIFFICULTY', 2, 0, 1, true],
  0x45: ['GASLIMIT', 2, 0, 1, true],

  // 0x50 range - 'storage' and execution
  0x50: ['POP', 2, 1, 0, false],
  0x51: ['MLOAD', 3, 1, 1, false],
  0x52: ['MSTORE', 3, 2, 0, false],
  0x53: ['MSTORE8', 3, 2, 0, false],
  0x54: ['SLOAD', 200, 1, 1, true, true],
  0x55: ['SSTORE', 0, 2, 0, true, true],
  0x56: ['JUMP', 8, 1, 0, false],
  0x57: ['JUMPI', 10, 2, 0, false],
  0x58: ['PC', 2, 0, 1, false],
  0x59: ['MSIZE', 2, 0, 1, false],
  0x5a: ['GAS', 2, 0, 1, false],
  0x5b: ['JUMPDEST', 1, 0, 0, false],

  // 0x60, range
  0x60: ['PUSH', 3, 0, 1, false],
  0x61: ['PUSH', 3, 0, 1, false],
  0x62: ['PUSH', 3, 0, 1, false],
  0x63: ['PUSH', 3, 0, 1, false],
  0x64: ['PUSH', 3, 0, 1, false],
  0x65: ['PUSH', 3, 0, 1, false],
  0x66: ['PUSH', 3, 0, 1, false],
  0x67: ['PUSH', 3, 0, 1, false],
  0x68: ['PUSH', 3, 0, 1, false],
  0x69: ['PUSH', 3, 0, 1, false],
  0x6a: ['PUSH', 3, 0, 1, false],
  0x6b: ['PUSH', 3, 0, 1, false],
  0x6c: ['PUSH', 3, 0, 1, false],
  0x6d: ['PUSH', 3, 0, 1, false],
  0x6e: ['PUSH', 3, 0, 1, false],
  0x6f: ['PUSH', 3, 0, 1, false],
  0x70: ['PUSH', 3, 0, 1, false],
  0x71: ['PUSH', 3, 0, 1, false],
  0x72: ['PUSH', 3, 0, 1, false],
  0x73: ['PUSH', 3, 0, 1, false],
  0x74: ['PUSH', 3, 0, 1, false],
  0x75: ['PUSH', 3, 0, 1, false],
  0x76: ['PUSH', 3, 0, 1, false],
  0x77: ['PUSH', 3, 0, 1, false],
  0x78: ['PUSH', 3, 0, 1, false],
  0x79: ['PUSH', 3, 0, 1, false],
  0x7a: ['PUSH', 3, 0, 1, false],
  0x7b: ['PUSH', 3, 0, 1, false],
  0x7c: ['PUSH', 3, 0, 1, false],
  0x7d: ['PUSH', 3, 0, 1, false],
  0x7e: ['PUSH', 3, 0, 1, false],
  0x7f: ['PUSH', 3, 0, 1, false],

  0x80: ['DUP', 3, 0, 1, false],
  0x81: ['DUP', 3, 0, 1, false],
  0x82: ['DUP', 3, 0, 1, false],
  0x83: ['DUP', 3, 0, 1, false],
  0x84: ['DUP', 3, 0, 1, false],
  0x85: ['DUP', 3, 0, 1, false],
  0x86: ['DUP', 3, 0, 1, false],
  0x87: ['DUP', 3, 0, 1, false],
  0x88: ['DUP', 3, 0, 1, false],
  0x89: ['DUP', 3, 0, 1, false],
  0x8a: ['DUP', 3, 0, 1, false],
  0x8b: ['DUP', 3, 0, 1, false],
  0x8c: ['DUP', 3, 0, 1, false],
  0x8d: ['DUP', 3, 0, 1, false],
  0x8e: ['DUP', 3, 0, 1, false],
  0x8f: ['DUP', 3, 0, 1, false],

  0x90: ['SWAP', 3, 0, 0, false],
  0x91: ['SWAP', 3, 0, 0, false],
  0x92: ['SWAP', 3, 0, 0, false],
  0x93: ['SWAP', 3, 0, 0, false],
  0x94: ['SWAP', 3, 0, 0, false],
  0x95: ['SWAP', 3, 0, 0, false],
  0x96: ['SWAP', 3, 0, 0, false],
  0x97: ['SWAP', 3, 0, 0, false],
  0x98: ['SWAP', 3, 0, 0, false],
  0x99: ['SWAP', 3, 0, 0, false],
  0x9a: ['SWAP', 3, 0, 0, false],
  0x9b: ['SWAP', 3, 0, 0, false],
  0x9c: ['SWAP', 3, 0, 0, false],
  0x9d: ['SWAP', 3, 0, 0, false],
  0x9e: ['SWAP', 3, 0, 0, false],
  0x9f: ['SWAP', 3, 0, 0, false],

  0xa0: ['LOG', 375, 2, 0, false],
  0xa1: ['LOG', 375, 3, 0, false],
  0xa2: ['LOG', 375, 4, 0, false],
  0xa3: ['LOG', 375, 5, 0, false],
  0xa4: ['LOG', 375, 6, 0, false],

  // '0xf0' range - closures
  0xf0: ['CREATE', 32000, 3, 1, true, true],
  0xf1: ['CALL', 700, 7, 1, true, true],
  0xf2: ['CALLCODE', 700, 7, 1, true, true],
  0xf3: ['RETURN', 0, 2, 0, false],
  0xf4: ['DELEGATECALL', 700, 6, 1, true, true],
  0xfa: ['STATICCALL', 700, 6, 1, true, true],
  0xfd: ['REVERT', 0, 2, 0, false],

  // '0x70', range - other
  0xfe: ['INVALID', 0, 0, 0, false],
  0xff: ['SELFDESTRUCT', 5000, 1, 0, false, true]
};

function lookupOpInfo (op, full) {
  var code = codes[op] ? codes[op] : ['INVALID', 0, 0, 0, false, false];
  var opcode = code[0];

  if (full) {
    if (opcode === 'LOG') {
      opcode += op - 0xa0;
    }

    if (opcode === 'PUSH') {
      opcode += op - 0x5f;
    }

    if (opcode === 'DUP') {
      opcode += op - 0x7f;
    }

    if (opcode === 'SWAP') {
      opcode += op - 0x8f;
    }
  }

  return { name: opcode, opcode: op, fee: code[1], in: code[2], out: code[3], dynamic: code[4], async: code[5] };
}

var ERROR = {
  OUT_OF_GAS: 'out of gas',
  STACK_UNDERFLOW: 'stack underflow',
  STACK_OVERFLOW: 'stack overflow',
  INVALID_JUMP: 'invalid JUMP',
  INVALID_OPCODE: 'invalid opcode',
  REVERT: 'revert',
  STATIC_STATE_CHANGE: 'static state change',
  INTERNAL_ERROR: 'internal error'
};

function VmError(error) {
  this.error = error;
}

var BN$1 = utils.BN;
var pow32 = new BN$1('010000000000000000000000000000000000000000000000000000000000000000', 16);
var pow31 = new BN$1('0100000000000000000000000000000000000000000000000000000000000000', 16);
var pow30 = new BN$1('01000000000000000000000000000000000000000000000000000000000000', 16);
var pow29 = new BN$1('010000000000000000000000000000000000000000000000000000000000', 16);
var pow28 = new BN$1('0100000000000000000000000000000000000000000000000000000000', 16);
var pow27 = new BN$1('01000000000000000000000000000000000000000000000000000000', 16);
var pow26 = new BN$1('010000000000000000000000000000000000000000000000000000', 16);
var pow25 = new BN$1('0100000000000000000000000000000000000000000000000000', 16);
var pow24 = new BN$1('01000000000000000000000000000000000000000000000000', 16);
var pow23 = new BN$1('010000000000000000000000000000000000000000000000', 16);
var pow22 = new BN$1('0100000000000000000000000000000000000000000000', 16);
var pow21 = new BN$1('01000000000000000000000000000000000000000000', 16);
var pow20 = new BN$1('010000000000000000000000000000000000000000', 16);
var pow19 = new BN$1('0100000000000000000000000000000000000000', 16);
var pow18 = new BN$1('01000000000000000000000000000000000000', 16);
var pow17 = new BN$1('010000000000000000000000000000000000', 16);
var pow16 = new BN$1('0100000000000000000000000000000000', 16);
var pow15 = new BN$1('01000000000000000000000000000000', 16);
var pow14 = new BN$1('010000000000000000000000000000', 16);
var pow13 = new BN$1('0100000000000000000000000000', 16);
var pow12 = new BN$1('01000000000000000000000000', 16);
var pow11 = new BN$1('010000000000000000000000', 16);
var pow10 = new BN$1('0100000000000000000000', 16);
var pow9 = new BN$1('01000000000000000000', 16);
var pow8 = new BN$1('010000000000000000', 16);
var pow7 = new BN$1('0100000000000000', 16);
var pow6 = new BN$1('01000000000000', 16);
var pow5 = new BN$1('010000000000', 16);
var pow4 = new BN$1('0100000000', 16);
var pow3 = new BN$1('01000000', 16);
var pow2 = new BN$1('010000', 16);
var pow1 = new BN$1('0100', 16);

function logTable (a) {
  if (a.cmp(pow1) === -1) {
    return 0;
  } else if (a.cmp(pow2) === -1) {
    return 1;
  } else if (a.cmp(pow3) === -1) {
    return 2;
  } else if (a.cmp(pow4) === -1) {
    return 3;
  } else if (a.cmp(pow5) === -1) {
    return 4;
  } else if (a.cmp(pow6) === -1) {
    return 5;
  } else if (a.cmp(pow7) === -1) {
    return 6;
  } else if (a.cmp(pow8) === -1) {
    return 7;
  } else if (a.cmp(pow9) === -1) {
    return 8;
  } else if (a.cmp(pow10) === -1) {
    return 9;
  } else if (a.cmp(pow11) === -1) {
    return 10;
  } else if (a.cmp(pow12) === -1) {
    return 11;
  } else if (a.cmp(pow13) === -1) {
    return 12;
  } else if (a.cmp(pow14) === -1) {
    return 13;
  } else if (a.cmp(pow15) === -1) {
    return 14;
  } else if (a.cmp(pow16) === -1) {
    return 15;
  } else if (a.cmp(pow17) === -1) {
    return 16;
  } else if (a.cmp(pow18) === -1) {
    return 17;
  } else if (a.cmp(pow19) === -1) {
    return 18;
  } else if (a.cmp(pow20) === -1) {
    return 19;
  } else if (a.cmp(pow21) === -1) {
    return 20;
  } else if (a.cmp(pow22) === -1) {
    return 21;
  } else if (a.cmp(pow23) === -1) {
    return 22;
  } else if (a.cmp(pow24) === -1) {
    return 23;
  } else if (a.cmp(pow25) === -1) {
    return 24;
  } else if (a.cmp(pow26) === -1) {
    return 25;
  } else if (a.cmp(pow27) === -1) {
    return 26;
  } else if (a.cmp(pow28) === -1) {
    return 27;
  } else if (a.cmp(pow29) === -1) {
    return 28;
  } else if (a.cmp(pow30) === -1) {
    return 29;
  } else if (a.cmp(pow31) === -1) {
    return 30;
  } else if (a.cmp(pow32) === -1) {
    return 31;
  } else {
    return 32;
  }
}

var BN$2 = utils.BN;
var MASK_160 = new BN$2(1).shln(160).subn(1);

// Find Ceil(`this` / `num`)
BN$2.prototype.divCeil = function divCeil(num) {
  var dm = this.divmod(num);

  // Fast case - exact division
  if (dm.mod.isZero()) return dm.div;

  // Round up
  return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
};

function addressToBuffer(address) {
  return address.and(MASK_160).toArrayLike(safeBuffer.Buffer, 'be', 20);
}

// the opcode functions
var opFns = {
  STOP: function STOP(runState) {
    runState.stopped = true;
  },
  ADD: function ADD(a, b, runState) {
    return a.add(b).mod(utils.TWO_POW256);
  },
  MUL: function MUL(a, b, runState) {
    return a.mul(b).mod(utils.TWO_POW256);
  },
  SUB: function SUB(a, b, runState) {
    return a.sub(b).toTwos(256);
  },
  DIV: function DIV(a, b, runState) {
    if (b.isZero()) {
      return new BN$2(b);
    } else {
      return a.div(b);
    }
  },
  SDIV: function SDIV(a, b, runState) {
    if (b.isZero()) {
      return new BN$2(b);
    } else {
      a = a.fromTwos(256);
      b = b.fromTwos(256);
      return a.div(b).toTwos(256);
    }
  },
  MOD: function MOD(a, b, runState) {
    if (b.isZero()) {
      return new BN$2(b);
    } else {
      return a.mod(b);
    }
  },
  SMOD: function SMOD(a, b, runState) {
    if (b.isZero()) {
      return new BN$2(b);
    } else {
      a = a.fromTwos(256);
      b = b.fromTwos(256);
      var r = a.abs().mod(b.abs());
      if (a.isNeg()) {
        r = r.ineg();
      }
      return r.toTwos(256);
    }
  },
  ADDMOD: function ADDMOD(a, b, c, runState) {
    if (c.isZero()) {
      return new BN$2(c);
    } else {
      return a.add(b).mod(c);
    }
  },
  MULMOD: function MULMOD(a, b, c, runState) {
    if (c.isZero()) {
      return new BN$2(c);
    } else {
      return a.mul(b).mod(c);
    }
  },
  EXP: function EXP(base, exponent, runState) {
    var m = BN$2.red(utils.TWO_POW256);

    base = base.toRed(m);

    if (!exponent.isZero()) {
      var bytes = 1 + logTable(exponent);
      subGas(runState, new BN$2(bytes).muln(fees.expByteGas.v));
      return base.redPow(exponent);
    } else {
      return new BN$2(1);
    }
  },
  SIGNEXTEND: function SIGNEXTEND(k, val, runState) {
    val = val.toArrayLike(safeBuffer.Buffer, 'be', 32);
    var extendOnes = false;

    if (k.lten(31)) {
      k = k.toNumber();

      if (val[31 - k] & 0x80) {
        extendOnes = true;
      }

      // 31-k-1 since k-th byte shouldn't be modified
      for (var i = 30 - k; i >= 0; i--) {
        val[i] = extendOnes ? 0xff : 0;
      }
    }

    return new BN$2(val);
  },
  // 0x10 range - bit ops
  LT: function LT(a, b, runState) {
    return new BN$2(a.lt(b) ? 1 : 0);
  },
  GT: function GT(a, b, runState) {
    return new BN$2(a.gt(b) ? 1 : 0);
  },
  SLT: function SLT(a, b, runState) {
    return new BN$2(a.fromTwos(256).lt(b.fromTwos(256)) ? 1 : 0);
  },
  SGT: function SGT(a, b, runState) {
    return new BN$2(a.fromTwos(256).gt(b.fromTwos(256)) ? 1 : 0);
  },
  EQ: function EQ(a, b, runState) {
    return new BN$2(a.eq(b) ? 1 : 0);
  },
  ISZERO: function ISZERO(a, runState) {
    return new BN$2(a.isZero() ? 1 : 0);
  },
  AND: function AND(a, b, runState) {
    return a.and(b);
  },
  OR: function OR(a, b, runState) {
    return a.or(b);
  },
  XOR: function XOR(a, b, runState) {
    return a.xor(b);
  },
  NOT: function NOT(a, runState) {
    return a.notn(256);
  },
  BYTE: function BYTE(pos, word, runState) {
    if (pos.gten(32)) {
      return new BN$2(0);
    }

    pos = pos.toNumber();
    word = word.toArrayLike(safeBuffer.Buffer, 'be', 32);
    word = utils.setLengthLeft(word, 32);

    return new BN$2(word[pos]);
  },
  // 0x20 range - crypto
  SHA3: function SHA3(offset, length, runState) {
    var data = memLoad(runState, offset, length);
    // copy fee
    subGas(runState, new BN$2(fees.sha3WordGas.v).imul(length.divCeil(new BN$2(32))));
    return new BN$2(utils.sha3(data));
  },
  // 0x30 range - closure state
  ADDRESS: function ADDRESS(runState) {
    return new BN$2(runState.address);
  },
  BALANCE: function BALANCE(address, runState, cb) {
    var stateManager = runState.stateManager;
    // stack to address
    address = addressToBuffer(address);

    // shortcut if current account
    if (address.toString('hex') === runState.address.toString('hex')) {
      cb(null, new BN$2(runState.contract.balance));
      return;
    }

    // otherwise load account then return balance
    stateManager.getAccountBalance(address, function (err, value) {
      if (err) {
        return cb(err);
      }
      cb(null, new BN$2(value));
    });
  },
  ORIGIN: function ORIGIN(runState) {
    return new BN$2(runState.origin);
  },
  CALLER: function CALLER(runState) {
    return new BN$2(runState.caller);
  },
  CALLVALUE: function CALLVALUE(runState) {
    return new BN$2(runState.callValue);
  },
  CALLDATALOAD: function CALLDATALOAD(pos, runState) {
    if (pos.gtn(runState.callData.length)) {
      return new BN$2(0);
    } else {
      pos = pos.toNumber();
      var loaded = runState.callData.slice(pos, pos + 32);
      loaded = loaded.length ? loaded : safeBuffer.Buffer.from([0]);
      return new BN$2(utils.setLengthRight(loaded, 32));
    }
  },
  CALLDATASIZE: function CALLDATASIZE(runState) {
    if (runState.callData.length === 1 && runState.callData[0] === 0) {
      return new BN$2(0);
    } else {
      return new BN$2(runState.callData.length);
    }
  },
  CALLDATACOPY: function CALLDATACOPY(memOffset, dataOffset, dataLength, runState) {
    memStore(runState, memOffset, runState.callData, dataOffset, dataLength);
    // sub the COPY fee
    subGas(runState, new BN$2(fees.copyGas.v).imul(dataLength.divCeil(new BN$2(32))));
  },
  CODESIZE: function CODESIZE(runState) {
    return new BN$2(runState.code.length);
  },
  CODECOPY: function CODECOPY(memOffset, codeOffset, length, runState) {
    memStore(runState, memOffset, runState.code, codeOffset, length);
    // sub the COPY fee
    subGas(runState, new BN$2(fees.copyGas.v).imul(length.divCeil(new BN$2(32))));
  },
  EXTCODESIZE: function EXTCODESIZE(address, runState, cb) {
    var stateManager = runState.stateManager;
    address = addressToBuffer(address);
    stateManager.getContractCode(address, function (err, code) {
      if (err) return cb(err);
      cb(null, new BN$2(code.length));
    });
  },
  EXTCODECOPY: function EXTCODECOPY(address, memOffset, codeOffset, length, runState, cb) {
    var stateManager = runState.stateManager;
    address = addressToBuffer(address);

    // FIXME: for some reason this must come before subGas
    subMemUsage(runState, memOffset, length);
    // copy fee
    subGas(runState, new BN$2(fees.copyGas.v).imul(length.divCeil(new BN$2(32))));

    stateManager.getContractCode(address, function (err, code) {
      if (err) return cb(err);
      memStore(runState, memOffset, code, codeOffset, length, false);
      cb(null);
    });
  },
  RETURNDATASIZE: function RETURNDATASIZE(runState) {
    return new BN$2(runState.lastReturned.length);
  },
  RETURNDATACOPY: function RETURNDATACOPY(memOffset, returnDataOffset, length, runState) {
    if (returnDataOffset.add(length).gtn(runState.lastReturned.length)) {
      trap(ERROR.OUT_OF_GAS);
    }

    memStore(runState, memOffset, utils.toBuffer(runState.lastReturned), returnDataOffset, length, false);
    // sub the COPY fee
    subGas(runState, new BN$2(fees.copyGas.v).mul(length.divCeil(new BN$2(32))));
  },
  GASPRICE: function GASPRICE(runState) {
    return new BN$2(runState.gasPrice);
  },
  // '0x40' range - block operations
  BLOCKHASH: function BLOCKHASH(number, runState, cb) {
    var stateManager = runState.stateManager;
    var diff = new BN$2(runState.block.header.number).sub(number);

    // block lookups must be within the past 256 blocks
    if (diff.gtn(256) || diff.lten(0)) {
      cb(null, new BN$2(0));
      return;
    }

    stateManager.getBlockHash(number.toArrayLike(safeBuffer.Buffer, 'be', 32), function (err, blockHash) {
      if (err) return cb(err);
      cb(null, new BN$2(blockHash));
    });
  },
  COINBASE: function COINBASE(runState) {
    return new BN$2(runState.block.header.coinbase);
  },
  TIMESTAMP: function TIMESTAMP(runState) {
    return new BN$2(runState.block.header.timestamp);
  },
  NUMBER: function NUMBER(runState) {
    return new BN$2(runState.block.header.number);
  },
  DIFFICULTY: function DIFFICULTY(runState) {
    return new BN$2(runState.block.header.difficulty);
  },
  GASLIMIT: function GASLIMIT(runState) {
    return new BN$2(runState.block.header.gasLimit);
  },
  // 0x50 range - 'storage' and execution
  POP: function POP() {},
  MLOAD: function MLOAD(pos, runState) {
    return new BN$2(memLoad(runState, pos, new BN$2(32)));
  },
  MSTORE: function MSTORE(offset, word, runState) {
    word = word.toArrayLike(safeBuffer.Buffer, 'be', 32);
    memStore(runState, offset, word, new BN$2(0), new BN$2(32));
  },
  MSTORE8: function MSTORE8(offset, byte, runState) {
    // NOTE: we're using a 'trick' here to get the least significant byte
    byte = safeBuffer.Buffer.from([byte.andln(0xff)]);
    memStore(runState, offset, byte, new BN$2(0), new BN$2(1));
  },
  SLOAD: function SLOAD(key, runState, cb) {
    var stateManager = runState.stateManager;
    key = key.toArrayLike(safeBuffer.Buffer, 'be', 32);

    stateManager.getContractStorage(runState.address, key, function (err, value) {
      if (err) return cb(err);
      value = value.length ? new BN$2(value) : new BN$2(0);
      cb(null, value);
    });
  },
  SSTORE: function SSTORE(key, val, runState, cb) {
    if (runState.static) {
      trap(ERROR.STATIC_STATE_CHANGE);
    }
    var stateManager = runState.stateManager;
    var address = runState.address;
    key = key.toArrayLike(safeBuffer.Buffer, 'be', 32);
    // NOTE: this should be the shortest representation
    var value;
    if (val.isZero()) {
      value = safeBuffer.Buffer.from([]);
    } else {
      value = val.toArrayLike(safeBuffer.Buffer, 'be');
    }

    stateManager.getContractStorage(runState.address, key, function (err, found) {
      if (err) return cb(err);
      try {
        if (value.length === 0 && !found.length) {
          subGas(runState, new BN$2(fees.sstoreResetGas.v));
        } else if (value.length === 0 && found.length) {
          subGas(runState, new BN$2(fees.sstoreResetGas.v));
          runState.gasRefund.iaddn(fees.sstoreRefundGas.v);
        } else if (value.length !== 0 && !found.length) {
          subGas(runState, new BN$2(fees.sstoreSetGas.v));
        } else if (value.length !== 0 && found.length) {
          subGas(runState, new BN$2(fees.sstoreResetGas.v));
        }
      } catch (e) {
        cb(e.error);
        return;
      }

      stateManager.putContractStorage(address, key, value, function (err) {
        if (err) return cb(err);
        runState.contract = stateManager.cache.get(address);
        cb(null);
      });
    });
  },
  JUMP: function JUMP(dest, runState) {
    if (dest.gtn(runState.code.length)) {
      trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState));
    }

    dest = dest.toNumber();

    if (!jumpIsValid(runState, dest)) {
      trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState));
    }

    runState.programCounter = dest;
  },
  JUMPI: function JUMPI(dest, cond, runState) {
    if (!cond.isZero()) {
      if (dest.gtn(runState.code.length)) {
        trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState));
      }

      dest = dest.toNumber();

      if (!jumpIsValid(runState, dest)) {
        trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState));
      }

      runState.programCounter = dest;
    }
  },
  PC: function PC(runState) {
    return new BN$2(runState.programCounter - 1);
  },
  MSIZE: function MSIZE(runState) {
    return runState.memoryWordCount.muln(32);
  },
  GAS: function GAS(runState) {
    return new BN$2(runState.gasLeft);
  },
  JUMPDEST: function JUMPDEST(runState) {},
  PUSH: function PUSH(runState) {
    var numToPush = runState.opCode - 0x5f;
    var loaded = new BN$2(runState.code.slice(runState.programCounter, runState.programCounter + numToPush).toString('hex'), 16);
    runState.programCounter += numToPush;
    return loaded;
  },
  DUP: function DUP(runState) {
    // NOTE: this function manipulates the stack directly!

    var stackPos = runState.opCode - 0x7f;
    if (stackPos > runState.stack.length) {
      trap(ERROR.STACK_UNDERFLOW);
    }
    // create a new copy
    return new BN$2(runState.stack[runState.stack.length - stackPos]);
  },
  SWAP: function SWAP(runState) {
    // NOTE: this function manipulates the stack directly!

    var stackPos = runState.opCode - 0x8f;

    // check the stack to make sure we have enough items on teh stack
    var swapIndex = runState.stack.length - stackPos - 1;
    if (swapIndex < 0) {
      trap(ERROR.STACK_UNDERFLOW);
    }

    // preform the swap
    var topIndex = runState.stack.length - 1;
    var tmp = runState.stack[topIndex];
    runState.stack[topIndex] = runState.stack[swapIndex];
    runState.stack[swapIndex] = tmp;
  },
  LOG: function LOG(memOffset, memLength) {
    var args = Array.prototype.slice.call(arguments, 0);
    var runState = args.pop();
    if (runState.static) {
      trap(ERROR.STATIC_STATE_CHANGE);
    }

    var topics = args.slice(2);
    topics = topics.map(function (a) {
      return a.toArrayLike(safeBuffer.Buffer, 'be', 32);
    });

    var numOfTopics = runState.opCode - 0xa0;
    var mem = memLoad(runState, memOffset, memLength);
    subGas(runState, new BN$2(fees.logTopicGas.v).imuln(numOfTopics).iadd(memLength.muln(fees.logDataGas.v)));

    // add address
    var log = [runState.address];
    log.push(topics);

    // add data
    log.push(mem);
    runState.logs.push(log);
  },

  // '0xf0' range - closures
  CREATE: function CREATE(value, offset, length, runState, done) {
    if (runState.static) {
      trap(ERROR.STATIC_STATE_CHANGE);
    }

    var data = memLoad(runState, offset, length);

    // set up config
    var options = {
      value: value,
      data: data
    };

    var localOpts = {
      inOffset: offset,
      inLength: length,
      outOffset: new BN$2(0),
      outLength: new BN$2(0)
    };

    checkCallMemCost(runState, options, localOpts);
    checkOutOfGas(runState, options);
    makeCall(runState, options, localOpts, done);
  },
  CALL: function CALL(gasLimit, toAddress, value, inOffset, inLength, outOffset, outLength, runState, done) {
    var stateManager = runState.stateManager;
    toAddress = addressToBuffer(toAddress);

    if (runState.static && !value.isZero()) {
      trap(ERROR.STATIC_STATE_CHANGE);
    }

    var data = memLoad(runState, inOffset, inLength);

    var options = {
      gasLimit: gasLimit,
      value: value,
      to: toAddress,
      data: data,
      static: runState.static
    };

    var localOpts = {
      inOffset: inOffset,
      inLength: inLength,
      outOffset: outOffset,
      outLength: outLength
    };

    if (!value.isZero()) {
      subGas(runState, new BN$2(fees.callValueTransferGas.v));
    }

    stateManager.exists(toAddress, function (err, exists) {
      if (err) {
        done(err);
        return;
      }

      stateManager.accountIsEmpty(toAddress, function (err, empty) {
        if (err) {
          done(err);
          return;
        }

        if (!exists || empty) {
          if (!value.isZero()) {
            try {
              subGas(runState, new BN$2(fees.callNewAccountGas.v));
            } catch (e) {
              done(e.error);
              return;
            }
          }
        }

        try {
          checkCallMemCost(runState, options, localOpts);
          checkOutOfGas(runState, options);
        } catch (e) {
          done(e.error);
          return;
        }

        if (!value.isZero()) {
          runState.gasLeft.iaddn(fees.callStipend.v);
          options.gasLimit.iaddn(fees.callStipend.v);
        }

        makeCall(runState, options, localOpts, done);
      });
    });
  },
  CALLCODE: function CALLCODE(gas, toAddress, value, inOffset, inLength, outOffset, outLength, runState, done) {
    var stateManager = runState.stateManager;
    toAddress = addressToBuffer(toAddress);

    var data = memLoad(runState, inOffset, inLength);

    var options = {
      gasLimit: gas,
      value: value,
      data: data,
      to: runState.address,
      static: runState.static
    };

    var localOpts = {
      inOffset: inOffset,
      inLength: inLength,
      outOffset: outOffset,
      outLength: outLength
    };

    if (!value.isZero()) {
      subGas(runState, new BN$2(fees.callValueTransferGas.v));
    }

    checkCallMemCost(runState, options, localOpts);
    checkOutOfGas(runState, options);

    if (!value.isZero()) {
      runState.gasLeft.iaddn(fees.callStipend.v);
      options.gasLimit.iaddn(fees.callStipend.v);
    }

    // load the code
    stateManager.getAccount(toAddress, function (err, account) {
      if (err) return done(err);
      if (runState._precompiled[toAddress.toString('hex')]) {
        options.compiled = true;
        options.code = runState._precompiled[toAddress.toString('hex')];
        makeCall(runState, options, localOpts, done);
      } else {
        stateManager.getContractCode(toAddress, function (err, code, compiled) {
          if (err) return done(err);
          options.compiled = compiled || false;
          options.code = code;
          makeCall(runState, options, localOpts, done);
        });
      }
    });
  },
  DELEGATECALL: function DELEGATECALL(gas, toAddress, inOffset, inLength, outOffset, outLength, runState, done) {
    var stateManager = runState.stateManager;
    var value = runState.callValue;
    toAddress = addressToBuffer(toAddress);

    var data = memLoad(runState, inOffset, inLength);

    var options = {
      gasLimit: gas,
      value: value,
      data: data,
      to: runState.address,
      caller: runState.caller,
      delegatecall: true,
      static: runState.static
    };

    var localOpts = {
      inOffset: inOffset,
      inLength: inLength,
      outOffset: outOffset,
      outLength: outLength
    };

    checkCallMemCost(runState, options, localOpts);
    checkOutOfGas(runState, options);

    // load the code
    stateManager.getAccount(toAddress, function (err, account) {
      if (err) return done(err);
      if (runState._precompiled[toAddress.toString('hex')]) {
        options.compiled = true;
        options.code = runState._precompiled[toAddress.toString('hex')];
        makeCall(runState, options, localOpts, done);
      } else {
        stateManager.getContractCode(toAddress, function (err, code, compiled) {
          if (err) return done(err);
          options.compiled = compiled || false;
          options.code = code;
          makeCall(runState, options, localOpts, done);
        });
      }
    });
  },
  STATICCALL: function STATICCALL(gasLimit, toAddress, inOffset, inLength, outOffset, outLength, runState, done) {
    var stateManager = runState.stateManager;
    var value = new BN$2(0);
    toAddress = addressToBuffer(toAddress);

    var data = memLoad(runState, inOffset, inLength);

    var options = {
      gasLimit: gasLimit,
      value: value,
      to: toAddress,
      data: data,
      static: true
    };

    var localOpts = {
      inOffset: inOffset,
      inLength: inLength,
      outOffset: outOffset,
      outLength: outLength
    };

    stateManager.exists(toAddress, function (err, exists) {
      if (err) {
        done(err);
        return;
      }

      stateManager.accountIsEmpty(toAddress, function (err, empty) {
        if (err) {
          done(err);
          return;
        }

        try {
          checkCallMemCost(runState, options, localOpts);
          checkOutOfGas(runState, options);
        } catch (e) {
          done(e.error);
          return;
        }

        makeCall(runState, options, localOpts, done);
      });
    });
  },
  RETURN: function RETURN(offset, length, runState) {
    runState.returnValue = memLoad(runState, offset, length);
  },
  REVERT: function REVERT(offset, length, runState) {
    runState.stopped = true;
    runState.returnValue = memLoad(runState, offset, length);
    trap(ERROR.REVERT);
  },
  // '0x70', range - other
  SELFDESTRUCT: function SELFDESTRUCT(selfdestructToAddress, runState, cb) {
    if (runState.static) {
      trap(ERROR.STATIC_STATE_CHANGE);
    }
    var stateManager = runState.stateManager;
    var contract = runState.contract;
    var contractAddress = runState.address;
    selfdestructToAddress = addressToBuffer(selfdestructToAddress);

    stateManager.getAccount(selfdestructToAddress, function (err, toAccount) {
      // update balances
      if (err) {
        cb(err);
        return;
      }

      stateManager.accountIsEmpty(selfdestructToAddress, function (error, empty) {
        if (error) {
          cb(error);
          return;
        }

        if (new BN$2(contract.balance).gtn(0)) {
          if (!toAccount.exists || empty) {
            try {
              subGas(runState, new BN$2(fees.callNewAccountGas.v));
            } catch (e) {
              cb(e.error);
              return;
            }
          }
        }

        // only add to refund if this is the first selfdestruct for the address
        if (!runState.selfdestruct[contractAddress.toString('hex')]) {
          runState.gasRefund = runState.gasRefund.addn(fees.suicideRefundGas.v);
        }
        runState.selfdestruct[contractAddress.toString('hex')] = selfdestructToAddress;
        runState.stopped = true;

        var newBalance = new BN$2(contract.balance).add(new BN$2(toAccount.balance));
        async.series([stateManager.putAccountBalance.bind(stateManager, selfdestructToAddress, newBalance), stateManager.putAccountBalance.bind(stateManager, contractAddress, new BN$2(0))], function (err) {
          // The reason for this is to avoid sending an array of results
          cb(err);
        });
      });
    });
  }
};

function describeLocation(runState) {
  var hash = utils.sha3(runState.code).toString('hex');
  var address = runState.address.toString('hex');
  var pc = runState.programCounter - 1;
  return hash + '/' + address + ':' + pc;
}

function subGas(runState, amount) {
  runState.gasLeft.isub(amount);
  if (runState.gasLeft.ltn(0)) {
    runState.gasLeft = new BN$2(0);
    trap(ERROR.OUT_OF_GAS);
  }
}

function trap(err) {
  throw new VmError(err);
}

/**
 * Subtracts the amount needed for memory usage from `runState.gasLeft`
 * @method subMemUsage
 * @param {BN} offset
 * @param {BN} length
 * @return {String}
 */
function subMemUsage(runState, offset, length) {
  // YP (225): access with zero length will not extend the memory
  if (length.isZero()) return;

  var newMemoryWordCount = offset.add(length).divCeil(new BN$2(32));
  if (newMemoryWordCount.lte(runState.memoryWordCount)) return;

  var words = newMemoryWordCount;
  var fee = new BN$2(fees.memoryGas.v);
  var quadCoeff = new BN$2(fees.quadCoeffDiv.v);
  // words * 3 + words ^2 / 512
  var cost = words.mul(fee).add(words.mul(words).div(quadCoeff));

  if (cost.gt(runState.highestMemCost)) {
    subGas(runState, cost.sub(runState.highestMemCost));
    runState.highestMemCost = cost;
  }

  runState.memoryWordCount = newMemoryWordCount;
}

/**
 * Loads bytes from memory and returns them as a buffer. If an error occurs
 * a string is instead returned. The function also subtracts the amount of
 * gas need for memory expansion.
 * @method memLoad
 * @param {BN} offset where to start reading from
 * @param {BN} length how far to read
 * @return {Buffer|String}
 */
function memLoad(runState, offset, length) {
  // check to see if we have enougth gas for the mem read
  subMemUsage(runState, offset, length);

  // shortcut
  if (length.isZero()) {
    return safeBuffer.Buffer.alloc(0);
  }

  // NOTE: in theory this could overflow, but unlikely due to OOG above
  offset = offset.toNumber();
  length = length.toNumber();

  var loaded = runState.memory.slice(offset, offset + length);
  // fill the remaining lenth with zeros
  for (var i = loaded.length; i < length; i++) {
    loaded[i] = 0;
  }
  return safeBuffer.Buffer.from(loaded);
}

/**
 * Stores bytes to memory. If an error occurs a string is instead returned.
 * The function also subtracts the amount of gas need for memory expansion.
 * @method memStore
 * @param {BN} offset where to start reading from
 * @param {Buffer} val
 * @param {BN} valOffset
 * @param {BN} length how far to read
 * @param {Boolean} skipSubMem
 * @return {Buffer|String}
 */
function memStore(runState, offset, val, valOffset, length, skipSubMem) {
  if (skipSubMem !== false) {
    subMemUsage(runState, offset, length);
  }

  // shortcut
  if (length.isZero()) {
    return;
  }

  // NOTE: in theory this could overflow, but unlikely due to OOG above
  offset = offset.toNumber();
  length = length.toNumber();

  var safeLen = 0;
  if (valOffset.addn(length).gtn(val.length)) {
    if (valOffset.gten(val.length)) {
      safeLen = 0;
    } else {
      valOffset = valOffset.toNumber();
      safeLen = val.length - valOffset;
    }
  } else {
    valOffset = valOffset.toNumber();
    safeLen = val.length;
  }

  var i = 0;
  if (safeLen > 0) {
    safeLen = safeLen > length ? length : safeLen;
    for (; i < safeLen; i++) {
      runState.memory[offset + i] = val[valOffset + i];
    }
  }

  /*
    pad the remaining length with zeros IF AND ONLY IF a value was stored
    (even if value offset > value length, strange spec...)
  */
  if (val.length > 0 && i < length) {
    for (; i < length; i++) {
      runState.memory[offset + i] = 0;
    }
  }
}

// checks if a jump is valid given a destination
function jumpIsValid(runState, dest) {
  return runState.validJumps.indexOf(dest) !== -1;
}

// checks to see if we have enough gas left for the memory reads and writes
// required by the CALLs
function checkCallMemCost(runState, callOptions, localOpts) {
  // calculates the gas need for saving the output in memory
  subMemUsage(runState, localOpts.outOffset, localOpts.outLength);

  if (!callOptions.gasLimit) {
    callOptions.gasLimit = new BN$2(runState.gasLeft);
  }
}

function checkOutOfGas(runState, callOptions) {
  var gasAllowed = runState.gasLeft.sub(runState.gasLeft.divn(64));
  if (callOptions.gasLimit.gt(gasAllowed)) {
    callOptions.gasLimit = gasAllowed;
  }
}

// sets up and calls runCall
function makeCall(runState, callOptions, localOpts, cb) {
  callOptions.caller = callOptions.caller || runState.address;
  callOptions.origin = runState.origin;
  callOptions.gasPrice = runState.gasPrice;
  callOptions.block = runState.block;
  callOptions.populateCache = false;
  callOptions.static = callOptions.static || false;
  callOptions.selfdestruct = runState.selfdestruct;

  // increment the runState.depth
  callOptions.depth = runState.depth + 1;

  // empty the return data buffer
  runState.lastReturned = safeBuffer.Buffer.alloc(0);

  // check if account has enough ether
  // Note: in the case of delegatecall, the value is persisted and doesn't need to be deducted again
  if (runState.depth >= fees.stackLimit.v || callOptions.delegatecall !== true && new BN$2(runState.contract.balance).lt(callOptions.value)) {
    cb(null, new BN$2(0));
  } else {
    // if creating a new contract then increament the nonce
    if (!callOptions.to) {
      runState.contract.nonce = new BN$2(runState.contract.nonce).addn(1);
    }

    runState.stateManager.cache.put(runState.address, runState.contract);
    runState._vm.runCall(callOptions, parseCallResults);
  }

  function parseCallResults(err, results) {
    if (err) return cb(err);

    // concat the runState.logs
    if (results.vm.logs) {
      runState.logs = runState.logs.concat(results.vm.logs);
    }

    // add gasRefund
    if (results.vm.gasRefund) {
      runState.gasRefund = runState.gasRefund.add(results.vm.gasRefund);
    }

    // this should always be safe
    runState.gasLeft.isub(results.gasUsed);

    // save results to memory
    if (results.vm.return && (!results.vm.exceptionError || results.vm.exceptionError.error === ERROR.REVERT)) {
      memStore(runState, localOpts.outOffset, results.vm.return, new BN$2(0), localOpts.outLength, false);

      if (results.vm.exceptionError && results.vm.exceptionError.error === ERROR.REVERT && runState.opName === 'CREATE') {
        runState.lastReturned = results.vm.return;
      }

      switch (runState.opName) {
        case 'CALL':
        case 'CALLCODE':
        case 'DELEGATECALL':
        case 'STATICCALL':
          runState.lastReturned = results.vm.return;
          break;
      }
    }

    if (!results.vm.exceptionError) {
      // update stateRoot on current contract
      runState.stateManager.getAccount(runState.address, function (err, account) {
        if (err) return cb(err);

        runState.contract = account;
        // push the created address to the stack
        if (results.createdAddress) {
          cb(null, new BN$2(results.createdAddress));
        } else {
          cb(null, new BN$2(results.vm.exception));
        }
      });
    } else {
      // creation failed so don't increament the nonce
      if (results.vm.createdAddress) {
        runState.contract.nonce = new BN$2(runState.contract.nonce).subn(1);
      }

      cb(null, new BN$2(results.vm.exception));
    }
  }
}

/*
MIT Licence
Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola
https://github.com/YuzuJS/setImmediate/blob/f1ccbfdf09cb93aadf77c4aa749ea554503b9234/LICENSE.txt
*/

var nextHandle = 1; // Spec says greater than zero
var tasksByHandle = {};
var currentlyRunningATask = false;
var doc = global.document;
var registerImmediate;

function setImmediate(callback) {
  // Callback can either be a function or a string
  if (typeof callback !== "function") {
    callback = new Function("" + callback);
  }
  // Copy function arguments
  var args = new Array(arguments.length - 1);
  for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i + 1];
  }
  // Store and register the task
  var task = { callback: callback, args: args };
  tasksByHandle[nextHandle] = task;
  registerImmediate(nextHandle);
  return nextHandle++;
}

function clearImmediate(handle) {
    delete tasksByHandle[handle];
}

function run(task) {
    var callback = task.callback;
    var args = task.args;
    switch (args.length) {
    case 0:
        callback();
        break;
    case 1:
        callback(args[0]);
        break;
    case 2:
        callback(args[0], args[1]);
        break;
    case 3:
        callback(args[0], args[1], args[2]);
        break;
    default:
        callback.apply(undefined, args);
        break;
    }
}

function runIfPresent(handle) {
    // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
    // So if we're currently running a task, we'll need to delay this invocation.
    if (currentlyRunningATask) {
        // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
        // "too much recursion" error.
        setTimeout(runIfPresent, 0, handle);
    } else {
        var task = tasksByHandle[handle];
        if (task) {
            currentlyRunningATask = true;
            try {
                run(task);
            } finally {
                clearImmediate(handle);
                currentlyRunningATask = false;
            }
        }
    }
}

function installNextTickImplementation() {
    registerImmediate = function(handle) {
        process.nextTick(function () { runIfPresent(handle); });
    };
}

function canUsePostMessage() {
    // The test against `importScripts` prevents this implementation from being installed inside a web worker,
    // where `global.postMessage` means something completely different and can't be used for this purpose.
    if (global.postMessage && !global.importScripts) {
        var postMessageIsAsynchronous = true;
        var oldOnMessage = global.onmessage;
        global.onmessage = function() {
            postMessageIsAsynchronous = false;
        };
        global.postMessage("", "*");
        global.onmessage = oldOnMessage;
        return postMessageIsAsynchronous;
    }
}

function installPostMessageImplementation() {
    // Installs an event handler on `global` for the `message` event: see
    // * https://developer.mozilla.org/en/DOM/window.postMessage
    // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

    var messagePrefix = "setImmediate$" + Math.random() + "$";
    var onGlobalMessage = function(event) {
        if (event.source === global &&
            typeof event.data === "string" &&
            event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
        }
    };

    if (global.addEventListener) {
        global.addEventListener("message", onGlobalMessage, false);
    } else {
        global.attachEvent("onmessage", onGlobalMessage);
    }

    registerImmediate = function(handle) {
        global.postMessage(messagePrefix + handle, "*");
    };
}

function installMessageChannelImplementation() {
    var channel = new MessageChannel();
    channel.port1.onmessage = function(event) {
        var handle = event.data;
        runIfPresent(handle);
    };

    registerImmediate = function(handle) {
        channel.port2.postMessage(handle);
    };
}

function installReadyStateChangeImplementation() {
    var html = doc.documentElement;
    registerImmediate = function(handle) {
        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var script = doc.createElement("script");
        script.onreadystatechange = function () {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
        };
        html.appendChild(script);
    };
}

function installSetTimeoutImplementation() {
    registerImmediate = function(handle) {
        setTimeout(runIfPresent, 0, handle);
    };
}

// If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

// Don't get fooled by e.g. browserify environments.
if ({}.toString.call(global.process) === "[object process]") {
    // For Node.js before 0.9
    installNextTickImplementation();

} else if (canUsePostMessage()) {
    // For non-IE10 modern browsers
    installPostMessageImplementation();

} else if (global.MessageChannel) {
    // For web workers, where supported
    installMessageChannelImplementation();

} else if (doc && "onreadystatechange" in doc.createElement("script")) {
    // For IE 6–8
    installReadyStateChangeImplementation();

} else {
    // For older browsers
    installSetTimeoutImplementation();
}

// License https://jryans.mit-license.org/

// DOM APIs, for completeness
var apply = Function.prototype.apply;






// Does not start the time, just sets up the members needed.

/*

This is the core of the Ethereum Virtual Machine (EVM or just VM).

NOTES:

stack items are lazly dupilicated.
So you must never directly change a buffer from the stack,
instead you should `copy` it first

not all stack items are 32 bytes, so if the operation realies on the stack
item length then you must use utils.pad(<item>, 32) first.
*/
var BN$3 = utils.BN;

/**
 * Runs EVM code
 * @param opts
 * @param opts.account {Account} the account that the exucuting code belongs to
 * @param opts.address {Buffer}  the address of the account that is exucuting this code
 * @param opts.block {Block} the block that the transaction is part of
 * @param opts.caller {Buffer} the address that ran this code
 * @param opts.code {Buffer} the code to be run
 * @param opts.data {Buffer}  the input data
 * @param opts.gasLimit {Buffer}
 * @param opts.origin {Buffer} the address where the call originated from
 * @param opts.value {Buffer} the amount the being transfered
 * @param cb {Function}
 */
function runCode (opts, cb) {
  var self = this;
  var stateManager = self.stateManager;

  var block = opts.block || new Block();

  // VM internal state
  var runState = {
    stateManager: stateManager,
    returnValue: false,
    stopped: false,
    vmError: false,
    programCounter: 0,
    opCode: undefined,
    opName: undefined,
    gasLeft: new BN$3(opts.gasLimit),
    gasLimit: new BN$3(opts.gasLimit),
    gasPrice: opts.gasPrice,
    memory: [],
    memoryWordCount: new BN$3(0),
    stack: [],
    lastReturned: [],
    logs: [],
    validJumps: [],
    gasRefund: new BN$3(0),
    highestMemCost: new BN$3(0),
    depth: opts.depth || 0,
    // opts.suicides is kept for backward compatiblity with pre-EIP6 syntax
    selfdestruct: opts.selfdestruct || opts.suicides || {},
    block: block,
    callValue: opts.value || new BN$3(0),
    address: opts.address || utils.zeros(32),
    caller: opts.caller || utils.zeros(32),
    origin: opts.origin || opts.caller || utils.zeros(32),
    callData: opts.data || safeBuffer.Buffer.from([0]),
    code: opts.code,
    populateCache: opts.populateCache === undefined ? true : opts.populateCache,
    static: opts.static || false

    // temporary - to be factored out
  };runState._precompiled = self._precompiled;
  runState._vm = self;

  // prepare to run vm
  preprocessValidJumps(runState);
  // load contract then start vm run
  loadContract(runVm);

  // iterate through the given ops until something breaks or we hit STOP
  function runVm() {
    async.whilst(vmIsActive, iterateVm, parseVmResults);
  }

  // ensure contract is loaded; only used if runCode is called directly
  function loadContract(cb) {
    stateManager.getAccount(runState.address, function (err, account) {
      if (err) return cb(err);
      runState.contract = account;
      cb();
    });
  }

  function vmIsActive() {
    var notAtEnd = runState.programCounter < runState.code.length;

    return !runState.stopped && notAtEnd && !runState.vmError && !runState.returnValue;
  }

  function iterateVm(done) {
    var opCode = runState.code[runState.programCounter];
    var opInfo = lookupOpInfo(opCode);
    var opName = opInfo.name;
    var opFn = opFns[opName];

    runState.opName = opName;
    runState.opCode = opCode;

    // check for invalid opcode
    if (opName === 'INVALID') {
      return done(new VmError(ERROR.INVALID_OPCODE));
    }

    // check for stack underflows
    if (runState.stack.length < opInfo.in) {
      return done(new VmError(ERROR.STACK_UNDERFLOW));
    }

    if (runState.stack.length - opInfo.in + opInfo.out > 1024) {
      return done(new VmError(ERROR.STACK_OVERFLOW));
    }

    async.series([runStepHook, runOp], function (err) {
      setImmediate(done.bind(null, err));
    });

    function runStepHook(cb) {
      var eventObj = {
        pc: runState.programCounter,
        gasLeft: runState.gasLeft,
        opcode: lookupOpInfo(opCode, true),
        stack: runState.stack,
        depth: runState.depth,
        address: runState.address,
        account: runState.contract,
        cache: runState.stateManager.cache,
        memory: runState.memory
      };
      self.emit('step', eventObj, cb);
    }

    function runOp(cb) {
      // calculate gas
      var fee = new BN$3(opInfo.fee);
      // TODO: move to a shared funtion; subGas in opFuns
      runState.gasLeft = runState.gasLeft.sub(fee);
      if (runState.gasLeft.ltn(0)) {
        runState.gasLeft = new BN$3(0);
        cb(new VmError(ERROR.OUT_OF_GAS));
        return;
      }

      // advance program counter
      runState.programCounter++;
      var argsNum = opInfo.in;
      var retNum = opInfo.out;
      // pop the stack
      var args = argsNum ? runState.stack.splice(-argsNum) : [];

      args.reverse();
      args.push(runState);
      // create a callback for async opFunc
      if (opInfo.async) {
        args.push(function (err, result) {
          if (err) return cb(err);

          // save result to the stack
          if (result !== undefined) {
            if (retNum !== 1) {
              // opcode post-stack mismatch
              return cb(new VmError(ERROR.INTERNAL_ERROR));
            }

            runState.stack.push(result);
          } else {
            if (retNum !== 0) {
              // opcode post-stack mismatch
              return cb(new VmError(ERROR.INTERNAL_ERROR));
            }
          }

          cb();
        });
      }

      try {
        // run the opcode
        var result = opFn.apply(null, args);
      } catch (e) {
        cb(e);
        return;
      }

      // save result to the stack
      if (result !== undefined) {
        if (retNum !== 1) {
          // opcode post-stack mismatch
          return cb(VmError(ERROR.INTERNAL_ERROR));
        }

        runState.stack.push(result);
      } else {
        if (!opInfo.async && retNum !== 0) {
          // opcode post-stack mismatch
          return cb(VmError(ERROR.INTERNAL_ERROR));
        }
      }

      // call the callback if opFn was sync
      if (!opInfo.async) {
        cb();
      }
    }
  }

  function parseVmResults(err) {
    // remove any logs on error
    if (err) {
      runState.logs = [];
      stateManager.revertContracts();
      runState.vmError = true;
    }

    var results = {
      runState: runState,
      selfdestruct: runState.selfdestruct,
      gasRefund: runState.gasRefund,
      exception: err ? 0 : 1,
      exceptionError: err,
      logs: runState.logs,
      gas: runState.gasLeft,
      'return': runState.returnValue ? runState.returnValue : safeBuffer.Buffer.alloc(0)
    };

    if (results.exceptionError) {
      delete results.gasRefund;
      delete results.selfdestruct;
      self.stateManager.touched = [];
    }

    if (err && err.error !== ERROR.REVERT) {
      results.gasUsed = runState.gasLimit;
    } else {
      results.gasUsed = runState.gasLimit.sub(runState.gasLeft);
    }

    if (runState.populateCache) {
      self.stateManager.cache.flush(function () {
        self.stateManager.cache.clear();
        cb(err, results);
      });
    } else {
      cb(err, results);
    }
  }
}

// find all the valid jumps and puts them in the `validJumps` array
function preprocessValidJumps(runState) {
  for (var i = 0; i < runState.code.length; i++) {
    var curOpCode = lookupOpInfo(runState.code[i]).name;

    // no destinations into the middle of PUSH
    if (curOpCode === 'PUSH') {
      i += runState.code[i] - 0x5f;
    }

    if (curOpCode === 'JUMPDEST') {
      runState.validJumps.push(i);
    }
  }
}

function runJIT (opts, cb) {
  // for precompiled
  var results;
  if (typeof opts.code === 'function') {
    results = opts.code(opts);
    results.account = opts.account;
    if (results.exception === undefined) {
      results.exception = 1;
    }
    cb(results.exceptionError, results);
  } else {
    var f = new Function('require', 'opts', opts.code.toString()); // eslint-disable-line
    results = f(require, opts);
    results.account = opts.account;
    cb(results.exceptionError, results);
  }
}

var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup[tmp >> 10];
    output += lookup[(tmp >> 4) & 0x3F];
    output += lookup[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

var isArray$1 = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */


var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer$2.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : true;

function kMaxLength () {
  return Buffer$2.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer$2.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer$2(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer$2 (arg, encodingOrOffset, length) {
  if (!Buffer$2.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$2)) {
    return new Buffer$2(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer$2.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer$2._augment = function (arr) {
  arr.__proto__ = Buffer$2.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer$2.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer$2.TYPED_ARRAY_SUPPORT) {
  Buffer$2.prototype.__proto__ = Uint8Array.prototype;
  Buffer$2.__proto__ = Uint8Array;
  
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer$2.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer$2.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer$2.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer$2.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer$2.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer$2.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray$1(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}


Buffer$2.isBuffer = isBuffer$1;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer$2.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer$2.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer$2.concat = function concat (list, length) {
  if (!isArray$1(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer$2.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer$2.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer$2.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer$2.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer$2.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer$2.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer$2.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer$2.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer$2.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer$2.compare(this, b) === 0
};

Buffer$2.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer$2.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer$2.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer$2.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read$$1 (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read$$1(arr, i + j) !== read$$1(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer$2.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer$2.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer$2.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer$2.prototype.write = function write$$1 (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer$2.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer$2.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer$2.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer$2(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer$2.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer$2.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer$2.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer$2.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer$2.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer$2.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer$2.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer$2.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$2.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$2.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer$2.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$2.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$2.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer$2.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer$2.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer$2.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer$2.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer$2.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer$2.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$2.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$2.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer$2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer$2.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$2.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer$2.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$2.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer$2.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$2.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$2.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer$2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer$2.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$2.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer$2.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$2.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer$2.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer$2.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer$2.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer$2.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer$2.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer$2.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer$2.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer$2.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer$2.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer$2(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer$1(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
var hasOwn = Object.prototype.hasOwnProperty;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};
// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
var pSlice = Array.prototype.slice;
var _functionsHaveNames;
function functionsHaveNames() {
  if (typeof _functionsHaveNames !== 'undefined') {
    return _functionsHaveNames;
  }
  return _functionsHaveNames = (function () {
    return function foo() {}.name === 'foo';
  }());
}
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer$1(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

function assert(value, message) {
  if (!value) fail(value, true, message, '==', ok);
}
// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!isFunction(func)) {
    return;
  }
  if (functionsHaveNames()) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = AssertionError;
function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
}

// assert.AssertionError instanceof Error
inherits$1(AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect$1(something) {
  if (functionsHaveNames() || !isFunction(something)) {
    return inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect$1(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect$1(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', ok);
}
assert.ok = ok;
// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);
assert.equal = equal;
function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', equal);
}

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);
assert.notEqual = notEqual;
function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', notEqual);
  }
}

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);
assert.deepEqual = deepEqual;
function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', deepEqual);
  }
}
assert.deepStrictEqual = deepStrictEqual;
function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
  }
}

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer$1(actual) && isBuffer$1(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (isDate(actual) && isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (isRegExp(actual) && isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer$1(actual) !== isBuffer$1(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (isPrimitive(a) || isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);
assert.notDeepEqual = notDeepEqual;
function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
  }
}

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);
assert.strictEqual = strictEqual;
function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', strictEqual);
  }
}

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
assert.notStrictEqual = notStrictEqual;
function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', notStrictEqual);
  }
}

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);
assert.throws = throws;
function throws(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
}

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = doesNotThrow;
function doesNotThrow(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
}

assert.ifError = ifError;
function ifError(err) {
  if (err) throw err;
}

var byteSize = 256;

/**
 * Represents a Bloom
 * @constructor
 * @param {Buffer} bitvector
 */
var Bloom = function Bloom(bitvector) {
  if (!bitvector) {
    this.bitvector = utils.zeros(byteSize);
  } else {
    assert(bitvector.length === byteSize, 'bitvectors must be 2048 bits long');
    this.bitvector = bitvector;
  }
};

/**
 * adds an element to a bit vector of a 64 byte bloom filter
 * @method add
 * @param {Buffer} element
 */
Bloom.prototype.add = function (e) {
  e = utils.sha3(e);
  var mask = 2047; // binary 11111111111

  for (var i = 0; i < 3; i++) {
    var first2bytes = e.readUInt16BE(i * 2);
    var loc = mask & first2bytes;
    var byteLoc = loc >> 3;
    var bitLoc = 1 << loc % 8;
    this.bitvector[byteSize - byteLoc - 1] |= bitLoc;
  }
};

/**
 * checks if an element is in the blooom
 * @method check
 * @param {Buffer} element
 */
Bloom.prototype.check = function (e) {
  e = utils.sha3(e);
  var mask = 511; // binary 111111111
  var match = true;

  for (var i = 0; i < 3 && match; i++) {
    var first2bytes = e.readUInt16BE(i * 2);
    var loc = mask & first2bytes;
    var byteLoc = loc >> 3;
    var bitLoc = 1 << loc % 8;
    match = this.bitvector[byteSize - byteLoc - 1] & bitLoc;
  }

  return Boolean(match);
};

/**
 * checks if multple topics are in a bloom
 * @method check
 * @param {Buffer} element
 */
Bloom.prototype.multiCheck = function (topics) {
  var self = this;
  return topics.every(function (t) {
    if (!safeBuffer.Buffer.isBuffer(t)) {
      t = safeBuffer.Buffer.from(t, 'hex');
    }
    return self.check(t);
  });
};

/**
 * bitwise or blooms together
 * @method or
 * @param {Bloom} bloom
 */
Bloom.prototype.or = function (bloom) {
  if (bloom) {
    for (var i = 0; i <= byteSize; i++) {
      this.bitvector[i] = this.bitvector[i] | bloom.bitvector[i];
    }
  }
};

var rlp$1 = utils.rlp;
var BN$4 = utils.BN;

var minerReward = new BN$4(fees.minerReward.v);

/**
 * process the transaction in a block and pays the miners
 * @param opts
 * @param opts.block {Block} the block we are processing
 * @param opts.generate {Boolean} [gen=false] whether to generate the stateRoot
 * @param cb {Function} the callback which is given an error string
 */
function runBlock (opts, cb) {
  var self = this;

  // parse options
  var block = opts.block;
  var generateStateRoot = !!opts.generate;
  var validateStateRoot = !generateStateRoot;
  var bloom = new Bloom();
  var receiptTrie = new Trie$1();
  // the total amount of gas used processing this block
  var gasUsed = new BN$4(0);
  // miner account
  var minerAccount;
  var receipts = [];
  var txResults = [];
  var result;

  if (opts.root) {
    self.stateManager.trie.root = opts.root;
  }

  this.trie.checkpoint();

  // run everything
  async.series([beforeBlock, populateCache, processTransactions], parseBlockResults);

  function beforeBlock(cb) {
    self.emit('beforeBlock', opts.block, cb);
  }

  function afterBlock(cb) {
    self.emit('afterBlock', result, cb);
  }

  // populates the cache with accounts that we know we will need
  function populateCache(cb) {
    var accounts = new Set();
    accounts.add(block.header.coinbase.toString('hex'));
    block.transactions.forEach(function (tx) {
      accounts.add(tx.getSenderAddress().toString('hex'));
      accounts.add(tx.to.toString('hex'));
    });

    block.uncleHeaders.forEach(function (uh) {
      accounts.add(uh.coinbase.toString('hex'));
    });

    self.populateCache(accounts, cb);
  }

  /**
   * Processes all of the transaction in the block
   * @method processTransaction
   * @param {Function} cb the callback is given error if there are any
   */
  function processTransactions(cb) {
    var validReceiptCount = 0;

    async.eachSeries(block.transactions, processTx, cb);

    function processTx(tx, cb) {
      var gasLimitIsHigherThanBlock = new BN$4(block.header.gasLimit).lt(new BN$4(tx.gasLimit).add(gasUsed));
      if (gasLimitIsHigherThanBlock) {
        cb(new Error('tx has a higher gas limit than the block'));
        return;
      }

      // run the tx through the VM
      self.runTx({
        tx: tx,
        block: block,
        populateCache: false
      }, parseTxResult);

      function parseTxResult(err, result) {
        txResults.push(result);
        // var receiptResult = new BN(1)

        // abort if error
        if (err) {
          receipts.push(null);
          cb(err);
          return;
        }

        gasUsed = gasUsed.add(result.gasUsed);
        // combine blooms via bitwise OR
        bloom.or(result.bloom);

        if (generateStateRoot) {
          block.header.bloom = bloom.bitvector;
        }

        var txLogs = result.vm.logs || [];

        var rawTxReceipt = [result.vm.exception ? 1 : 0, // result.vm.exception is 0 when an exception occurs, and 1 when it doesn't.  TODO make this the opposite
        gasUsed.toArrayLike(safeBuffer.Buffer), result.bloom.bitvector, txLogs];
        var txReceipt = {
          status: rawTxReceipt[0],
          gasUsed: rawTxReceipt[1],
          bitvector: rawTxReceipt[2],
          logs: rawTxReceipt[3]
        };

        receipts.push(txReceipt);
        receiptTrie.put(rlp$1.encode(validReceiptCount), rlp$1.encode(rawTxReceipt));
        validReceiptCount++;
        cb();
      }
    }
  }

  // handle results or error from block run
  function parseBlockResults(err) {
    if (err) {
      self.trie.revert();
      cb(err);
      return;
    }

    // credit all block rewards
    payOmmersAndMiner();

    // credit all block rewards
    if (generateStateRoot) {
      block.header.stateRoot = self.trie.root;
    }

    self.trie.commit(function (err) {
      self.stateManager.cache.flush(function () {
        if (validateStateRoot) {
          if (receiptTrie.root && receiptTrie.root.toString('hex') !== block.header.receiptTrie.toString('hex')) {
            err = new Error((err || '') + 'invalid receiptTrie ');
          }
          if (bloom.bitvector.toString('hex') !== block.header.bloom.toString('hex')) {
            err = new Error((err || '') + 'invalid bloom ');
          }
          if (utils.bufferToInt(block.header.gasUsed) !== Number(gasUsed)) {
            err = new Error((err || '') + 'invalid gasUsed ');
          }
          if (self.trie.root.toString('hex') !== block.header.stateRoot.toString('hex')) {
            err = new Error((err || '') + 'invalid block stateRoot ');
          }
        }

        self.stateManager.cache.clear();

        result = {
          receipts: receipts,
          results: txResults,
          error: err
        };

        afterBlock(cb.bind(this, err, result));
      });
    });
  }

  // credit all block rewards
  function payOmmersAndMiner() {
    var ommers = block.uncleHeaders;
    // pay each ommer
    ommers.forEach(rewardOmmer);

    // calculate nibling reward
    var niblingReward = minerReward.divn(32);
    var totalNiblingReward = niblingReward.muln(ommers.length);
    minerAccount = self.stateManager.cache.get(block.header.coinbase);
    // give miner the block reward
    minerAccount.balance = new BN$4(minerAccount.balance).add(minerReward).add(totalNiblingReward);
    self.stateManager.cache.put(block.header.coinbase, minerAccount);
  }

  // credit ommer
  function rewardOmmer(ommer) {
    // calculate reward
    var heightDiff = new BN$4(block.header.number).sub(new BN$4(ommer.number));
    var reward = new BN$4(8).sub(heightDiff).mul(minerReward.divn(8));

    if (reward.ltn(0)) {
      reward = new BN$4(0);
    }

    // credit miners account
    var ommerAccount = self.stateManager.cache.get(ommer.coinbase);
    ommerAccount.balance = reward.add(new BN$4(ommerAccount.balance));
    self.stateManager.cache.put(ommer.coinbase, ommerAccount);
  }
}

var BN$5 = utils.BN;

/**
 * Process a transaction. Run the vm. Transfers eth. Checks balances.
 * @method processTx
 * @param opts
 * @param opts.tx {Transaction} - a transaction
 * @param opts.skipNonce - skips the nonce check
 * @param opts.skipBalance - skips the balance check
 * @param opts.block {Block} needed to process the transaction, if no block is given a default one is created
 * @param cb {Function} - the callback
 */
function runTx (opts, cb) {
  var self = this;
  var block = opts.block;
  var tx = opts.tx;
  var gasLimit;
  var results;
  var basefee;

  // create a reasonable default if no block is given
  if (!block) {
    block = new Block();
  }

  if (new BN$5(block.header.gasLimit).lt(new BN$5(tx.gasLimit))) {
    cb(new Error('tx has a higher gas limit than the block'));
    return;
  }

  if (opts.populateCache === undefined) {
    opts.populateCache = true;
  }

  // run everything
  async.series([populateCache, runTxHook, runCall, saveTries, flushCache, runAfterTxHook], function (err) {
    cb(err, results);
  });

  // run the transaction hook
  function runTxHook(cb) {
    self.emit('beforeTx', tx, cb);
  }

  // run the transaction hook
  function runAfterTxHook(cb) {
    self.emit('afterTx', results, cb);
  }

  /**
   * populates the cache with the 'to' and 'from' of the tx
   */
  function populateCache(cb) {
    var accounts = new Set();
    accounts.add(tx.from.toString('hex'));
    accounts.add(block.header.coinbase.toString('hex'));

    if (tx.to.toString('hex') !== '') {
      accounts.add(tx.to.toString('hex'));
      self.stateManager.touched.push(tx.to);
    }

    if (opts.populateCache === false) {
      return cb();
    }

    self.stateManager.warmCache(accounts, cb);
  }

  // sets up the environment and runs a `call`
  function runCall(cb) {
    // check to the sender's account to make sure it has enough wei and the correct nonce
    var fromAccount = self.stateManager.cache.get(tx.from);
    var message;

    if (!opts.skipBalance && new BN$5(fromAccount.balance).lt(tx.getUpfrontCost())) {
      message = "sender doesn't have enough funds to send tx. The upfront cost is: " + tx.getUpfrontCost().toString() + ' and the sender\'s account only has: ' + new BN$5(fromAccount.balance).toString();
      cb(new Error(message));
      return;
    } else if (!opts.skipNonce && !new BN$5(fromAccount.nonce).eq(new BN$5(tx.nonce))) {
      message = "the tx doesn't have the correct nonce. account has nonce of: " + new BN$5(fromAccount.nonce).toString() + ' tx has nonce of: ' + new BN$5(tx.nonce).toString();
      cb(new Error(message));
      return;
    }

    // increment the nonce
    fromAccount.nonce = new BN$5(fromAccount.nonce).addn(1);

    basefee = tx.getBaseFee();
    gasLimit = new BN$5(tx.gasLimit);
    if (gasLimit.lt(basefee)) {
      return cb(new Error('base fee exceeds gas limit'));
    }
    gasLimit.isub(basefee);

    fromAccount.balance = new BN$5(fromAccount.balance).sub(new BN$5(tx.gasLimit).mul(new BN$5(tx.gasPrice)));
    self.stateManager.cache.put(tx.from, fromAccount);

    var options = {
      caller: tx.from,
      gasLimit: gasLimit,
      gasPrice: tx.gasPrice,
      to: tx.to,
      value: tx.value,
      data: tx.data,
      block: block,
      populateCache: false
    };

    if (tx.to.toString('hex') === '') {
      delete options.to;
    }

    // run call
    self.runCall(options, parseResults);

    function parseResults(err, _results) {
      if (err) return cb(err);
      results = _results;

      // generate the bloom for the tx
      results.bloom = txLogsBloom(results.vm.logs);
      fromAccount = self.stateManager.cache.get(tx.from);

      // caculate the total gas used
      results.gasUsed = results.gasUsed.add(basefee);

      // process any gas refund
      var gasRefund = results.vm.gasRefund;
      if (gasRefund) {
        if (gasRefund.lt(results.gasUsed.divn(2))) {
          results.gasUsed.isub(gasRefund);
        } else {
          results.gasUsed.isub(results.gasUsed.divn(2));
        }
      }

      results.amountSpent = results.gasUsed.mul(new BN$5(tx.gasPrice));
      // refund the leftover gas amount
      fromAccount.balance = new BN$5(tx.gasLimit).sub(results.gasUsed).mul(new BN$5(tx.gasPrice)).add(new BN$5(fromAccount.balance));

      self.stateManager.cache.put(tx.from, fromAccount);
      self.stateManager.touched.push(tx.from);

      var minerAccount = self.stateManager.cache.get(block.header.coinbase);
      // add the amount spent on gas to the miner's account
      minerAccount.balance = new BN$5(minerAccount.balance).add(results.amountSpent);

      // save the miner's account
      if (!new BN$5(minerAccount.balance).isZero()) {
        self.stateManager.cache.put(block.header.coinbase, minerAccount);
      }

      if (!results.vm.selfdestruct) {
        results.vm.selfdestruct = {};
      }

      var keys = Object.keys(results.vm.selfdestruct);

      keys.forEach(function (s) {
        self.stateManager.cache.del(safeBuffer.Buffer.from(s, 'hex'));
      });

      // delete all touched accounts
      var touched = self.stateManager.touched;
      async.forEach(touched, function (address, next) {
        self.stateManager.accountIsEmpty(address, function (err, empty) {
          if (err) {
            next(err);
            return;
          }

          if (empty) {
            self.stateManager.cache.del(address);
          }
          next(null);
        });
      }, function () {
        self.stateManager.touched = [];
        cb();
      });
    }
  }

  function saveTries(cb) {
    self.stateManager.commitContracts(cb);
  }

  function flushCache(cb) {
    self.stateManager.cache.flush(function () {
      if (opts.populateCache) {
        self.stateManager.cache.clear();
      }
      cb();
    });
  }
}

/**
 * @method txLogsBloom
 */
function txLogsBloom(logs) {
  var bloom = new Bloom();
  if (logs) {
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      // add the address
      bloom.add(log[0]);
      // add the topics
      var topics = log[1];
      for (var q = 0; q < topics.length; q++) {
        bloom.add(topics[q]);
      }
    }
  }
  return bloom;
}

var BN$6 = utils.BN;

/**
 * runs a CALL operation
 * @method runCall
 * @param opts
 * @param opts.block {Block}
 * @param opts.caller {Buffer}
 * @param opts.code {Buffer} this is for CALLCODE where the code to load is different than the code from the to account.
 * @param opts.data {Buffer}
 * @param opts.gasLimit {Buffer | BN.js }
 * @param opts.gasPrice {Buffer}
 * @param opts.origin {Buffer} []
 * @param opts.to {Buffer}
 * @param opts.value {Buffer}
 */
function runCall (opts, cb) {
  var self = this;
  var stateManager = self.stateManager;

  var vmResults = {};
  var toAccount;
  var toAddress = opts.to;
  var createdAddress;
  var txValue = opts.value || safeBuffer.Buffer.from([0]);
  var caller = opts.caller;
  var account = stateManager.cache.get(caller);
  var block = opts.block;
  var code = opts.code;
  var txData = opts.data;
  var gasLimit = opts.gasLimit || new BN$6(0xffffff);
  gasLimit = new BN$6(opts.gasLimit); // make sure is a BN
  var gasPrice = opts.gasPrice;
  var gasUsed = new BN$6(0);
  var origin = opts.origin;
  var isCompiled = opts.compiled;
  var depth = opts.depth;
  // opts.suicides is kept for backward compatiblity with pre-EIP6 syntax
  var selfdestruct = opts.selfdestruct || opts.suicides;
  var delegatecall = opts.delegatecall || false;
  var isStatic = opts.static || false;

  txValue = new BN$6(txValue);

  stateManager.checkpoint();

  // run and parse
  subTxValue();

  async.series([loadToAccount, loadCode, runCode, saveCode], parseCallResult);

  function loadToAccount(done) {
    // get receiver's account
    // toAccount = stateManager.cache.get(toAddress)
    if (!toAddress) {
      // generate a new contract if no `to`
      code = txData;
      txData = undefined;
      var newNonce = new BN$6(account.nonce).subn(1);
      createdAddress = toAddress = utils.generateAddress(caller, newNonce.toArray());
      stateManager.getAccount(createdAddress, function (err, account) {
        toAccount = account;
        var NONCE_OFFSET = 1;
        toAccount.nonce = new BN$6(toAccount.nonce).addn(NONCE_OFFSET).toArrayLike(safeBuffer.Buffer);
        done(err);
      });
    } else {
      // else load the `to` account
      toAccount = stateManager.cache.get(toAddress);
      done();
    }
  }

  function subTxValue() {
    if (delegatecall) {
      return;
    }
    account.balance = new BN$6(account.balance).sub(txValue);
    stateManager.cache.put(caller, account);
  }

  function addTxValue() {
    if (delegatecall) {
      return;
    }
    // add the amount sent to the `to` account
    toAccount.balance = new BN$6(toAccount.balance).add(txValue);
    stateManager.cache.put(toAddress, toAccount);
    stateManager.touched.push(toAddress);
  }

  function loadCode(cb) {
    addTxValue();
    // loads the contract's code if the account is a contract
    if (code || !(toAccount.isContract() || self._precompiled[toAddress.toString('hex')])) {
      cb();
      return;
    }

    if (self._precompiled[toAddress.toString('hex')]) {
      isCompiled = true;
      code = self._precompiled[toAddress.toString('hex')];
      cb();
      return;
    }

    stateManager.getContractCode(toAddress, function (err, c, comp) {
      if (err) return cb(err);
      isCompiled = comp;
      code = c;
      cb();
    });
  }

  function runCode(cb) {
    if (!code) {
      vmResults.exception = 1;
      stateManager.commit(cb);
      return;
    }

    var runCodeOpts = {
      code: code,
      data: txData,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      address: toAddress,
      origin: origin,
      caller: caller,
      value: txValue.toArrayLike(safeBuffer.Buffer),
      block: block,
      depth: depth,
      selfdestruct: selfdestruct,
      populateCache: false,
      static: isStatic

      // run Code through vm
    };var codeRunner = isCompiled ? self.runJIT : self.runCode;
    codeRunner.call(self, runCodeOpts, parseRunResult);

    function parseRunResult(err, results) {
      toAccount = self.stateManager.cache.get(toAddress);
      vmResults = results;

      if (createdAddress) {
        // fee for size of the return value
        var totalGas = results.gasUsed;
        if (!results.runState.vmError) {
          var returnFee = results.return.length * fees.createDataGas.v;

          // avoid BN assertion failure when returnFee is greater than 0x4000000
          if (returnFee > gasLimit.toNumber()) {
            returnFee = gasLimit.toNumber() + 1;
          }

          totalGas = totalGas.addn(returnFee);
        }
        // if not enough gas
        if (totalGas.lte(gasLimit) && results.return.length <= 24576) {
          results.gasUsed = totalGas;
        } else {
          results.return = safeBuffer.Buffer.alloc(0);
          // since Homestead
          results.exception = 0;
          err = results.exceptionError = ERROR.OUT_OF_GAS;
          results.gasUsed = gasLimit;
        }
      }

      gasUsed = results.gasUsed;
      if (err) {
        results.logs = [];
        stateManager.revert(cb);
      } else {
        stateManager.commit(cb);
      }
    }
  }

  function saveCode(cb) {
    // store code for a new contract
    if (createdAddress && !vmResults.runState.vmError && vmResults.return && vmResults.return.toString() !== '') {
      stateManager.putContractCode(createdAddress, vmResults.return, cb);
    } else {
      cb();
    }
  }

  function parseCallResult(err) {
    if (err) return cb(err);
    var results = {
      gasUsed: gasUsed,
      createdAddress: createdAddress,
      vm: vmResults
    };

    cb(null, results);
  }
}

/**
 * processes blocks and adds them to the blockchain
 * @method onBlock
 * @param blockchain
 */
function runBlockchain (blockchain, cb) {
  var self = this;
  var headBlock, parentState;

  self.blockchain = self.stateManager.blockchain;

  // parse arguments
  if (typeof blockchain === 'function') {
    cb = blockchain;
  } else if (blockchain) {
    self.blockchain = blockchain;
  }

  // setup blockchain iterator
  self.blockchain.iterator('vm', processBlock, cb);
  function processBlock(block, reorg, cb) {
    async.series([getStartingState, runBlock], cb);

    // determine starting state for block run
    function getStartingState(cb) {
      // if we are just starting or if a chain re-org has happened
      if (!headBlock || reorg) {
        self.blockchain.getBlock(block.header.parentHash, function (err, parentBlock) {
          parentState = parentBlock.header.stateRoot;
          // generate genesis state if we are at the genesis block
          // we don't have the genesis state
          if (!headBlock) {
            return self.stateManager.generateCanonicalGenesis(cb);
          } else {
            cb(err);
          }
        });
      } else {
        parentState = headBlock.header.stateRoot;
        cb();
      }
    }

    // run block, update head if valid
    function runBlock(cb) {
      self.runBlock({
        block: block,
        root: parentState
      }, function (err, results) {
        if (err) {
          // remove invalid block
          console.log('Invalid block error:', err);
          self.blockchain.delBlock(block.header.hash(), cb);
        } else {
          // set as new head block
          headBlock = block;
          cb();
        }
      });
    }
  }
}

var BN$7 = utils.BN;

function num01 (opts) {
  assert(opts.data);

  var results = {};

  results.gasUsed = new BN$7(fees.ecrecoverGas.v);

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.gasUsed = opts.gasLimit;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    results.exceptionError = ERROR.OUT_OF_GAS;
    return results;
  }

  var data = utils.setLengthRight(opts.data, 128);

  var msgHash = data.slice(0, 32);
  var v = data.slice(32, 64);
  var r = data.slice(64, 96);
  var s = data.slice(96, 128);

  var publicKey;
  try {
    publicKey = utils.ecrecover(msgHash, new BN$7(v).toNumber(), r, s);
  } catch (e) {
    return results;
  }

  results.return = utils.setLengthLeft(utils.publicToAddress(publicKey), 32);
  results.exception = 1;

  return results;
}

var BN$8 = utils.BN;

function num02 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  results.gasUsed = new BN$8(fees.sha256Gas.v);
  results.gasUsed.iadd(new BN$8(fees.sha256WordGas.v).imuln(Math.ceil(data.length / 32)));

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.gasUsed = opts.gasLimit;
    results.exceptionError = ERROR.OUT_OF_GAS;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    return results;
  }

  results.return = utils.sha256(data);
  results.exception = 1;

  return results;
}

var BN$9 = utils.BN;

function num03 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  results.gasUsed = new BN$9(fees.ripemd160Gas.v);
  results.gasUsed.iadd(new BN$9(fees.ripemd160WordGas.v).imuln(Math.ceil(data.length / 32)));

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.gasUsed = opts.gasLimit;
    results.exceptionError = ERROR.OUT_OF_GAS;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    return results;
  }

  results.return = utils.ripemd160(data, true);
  results.exception = 1;

  return results;
}

var BN$10 = utils.BN;

function num04 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  results.gasUsed = new BN$10(fees.identityGas.v);
  results.gasUsed.iadd(new BN$10(fees.identityWordGas.v).imuln(Math.ceil(data.length / 32)));

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.gasUsed = opts.gasLimit;
    results.exceptionError = ERROR.OUT_OF_GAS;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    return results;
  }

  results.return = data;
  results.exception = 1;

  return results;
}

var BN$11 = utils.BN;

var Gquaddivisor = fees.modexpGquaddivisor.v;

function multComplexity(x) {
  var fac1 = new BN$11(0);
  var fac2 = new BN$11(0);
  if (x.lten(64)) {
    return x.sqr();
  } else if (x.lten(1024)) {
    // return Math.floor(Math.pow(x, 2) / 4) + 96 * x - 3072
    fac1 = x.sqr().divn(4);
    fac2 = x.muln(96);
    return fac1.add(fac2).subn(3072);
  } else {
    // return Math.floor(Math.pow(x, 2) / 16) + 480 * x - 199680
    fac1 = x.sqr().divn(16);
    fac2 = x.muln(480);
    return fac1.add(fac2).subn(199680);
  }
}

function getAdjustedExponentLength(data) {
  var baseLen = new BN$11(data.slice(0, 32)).toNumber();
  var expLen = new BN$11(data.slice(32, 64));
  var expBytesStart = 96 + baseLen; // 96 for base length, then exponent length, and modulus length, then baseLen for the base data, then exponent bytes start
  var firstExpBytes = Buffer.from(data.slice(expBytesStart, expBytesStart + 32)); // first word of the exponent data
  firstExpBytes = utils.setLengthRight(firstExpBytes, 32); // reading past the data reads virtual zeros
  firstExpBytes = new BN$11(firstExpBytes);
  var max32expLen = 0;
  if (expLen.ltn(32)) {
    max32expLen = 32 - expLen.toNumber();
  }
  firstExpBytes = firstExpBytes.shrn(8 * Math.max(max32expLen, 0));

  var bitLen = -1;
  while (firstExpBytes.gtn(0)) {
    bitLen = bitLen + 1;
    firstExpBytes = firstExpBytes.ushrn(1);
  }
  var expLenMinus32OrZero = expLen.subn(32);
  if (expLenMinus32OrZero.ltn(0)) {
    expLenMinus32OrZero = new BN$11(0);
  }
  var eightTimesExpLenMinus32OrZero = expLenMinus32OrZero.muln(8);
  var adjustedExpLen = eightTimesExpLenMinus32OrZero;
  if (bitLen > 0) {
    adjustedExpLen.iaddn(bitLen);
  }
  return adjustedExpLen;
}

// Taken from https://stackoverflow.com/a/1503019
function expmod(B, E, M) {
  if (E.isZero()) return new BN$11(1).mod(M);
  var BM = B.mod(M);
  var R = expmod(BM, E.divn(2), M);
  R = R.mul(R).mod(M);
  if (E.mod(new BN$11(2)).isZero()) return R;
  return R.mul(BM).mod(M);
}

function getOOGResults(opts, results) {
  results.gasUsed = opts.gasLimit;
  results.exception = 0; // 0 means VM fail (in this case because of OOG)
  results.exceptionError = ERROR.OUT_OF_GAS;
  return results;
}

function num05 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  var adjustedELen = getAdjustedExponentLength(data);
  if (adjustedELen.ltn(1)) {
    adjustedELen = new BN$11(1);
  }

  var bLen = new BN$11(data.slice(0, 32));
  var eLen = new BN$11(data.slice(32, 64));
  var mLen = new BN$11(data.slice(64, 96));

  var maxLen = bLen;
  if (maxLen.lt(mLen)) {
    maxLen = mLen;
  }
  var gasUsed = adjustedELen.mul(multComplexity(maxLen)).divn(Gquaddivisor);

  if (opts.gasLimit.lt(gasUsed)) {
    return getOOGResults(opts, results);
  }

  results.gasUsed = gasUsed;

  if (bLen.isZero()) {
    results.return = new BN$11(0).toArrayLike(Buffer, 'be', 1);
    results.exception = 1;
    return results;
  }

  if (mLen.isZero()) {
    results.return = Buffer.from([0]);
    results.exception = 1;
    return results;
  }

  var maxInt = new BN$11(Number.MAX_SAFE_INTEGER);
  var maxSize = new BN$11(2147483647); // ethereumjs-util setLengthRight limitation

  if (bLen.gt(maxSize) || eLen.gt(maxSize) || mLen.gt(maxSize)) {
    return getOOGResults(opts, results);
  }

  var bStart = new BN$11(96);
  var bEnd = bStart.add(bLen);
  var eStart = bEnd;
  var eEnd = eStart.add(eLen);
  var mStart = eEnd;
  var mEnd = mStart.add(mLen);

  if (mEnd.gt(maxInt)) {
    return getOOGResults(opts, results);
  }

  bLen = bLen.toNumber();
  eLen = eLen.toNumber();
  mLen = mLen.toNumber();

  var B = new BN$11(utils.setLengthRight(data.slice(bStart.toNumber(), bEnd.toNumber()), bLen));
  var E = new BN$11(utils.setLengthRight(data.slice(eStart.toNumber(), eEnd.toNumber()), eLen));
  var M = new BN$11(utils.setLengthRight(data.slice(mStart.toNumber(), mEnd.toNumber()), mLen));

  // console.log('MODEXP input')
  // console.log('B:', bLen, B)
  // console.log('E:', eLen, E)
  // console.log('M:', mLen, M)

  var R;
  if (M.isZero()) {
    R = new BN$11(0);
  } else {
    R = expmod(B, E, M);
  }
  var result = R.toArrayLike(Buffer, 'be', mLen);

  results.return = result;
  results.exception = 1;

  // console.log('MODEXP output', result)

  return results;
}

var BN$12 = utils.BN;
var ecAddPrecompile = bn128Module.cwrap('ec_add', 'string', ['string']);

function num06 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;
  var inputHexStr = data.toString('hex');

  results.gasUsed = new BN$12(fees.ecAddGas.v);
  if (opts.gasLimit.lt(results.gasUsed)) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN$12(opts.gasLimit);
    results.exceptionError = ERROR.OUT_OF_GAS;
    return results;
  }

  var returnData = ecAddPrecompile(inputHexStr);

  // check ecadd success or failure by comparing the output length
  if (returnData.length !== 128) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN$12(opts.gasLimit);
    results.exceptionError = ERROR.OUT_OF_GAS;
  } else {
    results.return = Buffer.from(returnData, 'hex');
    results.exception = 1;
  }

  return results;
}

var BN$13 = utils.BN;
var ecMulPrecompile = bn128Module.cwrap('ec_mul', 'string', ['string']);

function num07 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  var inputHexStr = data.toString('hex');
  results.gasUsed = new BN$13(fees.ecMulGas.v);

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN$13(opts.gasLimit);
    results.exceptionError = ERROR.OUT_OF_GAS;
    return results;
  }

  var returnData = ecMulPrecompile(inputHexStr);

  // check ecmul success or failure by comparing the output length
  if (returnData.length !== 128) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
  } else {
    results.return = Buffer.from(returnData, 'hex');
    results.exception = 1;
  }

  return results;
}

var BN$14 = utils.BN;
var ecPairingPrecompile = bn128Module.cwrap('ec_pairing', 'string', ['string']);

function num08 (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  var inputHexStr = data.toString('hex');
  var inputData = Buffer.from(inputHexStr, 'hex');
  var inputDataSize = Math.floor(inputData.length / 192);

  var gascost = fees.ecPairingGas.v + inputDataSize * fees.ecPairingWordGas.v;
  results.gasUsed = new BN$14(gascost);

  if (opts.gasLimit.ltn(gascost)) {
    results.gasUsed = opts.gasLimit;
    results.exceptionError = ERROR.OUT_OF_GAS;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    return results;
  }

  var returnData = ecPairingPrecompile(inputHexStr);

  // check ecpairing success or failure by comparing the output length
  if (returnData.length !== 64) {
    results.return = Buffer.alloc(0);
    results.gasUsed = opts.gasLimit;
    results.exceptionError = ERROR.OUT_OF_GAS;
    results.exception = 0;
  } else {
    results.return = Buffer.from(returnData, 'hex');
    results.exception = 1;
  }

  return results;
}

// import the vm components
// import the precompiled contracts
var BN$15 = utils.BN;
VM.deps = {
  ethUtil: utils,
  Account: require('ethereumjs-account'),
  Trie: require('merkle-patricia-tree'),
  rlp: require('ethereumjs-util').rlp

  /**
   * @constructor
   * @param {Object} [opts]
   * @param {StateManager} [opts.stateManager] A state manager instance (EXPERIMENTAL - unstable API)
   * @param {Trie} [opts.state] A merkle-patricia-tree instance for the state tree (ignored if stateManager is passed)
   * @param {Blockchain} [opts.blockchain] A blockchain object for storing/retrieving blocks (ignored if stateManager is passed)
   * @param {Boolean} [opts.activatePrecompiles] Create entries in the state tree for the precompiled contracts
   */
};function VM() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.opts = opts;

  if (opts.stateManager) {
    this.stateManager = opts.stateManager;
  } else {
    this.stateManager = new StateManager({
      trie: opts.state,
      blockchain: opts.blockchain
    });
  }

  // temporary
  // this is here for a gradual transition to StateManager
  this.blockchain = this.stateManager.blockchain;
  this.trie = this.stateManager.trie;

  // precompiled contracts
  this._precompiled = {};
  this._precompiled['0000000000000000000000000000000000000001'] = num01;
  this._precompiled['0000000000000000000000000000000000000002'] = num02;
  this._precompiled['0000000000000000000000000000000000000003'] = num03;
  this._precompiled['0000000000000000000000000000000000000004'] = num04;
  this._precompiled['0000000000000000000000000000000000000005'] = num05;
  this._precompiled['0000000000000000000000000000000000000006'] = num06;
  this._precompiled['0000000000000000000000000000000000000007'] = num07;
  this._precompiled['0000000000000000000000000000000000000008'] = num08;

  if (this.opts.activatePrecompiles) {
    for (var i = 1; i <= 7; i++) {
      this.trie.put(new BN$15(i).toArrayLike(safeBuffer.Buffer, 'be', 20), new Account().serialize());
    }
  }

  AsyncEventEmitter.call(this);
}

util.inherits(VM, AsyncEventEmitter);

VM.prototype.runCode = runCode;
VM.prototype.runJIT = runJIT;
VM.prototype.runBlock = runBlock;
VM.prototype.runTx = runTx;
VM.prototype.runCall = runCall;
VM.prototype.runBlockchain = runBlockchain;

VM.prototype.copy = function () {
  return new VM({
    state: this.trie.copy(),
    blockchain: this.blockchain
  });
};

/**
 * Loads precompiled contracts into the state
 */
VM.prototype.loadCompiled = function (address, src, cb) {
  this.trie.db.put(address, src, cb);
};

VM.prototype.populateCache = function (addresses, cb) {
  this.stateManager.warmCache(addresses, cb);
};

module.exports = VM;
