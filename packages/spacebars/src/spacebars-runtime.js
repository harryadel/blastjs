import { Blast, Handlebars } from '@blastjs/blast';

export const Spacebars = {};

const tripleEquals = function (a, b) { return a === b; };

Spacebars.include = function (templateOrFunction, contentFunc, elseFunc) {
  if (!templateOrFunction) { return null; }

  if (typeof templateOrFunction !== 'function') {
    const template = templateOrFunction;
    if (!Blast.isTemplate(template)) { throw new Error(`Expected template or null, found: ${template}`); }
    var view = templateOrFunction.constructView(contentFunc, elseFunc);
    view.__startsNewLexicalScope = true;
    return view;
  }

  const templateVar = Blast.ReactiveVar(null, tripleEquals);
  var view = Blast.View('Spacebars.include', () => {
    const template = templateVar.get();
    if (template === null) { return null; }

    if (!Blast.isTemplate(template)) { throw new Error(`Expected template or null, found: ${template}`); }

    return template.constructView(contentFunc, elseFunc);
  });
  view.__templateVar = templateVar;
  view.onViewCreated(function () {
    this.autorun(() => {
      templateVar.set(templateOrFunction());
    });
  });
  view.__startsNewLexicalScope = true;

  return view;
};

// Executes `{{foo bar baz}}` when called on `(foo, bar, baz)`.
// If `bar` and `baz` are functions, they are called before
// `foo` is called on them.
//
// This is the shared part of Spacebars.mustache and
// Spacebars.attrMustache, which differ in how they post-process the
// result.
Spacebars.mustacheImpl = function (value/* , args */) {
  let args = arguments;
  // if we have any arguments (pos or kw), add an options argument
  // if there isn't one.
  if (args.length > 1) {
    let kw = args[args.length - 1];
    if (!(kw instanceof Spacebars.kw)) {
      kw = Spacebars.kw();
      // clone arguments into an actual array, then push
      // the empty kw object.
      args = Array.prototype.slice.call(arguments);
      args.push(kw);
    } else {
      // For each keyword arg, call it if it's a function
      const newHash = {};
      for (const k in kw.hash) {
        const v = kw.hash[k];
        newHash[k] = (typeof v === 'function' ? v() : v);
      }
      args[args.length - 1] = Spacebars.kw(newHash);
    }
  }

  return Spacebars.call.apply(null, args);
};

Spacebars.mustache = function (value/* , args */) {
  const result = Spacebars.mustacheImpl.apply(null, arguments);

  if (result instanceof Spacebars.SafeString) return HTML.Raw(result.toString());
  return (result == null || result === false) ? null : String(result);
};

Spacebars.attrMustache = function (value/* , args */) {
  const result = Spacebars.mustacheImpl.apply(null, arguments);

  if (result == null || result === '') {
    return null;
  } if (typeof result === 'object') {
    return result;
  } if (typeof result === 'string' && HTML.isValidAttributeName(result)) {
    const obj = {};
    obj[result] = '';
    return obj;
  }
  throw new Error("Expected valid attribute name, '', null, or object");
};

Spacebars.dataMustache = function (value/* , args */) {
  const result = Spacebars.mustacheImpl.apply(null, arguments);

  return result;
};

// Idempotently wrap in `HTML.Raw`.
//
// Called on the return value from `Spacebars.mustache` in case the
// template uses triple-stache (`{{{foo bar baz}}}`).
Spacebars.makeRaw = function (value) {
  if (value == null) // null or undefined
  { return null; }
  if (value instanceof HTML.Raw) return value;
  return HTML.Raw(value);
};

// If `value` is a function, evaluate its `args` (by calling them, if they
// are functions), and then call it on them. Otherwise, return `value`.
//
// If `value` is not a function and is not null, then this method will assert
// that there are no args. We check for null before asserting because a user
// may write a template like {{user.fullNameWithPrefix 'Mr.'}}, where the
// function will be null until data is ready.
Spacebars.call = function (value/* , args */) {
  if (typeof value === 'function') {
    // Evaluate arguments by calling them if they are functions.
    const newArgs = [];
    for (let i = 1; i < arguments.length; i++) {
      const arg = arguments[i];
      newArgs[i - 1] = (typeof arg === 'function' ? arg() : arg);
    }

    return value.apply(null, newArgs);
  }
  if (value != null && arguments.length > 1) {
    throw new Error(`Can't call non-function: ${value}`);
  }
  return value;
};

// Call this as `Spacebars.kw({ ... })`.  The return value
// is `instanceof Spacebars.kw`.
Spacebars.kw = function (hash) {
  if (!(this instanceof Spacebars.kw))
  // called without new; call with new
  { return new Spacebars.kw(hash); }

  this.hash = hash || {};
};

// Call this as `Spacebars.SafeString("some HTML")`.  The return value
// is `instanceof Spacebars.SafeString` (and `instanceof Handlebars.SafeString).
Spacebars.SafeString = function (html) {
  if (!(this instanceof Spacebars.SafeString)) {
  // called without new; call with new
    return new Spacebars.SafeString(html);
  }
  return new Handlebars.SafeString(html);
};
Spacebars.SafeString.prototype = Handlebars.SafeString.prototype;

// `Spacebars.dot(foo, "bar", "baz")` performs a special kind
// of `foo.bar.baz` that allows safe indexing of `null` and
// indexing of functions (which calls the function).  If the
// result is a function, it is always a bound function (e.g.
// a wrapped version of `baz` that always uses `foo.bar` as
// `this`).
//
// In `Spacebars.dot(foo, "bar")`, `foo` is assumed to be either
// a non-function value or a "fully-bound" function wrapping a value,
// where fully-bound means it takes no arguments and ignores `this`.
//
// `Spacebars.dot(foo, "bar")` performs the following steps:
//
// * If `foo` is falsy, return `foo`.
//
// * If `foo` is a function, call it (set `foo` to `foo()`).
//
// * If `foo` is falsy now, return `foo`.
//
// * Return `foo.bar`, binding it to `foo` if it's a function.
Spacebars.dot = function (value, id1/* , id2, ... */) {
  if (arguments.length > 2) {
    // Note: doing this recursively is probably less efficient than
    // doing it in an iterative loop.
    const argsForRecurse = [];
    argsForRecurse.push(Spacebars.dot(value, id1));
    argsForRecurse.push.apply(argsForRecurse,
      Array.prototype.slice.call(arguments, 2));
    return Spacebars.dot.apply(null, argsForRecurse);
  }

  if (typeof value === 'function') { value = value(); }

  if (!value) { return value; } // falsy, don't index, pass through

  const result = value[id1];
  if (typeof result !== 'function') { return result; }
  // `value[id1]` (or `value()[id1]`) is a function.
  // Bind it so that when called, `value` will be placed in `this`.
  return function (/* arguments */) {
    return result.apply(value, arguments);
  };
};

// Spacebars.With implements the conditional logic of rendering
// the `{{else}}` block if the argument is falsy.  It combines
// a Blast.If with a Blast.With (the latter only in the truthy
// case, since the else block is evaluated without entering
// a new data context).
Spacebars.With = function (argFunc, contentFunc, elseFunc) {
  const argVar = new Blast.ReactiveVar();
  const view = Blast.View('Spacebars_with', () => Blast.If(() => argVar.get(),
    () => Blast.With(() => argVar.get(), contentFunc),
    elseFunc));
  view.onViewCreated(function () {
    this.autorun(() => {
      argVar.set(argFunc());

      // This is a hack so that autoruns inside the body
      // of the #with get stopped sooner.  It reaches inside
      // our ReactiveVar to access its dep.

      Tracker.onInvalidate(() => {
        argVar.dep.changed();
      });

      // Take the case of `{{#with A}}{{B}}{{/with}}`.  The goal
      // is to not re-render `B` if `A` changes to become falsy
      // and `B` is simultaneously invalidated.
      //
      // A series of autoruns are involved:
      //
      // 1. This autorun (argument to Spacebars.With)
      // 2. Argument to Blast.If
      // 3. Blast.If view re-render
      // 4. Argument to Blast.With
      // 5. The template tag `{{B}}`
      //
      // When (3) is invalidated, it immediately stops (4) and (5)
      // because of a Tracker.onInvalidate built into materializeView.
      // (When a View's render method is invalidated, it immediately
      // tears down all the subviews, via a Tracker.onInvalidate much
      // like this one.
      //
      // Suppose `A` changes to become falsy, and `B` changes at the
      // same time (i.e. without an intervening flush).
      // Without the code above, this happens:
      //
      // - (1) and (5) are invalidated.
      // - (1) runs, invalidating (2) and (4).
      // - (5) runs.
      // - (2) runs, invalidating (3), stopping (4) and (5).
      //
      // With the code above:
      //
      // - (1) and (5) are invalidated, invalidating (2) and (4).
      // - (1) runs.
      // - (2) runs, invalidating (3), stopping (4) and (5).
      //
      // If the re-run of (5) is originally enqueued before (1), all
      // bets are off, but typically that doesn't seem to be the
      // case.  Anyway, doing this is always better than not doing it,
      // because it might save a bunch of DOM from being updated
      // needlessly.
    });
  });

  return view;
};
