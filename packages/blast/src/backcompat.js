import { ReactiveVar } from '@blastjs/reactive-var';
import { Blast } from './preamble';

Blast.ReactiveVar = ReactiveVar;

export const Handlebars = {};
Handlebars.registerHelper = Blast.registerHelper;

Handlebars._escape = Blast._escape;

// Return these from {{...}} helpers to achieve the same as returning
// strings from {{{...}}} helpers
Handlebars.SafeString = function (string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function () {
  return this.string.toString();
};
