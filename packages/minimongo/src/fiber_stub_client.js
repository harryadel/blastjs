// Copied from
// https://github.com/meteor/meteor/blob/ffcfa5062cf1bf8a64ea64fef681ffcd99fe7939/packages/meteor/fiber_stubs_client.js

// This file is a partial analogue to fiber_helpers.js, which allows the client
// to use a queue too, and also to call noYieldsAllowed.

// The client has no ability to yield, so noYieldsAllowed is a noop.
//
export const _noYieldsAllowed = function (f) {
  return f();
};

// An even simpler queue of tasks than the fiber-enabled one.  This one just
// runs all the tasks when you call runTask or flush, synchronously.
//
export const _SynchronousQueue = function () {
  const self = this;
  self._tasks = [];
  self._running = false;
  self._runTimeout = null;
};

const SQp = _SynchronousQueue.prototype;

SQp.runTask = function (task) {
  const self = this;
  if (!self.safeToRunTask()) { throw new Error('Could not synchronously run a task from a running task'); }
  self._tasks.push(task);
  const tasks = self._tasks;
  self._tasks = [];
  self._running = true;

  if (self._runTimeout) {
    // Since we're going to drain the queue, we can forget about the timeout
    // which tries to run it.  (But if one of our tasks queues something else,
    // the timeout will be correctly re-created.)
    clearTimeout(self._runTimeout);
    self._runTimeout = null;
  }

  try {
    while (tasks.length > 0) {
      const t = tasks.shift();
      try {
        t();
      } catch (e) {
        if (tasks.length === 0) {
          // this was the last task, that is, the one we're calling runTask
          // for.
          throw e;
        }
        console.debug('Exception in queued task', e);
      }
    }
  } finally {
    self._running = false;
  }
};

SQp.queueTask = function (task) {
  const self = this;
  self._tasks.push(task);
  // Intentionally not using Meteor.setTimeout, because it doesn't like runing
  // in stubs for now.
  if (!self._runTimeout) {
    self._runTimeout = setTimeout(function () {
      return self.flush.apply(self, arguments);
    }, 0);
  }
};

SQp.flush = function () {
  const self = this;
  self.runTask(() => {});
};

SQp.drain = function () {
  const self = this;
  if (!self.safeToRunTask()) {
    return;
  }
  while (self._tasks.length > 0) {
    self.flush();
  }
};

SQp.safeToRunTask = function () {
  const self = this;
  return !self._running;
};
