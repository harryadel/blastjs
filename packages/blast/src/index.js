import { Blast } from './preamble';

import './attrs';
import { Handlebars } from './backcompat';
import './builtins';
import './dombackend';
import './domrange';
import './events';
import './exceptions';
import './materializer';
import './view';
import './lookup';
import { Template } from './template';
import canonicalizeHtml from './canonicalizeHtml';

export {
  Blast, canonicalizeHtml, Template, Handlebars,
};
