import { Blast } from '@blastjs/blast';
import has from 'lodash.has';
import { Spacebars } from '@blastjs/spacebars';

// import './dynamic.html.template';

/**
 * @summary The class for defining templates
 * @class
 * @instanceName Template.myTemplate
 */
const { Template } = Blast;

const RESERVED_TEMPLATE_NAMES = '__proto__ name'.split(' ');

// Check for duplicate template names and illegal names that won't work.
Template.__checkName = function (name) {
  // Some names can't be used for Templates. These include:
  //  - Properties Blast sets on the Template object.
  //  - Properties that some browsers don't let the code to set.
  //    These are specified in RESERVED_TEMPLATE_NAMES.
  if (name in Template || RESERVED_TEMPLATE_NAMES.includes(name)) {
    if (Template[name] instanceof Template && name !== 'body') {
      throw new Error(
        `There are multiple templates named '${
          name
        }'. Each template needs a unique name.`,
      );
    }
    throw new Error(`This template name is reserved: ${name}`);
  }
};

// XXX COMPAT WITH 0.8.3
Template.__define__ = function (name, renderFunc) {
  Template.__checkName(name);
  Template[name] = new Template(`Template.${name}`, renderFunc);
  // Exempt packages built pre-0.9.0 from warnings about using old
  // helper syntax, because we can.  It's not very useful to get a
  // warning about someone else's code (like a package on Atmosphere),
  // and this should at least put a bit of a dent in number of warnings
  // that come from packages that haven't been updated lately.
  Template[name]._NOWARN_OLDSTYLE_HELPERS = true;
};

// Define a template `Template.body` that renders its
// `contentRenderFuncs`.  `<body>` tags (of which there may be
// multiple) will have their contents added to it.

/**
  * @summary The [template object](#Template-Declarations) representing your `<body>`
  * tag.
  * @locus Client
  */
Template.body = new Template('body', function () {
  const view = this;
  return Template.body.contentRenderFuncs.map((func) => func.apply(view));
});
Template.body.contentRenderFuncs = []; // array of Blast.Views
Template.body.view = null;

Template.body.addContent = function (renderFunc) {
  Template.body.contentRenderFuncs.push(renderFunc);
};

// This function does not use `this` and so it may be called
// as `Meteor.startup(Template.body.renderIntoDocument)`.
Template.body.renderToDocument = function () {
  // Only do it once.
  if (Template.body.view) { return; }

  const view = Blast.render(Template.body, document.body);
  Template.body.view = view;
};

Template.__pendingReplacement = [];

let updateTimeout = null;

// Simple HMR integration to re-render all of the root views
// when a template is modified. This function can be overridden to provide
// an alternative method of applying changes from HMR.
Template._applyHmrChanges = function (templateName) {
  if (updateTimeout) {
    return;
  }

  // debounce so we only re-render once per rebuild
  updateTimeout = setTimeout(() => {
    updateTimeout = null;

    for (var i = 0; i < Template.__pendingReplacement.length; i++) {
      delete Template[Template.__pendingReplacement[i]];
    }

    Template.__pendingReplacement = [];

    const views = Blast.__rootViews.slice();
    for (var i = 0; i < views.length; i++) {
      const view = views[i];
      if (view.destroyed) {
        continue;
      }

      const renderFunc = view._render;
      var parentEl;
      if (view._domrange && view._domrange.parentElement) {
        parentEl = view._domrange.parentElement;
      } else if (view._hmrParent) {
        parentEl = view._hmrParent;
      }

      var comment;
      if (view._hmrAfter) {
        comment = view._hmrAfter;
      } else {
        const first = view._domrange.firstNode();
        comment = document.createComment('Blast HMR PLaceholder');
        parentEl.insertBefore(comment, first);
      }

      view._hmrAfter = null;
      view._hmrParent = null;

      if (view._domrange) {
        Blast.remove(view);
      }

      try {
        if (view === Template.body.view) {
          const newView = Blast.render(Template.body, document.body, comment);
          Template.body.view = newView;
        } else if (view.dataVar) {
          Blast.renderWithData(renderFunc, view.dataVar.curValue, parentEl, comment);
        } else {
          Blast.render(renderFunc, parentEl, comment);
        }

        parentEl.removeChild(comment);
      } catch (e) {
        console.log('[Blast HMR] Error re-rending template:');
        console.error(e);

        // Record where the view should have been so we can still render it
        // during the next update
        const newestRoot = Blast.__rootViews[Blast.__rootViews.length - 1];
        if (newestRoot && newestRoot.isCreated && !newestRoot.isRendered) {
          newestRoot._hmrAfter = comment;
          newestRoot._hmrParent = parentEl;
        }
      }
    }
  });
};

Template._migrateTemplate = function (templateName, newTemplate, migrate) {
  const oldTemplate = Template[templateName];
  var migrate = Template.__pendingReplacement.indexOf(templateName) > -1;

  if (oldTemplate && migrate) {
    newTemplate.__helpers = oldTemplate.__helpers;
    newTemplate.__eventMaps = oldTemplate.__eventMaps;
    newTemplate._callbacks.created = oldTemplate._callbacks.created;
    newTemplate._callbacks.rendered = oldTemplate._callbacks.rendered;
    newTemplate._callbacks.destroyed = oldTemplate._callbacks.destroyed;
    delete Template[templateName];
    Template._applyHmrChanges(templateName);
  }

  if (migrate) {
    Template.__pendingReplacement.splice(
      Template.__pendingReplacement.indexOf(templateName),
      1,
    );
  }

  Template.__checkName(templateName);
  Template[templateName] = newTemplate;
};

Template.__checkName('__dynamic');
Template.__dynamic = new Template('Template.__dynamic', (function () { const view = this; return [Blast.View('lookup:checkContext', () => Spacebars.mustache(view.lookup('checkContext'))), '\n  ', Blast.If(() => Spacebars.call(view.lookup('dataContextPresent')), (() => ['\n    ', Spacebars.include(view.lookupTemplate('__dynamicWithDataContext'), (() => Blast._InOuterTemplateScope(view, () => Spacebars.include(() => Spacebars.call(view.templateContentBlock))))), '\n  ']), (() => ['\n    \n    ', Blast._TemplateWith(() => ({ template: Spacebars.call(view.lookup('template')), data: Spacebars.call(view.lookup('..')) }), () => Spacebars.include(view.lookupTemplate('__dynamicWithDataContext'), (() => Blast._InOuterTemplateScope(view, () => Spacebars.include(() => Spacebars.call(view.templateContentBlock)))))), '\n  ']))]; }));

Template.__checkName('__dynamicWithDataContext');
Template.__dynamicWithDataContext = new Template('Template.__dynamicWithDataContext', (function () { const view = this; return Spacebars.With(() => Spacebars.dataMustache(view.lookup('chooseTemplate'), view.lookup('template')), (() => ['\n    \n    ', Blast._TemplateWith(() => Spacebars.call(Spacebars.dot(view.lookup('..'), 'data')), () => Spacebars.include(view.lookupTemplate('..'), (() => Blast._InOuterTemplateScope(view, () => Spacebars.include(() => Spacebars.call(view.templateContentBlock)))))), '\n  '])); }));

/**
 * @isTemplate true
 * @memberOf Template
 * @function dynamic
 * @summary Choose a template to include dynamically, by name.
 * @locus Templates
 * @param {String} template The name of the template to include.
 * @param {Object} [data] Optional. The data context in which to include the
 * template.
 */

/**
 * @isTemplate true
 * @memberOf Template
 * @function dynamic
 * @summary Choose a template to include dynamically, by name.
 * @locus Templates
 * @param {String} template The name of the template to include.
 * @param {Object} [data] Optional. The data context in which to include the
 * template.
 */

Template.__dynamicWithDataContext.helpers({
  chooseTemplate(name) {
    return Blast._getTemplate(name, () => Template.instance());
  },
});

Template.__dynamic.helpers({
  dataContextPresent() {
    return has(this, 'data');
  },
  checkContext() {
    if (!has(this, 'template')) {
      throw new Error(
        "Must specify name in the 'template' argument "
          + 'to {{> Template.dynamic}}.',
      );
    }

    Object.keys(this).forEach((k) => {
      if (k !== 'template' && k !== 'data') {
        throw new Error(`Invalid argument to {{> Template.dynamic}}: ${k}`);
      }
    });
  },
});

export { Template };
