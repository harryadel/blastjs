_ = require('underscore');
Spacebars = require('./spacebars/spacebars-runtime.js');
Template = require('./templating-runtime/templating.js');
Blaze = require('./blaze/index.js');
Tracker = typeof Package !== 'undefined' && Package.tracker ? Package.tracker.Tracker : require('meteor-standalone-tracker');
ReactiveVar = typeof Package !== 'undefined' && Package['reactive-var'] ? Package['reactive-var'].ReactiveVar : require('meteor-standalone-reactive-var');
HTML = require('meteor-blaze-common').HTML;
