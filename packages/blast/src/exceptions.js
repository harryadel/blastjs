import { Blast } from './preamble';

let debugFunc;

// We call into user code in many places, and it's nice to catch exceptions
// propagated from user code immediately so that the whole system doesn't just
// break.  Catching exceptions is easy; reporting them is hard.  This helper
// reports exceptions.
//
// Usage:
//
// ```
// try {
//   // ... someStuff ...
// } catch (e) {
//   reportUIException(e);
// }
// ```
//
// An optional second argument overrides the default message.

// Set this to `true` to cause `reportException` to throw
// the next exception rather than reporting it.  This is
// useful in unit tests that test error messages.
Blast._throwNextException = false;

Blast._reportException = function (e, msg) {
  if (Blast._throwNextException) {
    Blast._throwNextException = false;
    throw e;
  }

  if (!debugFunc)
  // adapted from Tracker
  {
    debugFunc = function () {
      return (typeof Meteor !== 'undefined' ? Meteor._debug
        : ((typeof console !== 'undefined') && console.log ? console.log
          : function () {}));
    };
  }

  // In Chrome, `e.stack` is a multiline string that starts with the message
  // and contains a stack trace.  Furthermore, `console.log` makes it clickable.
  // `console.log` supplies the space between the two arguments.
  debugFunc()(msg || 'Exception caught in template:', e.stack || e.message || e);
};

Blast._wrapCatchingExceptions = function (f, where) {
  if (typeof f !== 'function') { return f; }

  return function () {
    try {
      return f.apply(this, arguments);
    } catch (e) {
      Blast._reportException(e, `Exception in ${where}:`);
    }
  };
};
