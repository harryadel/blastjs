const Blaze = require('./preamble.js');
const ReactiveVar = typeof Package !== "undefined" && Package["reactive-var"] ? Package["reactive-var"].ReactiveVar : require("meteor-standalone-reactive-var");
UI = Blaze;

Blaze.ReactiveVar = ReactiveVar;
UI._templateInstance = Blaze.Template.instance;

Handlebars = {};
Handlebars.registerHelper = Blaze.registerHelper;

Handlebars._escape = Blaze._escape;

// Return these from {{...}} helpers to achieve the same as returning
// strings from {{{...}}} helpers
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};
