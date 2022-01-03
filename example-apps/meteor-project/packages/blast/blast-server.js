import { Random } from 'meteor/random';
import { JSDOM } from 'jsdom';
import { Tracker } from 'meteor/tracker';

global.Random = Random;
global.window = new JSDOM('...').window;
global.document = window.document;
Package.tracker.Tracker = global.Tracker || Tracker;
const { Template } = require('@blastjs/templating-runtime');
const { Blast } = require('@blastjs/blast');
const { Spacebars } = require('@blastjs/spacebars');
const { HTML } = require('@blastjs/htmljs');

// global.$ = cheerio.load;
// not sure why this is required? I guess a different global context.
global.Template = Template;
global.Spacebars = Spacebars;
global.Blast = Blast;
global.HTML = HTML;

const oldSetImmediate = Meteor._setImmediate;

const oldBindEnvironment = Meteor.bindEnvironment;
global.window.performance.now = global.window.performance.now.bind(global.window.performance);
/*
Meteor.bindEnvironment = function bindEnvironment(...args) {
  const ret = oldBindEnvironment.call(this, ...args);
  ret.__bound = true;
  return ret;
};
*/
// HACK: Tracker will block any yields unless it thinks its on the client, this means no collection calls
//       A better solution might be to pass the documents to the ready callback of a subscription,
//       and do the collection find inside of the init, where we know we're in a fiber.
/* Meteor._setImmediate = function _setImmediate(fn, ...args) {
  if (fn === Tracker._runFlush && require("fibers").current) {
    const oldFn = fn;
    fn = Meteor.bindEnvironment(() => {
      try {
        Meteor.isClient = true;
        return oldFn();
      }
      finally {
        Meteor.isClient = false;
      }
    });
  }
  return oldSetImmediate.call(this, fn !== Tracker._runFlush || !require("fibers").current ? fn : Meteor.bindEnvironment(fn), ...args);
};
*/
/*
function setCurrentComputation(c) {
  Tracker.currentComputation = c;
  Tracker.active = !!c;
}

Tracker.Computation.prototype._compute = function _compute() {
  this.invalidated = false;
  const previous = Tracker.currentComputation;
  setCurrentComputation(this);

  try {
    this._func(this);
  }
  finally {
    setCurrentComputation(previous);
  }
};
*/
