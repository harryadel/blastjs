'use strict';

var path = require('path')
  , fs = require('fs');

//
// Retrieve the source code of all required assets to compile them the actual
// full source of the EJSON source.
//
var source = [
  'module.exports = (function () {',
  '"use strict";',

  //
  // Add a Meteor stub, when fibers are not supported on you system meteor
  // automatically sets this function to a nope function. We're going to do the
  // same here as there are small parts of the code that call this function.
  //
  'var Meteor = { isServer: true, _noYieldsAllowed:function nope(f) { return f(); }};',
  'var Npm = { require: require };',

  //
  // Meteor uses package globals done by leaving out "var"
  // These variable declarations ensure that we don't have horrible global leaks in our own code.
  //
  'var check, Match;',

  'var _ = require("underscore");',
  'var EJSON = require("ejson");',
  fs.readFileSync(path.join(__dirname, './vendor/helpers.js'), 'utf-8'),
  fs.readFileSync(path.join(__dirname, './vendor/errors.js'), 'utf-8'),
  fs.readFileSync(path.join(__dirname, './vendor/dynamics_nodejs.js'), 'utf-8'),
  fs.readFileSync(path.join(__dirname, './vendor/match.js'), 'utf-8'),

  '  return { check: check, Match: Match, Meteor: Meteor };',
  '}).call(this);'
].join('\n');

fs.writeFileSync(__dirname + '/index.js', source);
