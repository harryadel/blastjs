/**
 * @namespace Blast
 * @summary The namespace for all Blast-related methods and classes.
 */
export const Blast = {};

// Utility to HTML-escape a string.  Included for legacy reasons.
// TODO: Should be replaced with _.escape once underscore is upgraded to a newer
//       version which escapes ` (backtick) as well. Underscore 1.5.2 does not.
Blast._escape = (function () {
  const escape_map = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;', /* IE allows backtick-delimited attributes?? */
    '&': '&amp;',
  };
  const escape_one = function (c) {
    return escape_map[c];
  };

  return function (x) {
    return x.replace(/[&<>"'`]/g, escape_one);
  };
}());

Blast._warn = function (msg) {
  msg = `Warning: ${msg}`;

  if ((typeof console !== 'undefined') && console.warn) {
    console.warn(msg);
  }
};

const nativeBind = Function.prototype.bind;

// An implementation of _.bind which allows better optimization.
// See: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
if (nativeBind) {
  Blast._bind = function (func, obj) {
    if (arguments.length === 2) {
      return nativeBind.call(func, obj);
    }

    // Copy the arguments so this function can be optimized.
    const args = new Array(arguments.length);
    for (let i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    return nativeBind.apply(func, args.slice(1));
  };
} else {
  // A slower but backwards compatible version.
  Blast._bind = function (objA, objB) {
    objA.bind(objB);
  };
}
