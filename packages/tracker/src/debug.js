/* eslint-disable no-console */

let suppress = 0;

// replacement for console.log. This is a temporary API. We should
// provide a real logging API soon (possibly just a polyfill for
// console?)
//
// NOTE: this is used on the server to print the warning about
// having autopublish enabled when you probably meant to turn it
// off. it's not really the proper use of something called
// _debug. the intent is for this message to go to the terminal and
// be very visible. if you change _debug to go someplace else, etc,
// please fix the autopublish code to do something reasonable.
//
const debugFunc = function (...args) {
  if (suppress) {
    suppress -= 1;
    return;
  }
  if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
    if (args.length === 0) {
      // IE Companion breaks otherwise
      // IE10 PP4 requires at least one argument
      console.log('');
    } else {
      // IE doesn't have console.log.apply, it's not a real Object.
      // http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
      // http://patik.com/blog/complete-cross-browser-console-log/
      // eslint-disable-next-line no-lonely-if
      if (typeof console.log.apply === 'function') {
        // Most browsers

        // Chrome and Safari only hyperlink URLs to source files in first argument of
        // console.log, so try to call it with one argument if possible.
        // Approach taken here: If all arguments are strings, join them on space.
        // See https://github.com/meteor/meteor/pull/732#issuecomment-13975991
        let allArgumentsOfTypeString = true;
        for (let i = 0; i < args.length; i += 1) {
          if (typeof args[i] !== 'string') { allArgumentsOfTypeString = false; }
        }

        if (allArgumentsOfTypeString) {
          console.log.apply(console, [
            Array.prototype.join.call(args, ' '),
          ]);
        } else {
          console.log(...args);
        }
      } else if (typeof Function.prototype.bind === 'function') {
        // IE9
        const log = Function.prototype.bind.call(console.log, console);
        log.apply(console, args);
      } else {
        // IE8
        Function.prototype.call.call(
          console.log,
          console,
          Array.prototype.slice.call(args),
        );
      }
    }
  }
};

// Suppress the next 'count' Meteor._debug messsages. Use this to
// stop tests from spamming the console.
//
const suppressLog = (count) => {
  suppress += count;
};

const suppressedLogExpected = function () {
  return suppress !== 0;
};

function _maybeSuppressMoreLogs(messagesLength) {
  // Sometimes when running tests, we intentionally suppress logs on expected
  // printed errors. Since the current implementation of _throwOrLog can log
  // multiple separate log messages, suppress all of them if at least one suppress
  // is expected as we still want them to count as one.
  if (typeof Meteor !== 'undefined') {
    if (suppressedLogExpected()) {
      suppressLog(messagesLength - 1);
    }
  }
}

module.exports = {
  suppressLog,
  suppressedLogExpected,
  debugFunc,
  _maybeSuppressMoreLogs,
};
