import has from 'lodash.has';
import { Blast } from './preamble';

Blast._globalHelpers = {};

// Documented as Template.registerHelper.
// This definition also provides back-compat for `UI.registerHelper`.
Blast.registerHelper = function (name, func) {
  Blast._globalHelpers[name] = func;
};

// Also documented as Template.deregisterHelper
Blast.deregisterHelper = function (name) {
  delete Blast._globalHelpers[name];
};

const bindIfIsFunction = function (x, target) {
  if (typeof x !== 'function') { return x; }
  return Blast._bind(x, target);
};

// If `x` is a function, binds the value of `this` for that function
// to the current data context.
const bindDataContext = function (x) {
  if (typeof x === 'function') {
    return function () {
      let data = Blast.getData();
      if (data == null) { data = {}; }
      return x.apply(data, arguments);
    };
  }
  return x;
};

Blast._OLDSTYLE_HELPER = {};

Blast._getTemplateHelper = function (template, name, tmplInstanceFunc) {
  // XXX COMPAT WITH 0.9.3
  let isKnownOldStyleHelper = false;

  if (template.__helpers.has(name)) {
    const helper = template.__helpers.get(name);
    if (helper === Blast._OLDSTYLE_HELPER) {
      isKnownOldStyleHelper = true;
    } else if (helper != null) {
      return wrapHelper(bindDataContext(helper), tmplInstanceFunc);
    } else {
      return null;
    }
  }

  // old-style helper
  if (name in template) {
    // Only warn once per helper
    if (!isKnownOldStyleHelper) {
      template.__helpers.set(name, Blast._OLDSTYLE_HELPER);
      if (!template._NOWARN_OLDSTYLE_HELPERS) {
        Blast._warn(`Assigning helper with \`${template.viewName}.${
          name} = ...\` is deprecated.  Use \`${template.viewName
        }.helpers(...)\` instead.`);
      }
    }
    if (template[name] != null) {
      return wrapHelper(bindDataContext(template[name]), tmplInstanceFunc);
    }
  }

  return null;
};

var wrapHelper = function (f, templateFunc) {
  if (typeof f !== 'function') {
    return f;
  }

  return function () {
    const self = this;
    const args = arguments;

    return Blast.Template._withTemplateInstanceFunc(templateFunc, () => Blast._wrapCatchingExceptions(f, 'template helper').apply(self, args));
  };
};

Blast._lexicalBindingLookup = function (view, name) {
  let currentView = view;
  const blockHelpersStack = [];

  // walk up the views stopping at a Spacebars.include or Template view that
  // doesn't have an InOuterTemplateScope view as a parent
  do {
    // skip block helpers views
    // if we found the binding on the scope, return it
    if (has(currentView._scopeBindings, name)) {
      var bindingReactiveVar = currentView._scopeBindings[name];
      return function () {
        return bindingReactiveVar.get();
      };
    }
  } while (!(currentView.__startsNewLexicalScope
              && !(currentView.parentView
                 && currentView.parentView.__childDoesntStartNewLexicalScope))
           && (currentView = currentView.parentView));

  return null;
};

// templateInstance argument is provided to be available for possible
// alternative implementations of this function by 3rd party packages.
Blast._getTemplate = function (name, templateInstance) {
  if ((name in Blast.Template) && (Blast.Template[name] instanceof Blast.Template)) {
    return Blast.Template[name];
  }
  return null;
};

Blast._getGlobalHelper = function (name, templateInstance) {
  if (Blast._globalHelpers[name] != null) {
    return wrapHelper(bindDataContext(Blast._globalHelpers[name]), templateInstance);
  }
  return null;
};

// Looks up a name, like "foo" or "..", as a helper of the
// current template; the name of a template; a global helper;
// or a property of the data context.  Called on the View of
// a template (i.e. a View with a `.template` property,
// where the helpers are).  Used for the first name in a
// "path" in a template tag, like "foo" in `{{foo.bar}}` or
// ".." in `{{frobulate ../blah}}`.
//
// Returns a function, a non-function value, or null.  If
// a function is found, it is bound appropriately.
//
// NOTE: This function must not establish any reactive
// dependencies itself.  If there is any reactivity in the
// value, lookup should return a function.
Blast.View.prototype.lookup = function (name, _options) {
  const { template } = this;
  const lookupTemplate = _options && _options.template;
  let helper;
  let binding;
  let boundTmplInstance;
  let foundTemplate;

  if (this.templateInstance) {
    boundTmplInstance = Blast._bind(this.templateInstance, this);
  }

  // 0. looking up the parent data context with the special "../" syntax
  if (/^\./.test(name)) {
    // starts with a dot. must be a series of dots which maps to an
    // ancestor of the appropriate height.
    if (!/^(\.)+$/.test(name)) { throw new Error('id starting with dot must be a series of dots'); }

    return Blast._parentData(name.length - 1, true /* _functionWrapped */);
  }

  // 1. look up a helper on the current template
  if (template && ((helper = Blast._getTemplateHelper(template, name, boundTmplInstance)) != null)) {
    return helper;
  }

  // 2. look up a binding by traversing the lexical view hierarchy inside the
  // current template
  if (template && (binding = Blast._lexicalBindingLookup(Blast.currentView, name)) != null) {
    return binding;
  }

  // 3. look up a template by name
  if (lookupTemplate && ((foundTemplate = Blast._getTemplate(name, boundTmplInstance)) != null)) {
    return foundTemplate;
  }

  // 4. look up a global helper
  if ((helper = Blast._getGlobalHelper(name, boundTmplInstance)) != null) {
    return helper;
  }

  // 5. look up in a data context
  return function () {
    const isCalledAsFunction = (arguments.length > 0);
    const data = Blast.getData();
    const x = data && data[name];
    if (!x) {
      if (lookupTemplate) {
        throw new Error(`No such template: ${name}`);
      } else if (isCalledAsFunction) {
        throw new Error(`No such function: ${name}`);
      } else if (name.charAt(0) === '@' && ((x === null)
                                            || (x === undefined))) {
        // Throw an error if the user tries to use a `@directive`
        // that doesn't exist.  We don't implement all directives
        // from Handlebars, so there's a potential for confusion
        // if we fail silently.  On the other hand, we want to
        // throw late in case some app or package wants to provide
        // a missing directive.
        throw new Error(`Unsupported directive: ${name}`);
      }
    }
    if (!data) {
      return null;
    }
    if (typeof x !== 'function') {
      if (isCalledAsFunction) {
        throw new Error(`Can't call non-function: ${x}`);
      }
      return x;
    }
    return x.apply(data, arguments);
  };
};

// Implement Spacebars' {{../..}}.
// @param height {Number} The number of '..'s
Blast._parentData = function (height, _functionWrapped) {
  // If height is null or undefined, we default to 1, the first parent.
  if (height == null) {
    height = 1;
  }
  let theWith = Blast.getView('with');
  for (let i = 0; (i < height) && theWith; i++) {
    theWith = Blast.getView(theWith, 'with');
  }

  if (!theWith) { return null; }
  if (_functionWrapped) { return function () { return theWith.dataVar.get(); }; }
  return theWith.dataVar.get();
};

Blast.View.prototype.lookupTemplate = function (name) {
  return this.lookup(name, { template: true });
};
