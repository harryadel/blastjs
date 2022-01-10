import { HTML } from '@blastjs/htmljs';
import { Tracker } from '@blastjs/tracker';
import { Blast } from './preamble';

/// [new] Blast.View([name], renderMethod)
///
/// Blast.View is the building block of reactive DOM.  Views have
/// the following features:
///
/// * lifecycle callbacks - Views are created, rendered, and destroyed,
///   and callbacks can be registered to fire when these things happen.
///
/// * parent pointer - A View points to its parentView, which is the
///   View that caused it to be rendered.  These pointers form a
///   hierarchy or tree of Views.
///
/// * render() method - A View's render() method specifies the DOM
///   (or HTML) content of the View.  If the method establishes
///   reactive dependencies, it may be re-run.
///
/// * a DOMRange - If a View is rendered to DOM, its position and
///   extent in the DOM are tracked using a DOMRange object.
///
/// When a View is constructed by calling Blast.View, the View is
/// not yet considered "created."  It doesn't have a parentView yet,
/// and no logic has been run to initialize the View.  All real
/// work is deferred until at least creation time, when the onViewCreated
/// callbacks are fired, which happens when the View is "used" in
/// some way that requires it to be rendered.
///
/// ...more lifecycle stuff
///
/// `name` is an optional string tag identifying the View.  The only
/// time it's used is when looking in the View tree for a View of a
/// particular name; for example, data contexts are stored on Views
/// of name "with".  Names are also useful when debugging, so in
/// general it's good for functions that create Views to set the name.
/// Views associated with templates have names of the form "Template.foo".

/**
 * @class
 * @summary Constructor for a View, which represents a reactive region of DOM.
 * @locus Client
 * @param {String} [name] Optional.  A name for this type of View.  See [`view.name`](#view_name).
 * @param {Function} renderFunction A function that returns [*renderable content*](#Renderable-Content).  In this function, `this` is bound to the View.
 */
Blast.View = function (name, render) {
  if (!(this instanceof Blast.View))
  // called without `new`
  { return new Blast.View(name, render); }

  if (typeof name === 'function') {
    // omitted "name" argument
    render = name;
    name = '';
  }
  this.name = name;
  this._render = render;

  this._callbacks = {
    created: null,
    rendered: null,
    destroyed: null,
  };

  // Setting all properties here is good for readability,
  // and also may help Chrome optimize the code by keeping
  // the View object from changing shape too much.
  this.isCreated = false;
  this._isCreatedForExpansion = false;
  this.isRendered = false;
  this._isAttached = false;
  this.isDestroyed = false;
  this._isInRender = false;
  this.parentView = null;
  this._domrange = null;
  // This flag is normally set to false except for the cases when view's parent
  // was generated as part of expanding some syntactic sugar expressions or
  // methods.
  // Ex.: Blast.renderWithData is an equivalent to creating a view with regular
  // Blast.render and wrapping it into {{#with data}}{{/with}} view. Since the
  // users don't know anything about these generated parent views, Blast needs
  // this information to be available on views to make smarter decisions. For
  // example: removing the generated parent view with the view on Blast.remove.
  this._hasGeneratedParent = false;
  // Bindings accessible to children views (via view.lookup('name')) within the
  // closest template view.
  this._scopeBindings = {};

  this.renderCount = 0;
};

Blast.View.prototype._render = function () { return null; };

Blast.View.prototype.onViewCreated = function (cb) {
  this._callbacks.created = this._callbacks.created || [];
  this._callbacks.created.push(cb);
};

Blast.View.prototype._onViewRendered = function (cb) {
  this._callbacks.rendered = this._callbacks.rendered || [];
  this._callbacks.rendered.push(cb);
};

Blast.View.prototype.onViewReady = function (cb) {
  const self = this;
  const fire = function () {
    Tracker.afterFlush(() => {
      if (!self.isDestroyed) {
        Blast._withCurrentView(self, () => {
          cb.call(self);
        });
      }
    });
  };
  self._onViewRendered(() => {
    if (self.isDestroyed) { return; }
    if (!self._domrange.attached) { self._domrange.onAttached(fire); } else { fire(); }
  });
};

Blast.View.prototype.onViewDestroyed = function (cb) {
  this._callbacks.destroyed = this._callbacks.destroyed || [];
  this._callbacks.destroyed.push(cb);
};
Blast.View.prototype.removeViewDestroyedListener = function (cb) {
  const { destroyed } = this._callbacks;
  if (!destroyed) { return; }
  const index = destroyed.lastIndexOf(cb);
  if (index !== -1) {
    // XXX You'd think the right thing to do would be splice, but _fireCallbacks
    // gets sad if you remove callbacks while iterating over the list.  Should
    // change this to use callback-hook or EventEmitter or something else that
    // properly supports removal.
    destroyed[index] = null;
  }
};

/// View#autorun(func)
///
/// Sets up a Tracker autorun that is "scoped" to this View in two
/// important ways: 1) Blast.currentView is automatically set
/// on every re-run, and 2) the autorun is stopped when the
/// View is destroyed.  As with Tracker.autorun, the first run of
/// the function is immediate, and a Computation object that can
/// be used to stop the autorun is returned.
///
/// View#autorun is meant to be called from View callbacks like
/// onViewCreated, or from outside the rendering process.  It may not
/// be called before the onViewCreated callbacks are fired (too early),
/// or from a render() method (too confusing).
///
/// Typically, autoruns that update the state
/// of the View (as in Blast.With) should be started from an onViewCreated
/// callback.  Autoruns that update the DOM should be started
/// from either onViewCreated (guarded against the absence of
/// view._domrange), or onViewReady.
Blast.View.prototype.autorun = function (f, _inViewScope, displayName) {
  const self = this;

  // The restrictions on when View#autorun can be called are in order
  // to avoid bad patterns, like creating a Blast.View and immediately
  // calling autorun on it.  A freshly created View is not ready to
  // have logic run on it; it doesn't have a parentView, for example.
  // It's when the View is materialized or expanded that the onViewCreated
  // handlers are fired and the View starts up.
  //
  // Letting the render() method call `this.autorun()` is problematic
  // because of re-render.  The best we can do is to stop the old
  // autorun and start a new one for each render, but that's a pattern
  // we try to avoid internally because it leads to helpers being
  // called extra times, in the case where the autorun causes the
  // view to re-render (and thus the autorun to be torn down and a
  // new one established).
  //
  // We could lift these restrictions in various ways.  One interesting
  // idea is to allow you to call `view.autorun` after instantiating
  // `view`, and automatically wrap it in `view.onViewCreated`, deferring
  // the autorun so that it starts at an appropriate time.  However,
  // then we can't return the Computation object to the caller, because
  // it doesn't exist yet.
  if (!self.isCreated) {
    throw new Error('View#autorun must be called from the created callback at the earliest');
  }
  if (this._isInRender) {
    throw new Error("Can't call View#autorun from inside render(); try calling it from the created or rendered callback");
  }

  const templateInstanceFunc = Blast.Template._currentTemplateInstanceFunc;

  const func = function viewAutorun(c) {
    return Blast._withCurrentView(_inViewScope || self, () => Blast.Template._withTemplateInstanceFunc(templateInstanceFunc, () => f.call(self, c)));
  };

  // Give the autorun function a better name for debugging and profiling.
  // The `displayName` property is not part of the spec but browsers like Chrome
  // and Firefox prefer it in debuggers over the name function was declared by.
  func.displayName = `${self.name || 'anonymous'}:${displayName || 'anonymous'}`;
  const comp = Tracker.autorun(func);

  const stopComputation = function () { comp.stop(); };
  self.onViewDestroyed(stopComputation);
  comp.onStop(() => {
    self.removeViewDestroyedListener(stopComputation);
  });

  return comp;
};

Blast.View.prototype._errorIfShouldntCallSubscribe = function () {
  const self = this;

  if (!self.isCreated) {
    throw new Error('View#subscribe must be called from the created callback at the earliest');
  }
  if (self._isInRender) {
    throw new Error("Can't call View#subscribe from inside render(); try calling it from the created or rendered callback");
  }
  if (self.isDestroyed) {
    throw new Error("Can't call View#subscribe from inside the destroyed callback, try calling it inside created or rendered.");
  }
};

/**
 * Just like Blast.View#autorun, but with Meteor.subscribe instead of
 * Tracker.autorun. Stop the subscription when the view is destroyed.
 * @return {SubscriptionHandle} A handle to the subscription so that you can
 * see if it is ready, or stop it manually
 */
Blast.View.prototype.subscribe = function (args, options) {
  const self = this;
  options = options || {};

  self._errorIfShouldntCallSubscribe();

  let subHandle;
  if (options.connection) {
    subHandle = options.connection.subscribe.apply(options.connection, args);
  } else {
    subHandle = Meteor.subscribe.apply(Meteor, args);
  }

  self.onViewDestroyed(() => {
    subHandle.stop();
  });

  return subHandle;
};

Blast.View.prototype.firstNode = function () {
  if (!this._isAttached) { throw new Error('View must be attached before accessing its DOM'); }

  return this._domrange.firstNode();
};

Blast.View.prototype.lastNode = function () {
  if (!this._isAttached) { throw new Error('View must be attached before accessing its DOM'); }

  return this._domrange.lastNode();
};

Blast._fireCallbacks = function (view, which) {
  Blast._withCurrentView(view, () => {
    Tracker.nonreactive(() => {
      const cbs = view._callbacks[which];
      for (let i = 0, N = (cbs && cbs.length); i < N; i++) { cbs[i] && cbs[i].call(view); }
    });
  });
};

Blast._createView = function (view, parentView, forExpansion) {
  if (view.isCreated) { throw new Error("Can't render the same View twice"); }

  view.parentView = (parentView || null);
  view.isCreated = true;
  if (forExpansion) { view._isCreatedForExpansion = true; }

  Blast._fireCallbacks(view, 'created');
};

const doFirstRender = function (view, initialContent) {
  const domrange = new Blast._DOMRange(initialContent);
  view._domrange = domrange;
  domrange.view = view;
  view.isRendered = true;
  Blast._fireCallbacks(view, 'rendered');

  let teardownHook = null;

  domrange.onAttached((range, element) => {
    view._isAttached = true;

    teardownHook = Blast._DOMBackend.Teardown.onElementTeardown(element, () => {
      Blast._destroyView(view, true /* _skipNodes */);
    });
  });

  // tear down the teardown hook
  view.onViewDestroyed(() => {
    teardownHook && teardownHook.stop();
    teardownHook = null;
  });

  return domrange;
};

// Take an uncreated View `view` and create and render it to DOM,
// setting up the autorun that updates the View.  Returns a new
// DOMRange, which has been associated with the View.
//
// The private arguments `_workStack` and `_intoArray` are passed in
// by Blast._materializeDOM and are only present for recursive calls
// (when there is some other _materializeView on the stack).  If
// provided, then we avoid the mutual recursion of calling back into
// Blast._materializeDOM so that deep View hierarchies don't blow the
// stack.  Instead, we push tasks onto workStack for the initial
// rendering and subsequent setup of the View, and they are done after
// we return.  When there is a _workStack, we do not return the new
// DOMRange, but instead push it into _intoArray from a _workStack
// task.
Blast._materializeView = function (view, parentView, _workStack, _intoArray) {
  Blast._createView(view, parentView);

  let domrange;
  let lastHtmljs;
  // We don't expect to be called in a Computation, but just in case,
  // wrap in Tracker.nonreactive.
  Tracker.nonreactive(() => {
    view.autorun((c) => {
      // `view.autorun` sets the current view.
      view.renderCount++;
      view._isInRender = true;
      // Any dependencies that should invalidate this Computation come
      // from this line:
      const htmljs = view._render();
      view._isInRender = false;

      if (!c.firstRun && !Blast._isContentEqual(lastHtmljs, htmljs)) {
        Tracker.nonreactive(() => {
          // re-render
          const rangesAndNodes = Blast._materializeDOM(htmljs, [], view);
          domrange.setMembers(rangesAndNodes);
          Blast._fireCallbacks(view, 'rendered');
        });
      }
      lastHtmljs = htmljs;

      // Causes any nested views to stop immediately, not when we call
      // `setMembers` the next time around the autorun.  Otherwise,
      // helpers in the DOM tree to be replaced might be scheduled
      // to re-run before we have a chance to stop them.
      Tracker.onInvalidate(() => {
        if (domrange) {
          domrange.destroyMembers();
        }
      });
    }, undefined, 'materialize');

    // first render.  lastHtmljs is the first htmljs.
    let initialContents;
    if (!_workStack) {
      initialContents = Blast._materializeDOM(lastHtmljs, [], view);
      domrange = doFirstRender(view, initialContents);
      initialContents = null; // help GC because we close over this scope a lot
    } else {
      // We're being called from Blast._materializeDOM, so to avoid
      // recursion and save stack space, provide a description of the
      // work to be done instead of doing it.  Tasks pushed onto
      // _workStack will be done in LIFO order after we return.
      // The work will still be done within a Tracker.nonreactive,
      // because it will be done by some call to Blast._materializeDOM
      // (which is always called in a Tracker.nonreactive).
      initialContents = [];
      // push this function first so that it happens last
      _workStack.push(() => {
        domrange = doFirstRender(view, initialContents);
        initialContents = null; // help GC because of all the closures here
        _intoArray.push(domrange);
      });
      // now push the task that calculates initialContents
      _workStack.push(Blast._bind(
        Blast._materializeDOM,
        null,
        lastHtmljs,
        initialContents,
        view,
        _workStack,
      ));
    }
  });

  if (!_workStack) {
    return domrange;
  }
  return null;
};

// Expands a View to HTMLjs, calling `render` recursively on all
// Views and evaluating any dynamic attributes.  Calls the `created`
// callback, but not the `materialized` or `rendered` callbacks.
// Destroys the view immediately, unless called in a Tracker Computation,
// in which case the view will be destroyed when the Computation is
// invalidated.  If called in a Tracker Computation, the result is a
// reactive string; that is, the Computation will be invalidated
// if any changes are made to the view or subviews that might affect
// the HTML.
Blast._expandView = function (view, parentView) {
  Blast._createView(view, parentView, true /* forExpansion */);

  view._isInRender = true;
  const htmljs = Blast._withCurrentView(view, () => view._render());
  view._isInRender = false;

  const result = Blast._expand(htmljs, view);

  if (Tracker.active) {
    Tracker.onInvalidate(() => {
      Blast._destroyView(view);
    });
  } else {
    Blast._destroyView(view);
  }

  return result;
};

// Options: `parentView`
Blast._HTMLJSExpander = HTML.TransformingVisitor.extend();
Blast._HTMLJSExpander.def({
  visitObject(x) {
    if (x instanceof Blast.Template) x = x.constructView();
    if (x instanceof Blast.View) return Blast._expandView(x, this.parentView);

    // this will throw an error; other objects are not allowed!
    return HTML.TransformingVisitor.prototype.visitObject.call(this, x);
  },
  visitAttributes(attrs) {
    // expand dynamic attributes
    if (typeof attrs === 'function') attrs = Blast._withCurrentView(this.parentView, attrs);

    // call super (e.g. for case where `attrs` is an array)
    return HTML.TransformingVisitor.prototype.visitAttributes.call(this, attrs);
  },
  visitAttribute(name, value, tag) {
    // expand attribute values that are functions.  Any attribute value
    // that contains Views must be wrapped in a function.
    if (typeof value === 'function') value = Blast._withCurrentView(this.parentView, value);

    return HTML.TransformingVisitor.prototype.visitAttribute.call(this, name, value, tag);
  },
});

// Return Blast.currentView, but only if it is being rendered
// (i.e. we are in its render() method).
const currentViewIfRendering = function () {
  const view = Blast.currentView;
  return (view && view._isInRender) ? view : null;
};

Blast._expand = function (htmljs, parentView) {
  parentView = parentView || currentViewIfRendering();
  return (new Blast._HTMLJSExpander(
    { parentView },
  )).visit(htmljs);
};

Blast._expandAttributes = function (attrs, parentView) {
  parentView = parentView || currentViewIfRendering();
  return (new Blast._HTMLJSExpander(
    { parentView },
  )).visitAttributes(attrs);
};

Blast._destroyView = function (view, _skipNodes) {
  if (view.isDestroyed) { return; }
  view.isDestroyed = true;

  Blast._fireCallbacks(view, 'destroyed');

  // Destroy views and elements recursively.  If _skipNodes,
  // only recurse up to views, not elements, for the case where
  // the backend (jQuery) is recursing over the elements already.

  if (view._domrange) { view._domrange.destroyMembers(_skipNodes); }
};

Blast._destroyNode = function (node) {
  if (node.nodeType === 1) { Blast._DOMBackend.Teardown.tearDownElement(node); }
};

// Are the HTMLjs entities `a` and `b` the same?  We could be
// more elaborate here but the point is to catch the most basic
// cases.
Blast._isContentEqual = function (a, b) {
  if (a instanceof HTML.Raw) {
    return (b instanceof HTML.Raw) && (a.value === b.value);
  } if (a == null) {
    return (b == null);
  }
  return (a === b)
      && ((typeof a === 'number') || (typeof a === 'boolean')
       || (typeof a === 'string'));
};

/**
 * @summary The View corresponding to the current template helper, event handler, callback, or autorun.  If there isn't one, `null`.
 * @locus Client
 * @type {Blast.View}
 */
Blast.currentView = null;

Blast._withCurrentView = function (view, func) {
  const oldView = Blast.currentView;
  try {
    Blast.currentView = view;
    return func();
  } finally {
    Blast.currentView = oldView;
  }
};

// Blast.render publicly takes a View or a Template.
// Privately, it takes any HTMLJS (extended with Views and Templates)
// except null or undefined, or a function that returns any extended
// HTMLJS.
const checkRenderContent = function (content) {
  if (content === null) { throw new Error("Can't render null"); }
  if (typeof content === 'undefined') { throw new Error("Can't render undefined"); }

  if ((content instanceof Blast.View)
      || (content instanceof Blast.Template)
      || (typeof content === 'function')) { return; }

  try {
    // Throw if content doesn't look like HTMLJS at the top level
    // (i.e. verify that this is an HTML.Tag, or an array,
    // or a primitive, etc.)
    (new HTML.Visitor()).visit(content);
  } catch (e) {
    // Make error message suitable for public API
    throw new Error('Expected Template or View');
  }
};

// For Blast.render and Blast.toHTML, take content and
// wrap it in a View, unless it's a single View or
// Template already.
const contentAsView = function (content) {
  checkRenderContent(content);

  if (content instanceof Blast.Template) {
    return content.constructView();
  } if (content instanceof Blast.View) {
    return content;
  }
  let func = content;
  if (typeof func !== 'function') {
    func = function () {
      return content;
    };
  }
  return Blast.View('render', func);
};

// For Blast.renderWithData and Blast.toHTMLWithData, wrap content
// in a function, if necessary, so it can be a content arg to
// a Blast.With.
const contentAsFunc = function (content) {
  checkRenderContent(content);

  if (typeof content !== 'function') {
    return function () {
      return content;
    };
  }
  return content;
};

Blast.__rootViews = [];

/**
 * @summary Renders a template or View to DOM nodes and inserts it into the DOM, returning a rendered [View](#Blast-View) which can be passed to [`Blast.remove`](#Blast-remove).
 * @locus Client
 * @param {Template|Blast.View} templateOrView The template (e.g. `Template.myTemplate`) or View object to render.  If a template, a View object is [constructed](#template_constructview).  If a View, it must be an unrendered View, which becomes a rendered View and is returned.
 * @param {DOMNode} parentNode The node that will be the parent of the rendered template.  It must be an Element node.
 * @param {DOMNode} [nextNode] Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.
 * @param {Blast.View} [parentView] Optional. If provided, it will be set as the rendered View's [`parentView`](#view_parentview).
 */
Blast.render = function (content, parentElement, nextNode, parentView) {
  if (!parentElement) {
    Blast._warn('Blast.render without a parent element is deprecated. '
                + 'You must specify where to insert the rendered content.');
  }

  if (nextNode instanceof Blast.View) {
    // handle omitted nextNode
    parentView = nextNode;
    nextNode = null;
  }

  // parentElement must be a DOM node. in particular, can't be the
  // result of a call to `$`. Can't check if `parentElement instanceof
  // Node` since 'Node' is undefined in IE8.
  if (parentElement && typeof parentElement.nodeType !== 'number') { throw new Error("'parentElement' must be a DOM node"); }
  if (nextNode && typeof nextNode.nodeType !== 'number') // 'nextNode' is optional
  { throw new Error("'nextNode' must be a DOM node"); }

  parentView = parentView || currentViewIfRendering();

  const view = contentAsView(content);

  // TODO: this is only needed in development
  if (!parentView) {
    view.onViewCreated(() => {
      Blast.__rootViews.push(view);
    });

    view.onViewDestroyed(() => {
      const index = Blast.__rootViews.indexOf(view);
      if (index > -1) {
        Blast.__rootViews.splice(index, 1);
      }
    });
  }

  Blast._materializeView(view, parentView);
  if (parentElement) {
    view._domrange.attach(parentElement, nextNode);
  }

  return view;
};

Blast.insert = function (view, parentElement, nextNode) {
  Blast._warn('Blast.insert has been deprecated.  Specify where to insert the '
              + 'rendered content in the call to Blast.render.');

  if (!(view && (view._domrange instanceof Blast._DOMRange))) { throw new Error('Expected template rendered with Blast.render'); }

  view._domrange.attach(parentElement, nextNode);
};

/**
 * @summary Renders a template or View to DOM nodes with a data context.  Otherwise identical to `Blast.render`.
 * @locus Client
 * @param {Template|Blast.View} templateOrView The template (e.g. `Template.myTemplate`) or View object to render.
 * @param {Object|Function} data The data context to use, or a function returning a data context.  If a function is provided, it will be reactively re-run.
 * @param {DOMNode} parentNode The node that will be the parent of the rendered template.  It must be an Element node.
 * @param {DOMNode} [nextNode] Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.
 * @param {Blast.View} [parentView] Optional. If provided, it will be set as the rendered View's [`parentView`](#view_parentview).
 */
Blast.renderWithData = function (content, data, parentElement, nextNode, parentView) {
  // We defer the handling of optional arguments to Blast.render.  At this point,
  // `nextNode` may actually be `parentView`.
  return Blast.render(
    Blast._TemplateWith(data, contentAsFunc(content)),
    parentElement,

    nextNode,

    parentView,
  );
};

/**
 * @summary Removes a rendered View from the DOM, stopping all reactive updates and event listeners on it. Also destroys the Blast.Template instance associated with the view.
 * @locus Client
 * @param {Blast.View} renderedView The return value from `Blast.render` or `Blast.renderWithData`, or the `view` property of a Blast.Template instance. Calling `Blast.remove(Template.instance().view)` from within a template event handler will destroy the view as well as that template and trigger the template's `onDestroyed` handlers.
 */
Blast.remove = function (view) {
  if (!(view && (view._domrange instanceof Blast._DOMRange))) { throw new Error('Expected template rendered with Blast.render'); }

  while (view) {
    if (!view.isDestroyed) {
      const range = view._domrange;
      if (range.attached && !range.parentRange) { range.detach(); }
      range.destroy();
    }

    view = view._hasGeneratedParent && view.parentView;
  }
};

/**
 * @summary Renders a template or View to a string of HTML.
 * @locus Client
 * @param {Template|Blast.View} templateOrView The template (e.g. `Template.myTemplate`) or View object from which to generate HTML.
 */
Blast.toHTML = function (content, parentView) {
  parentView = parentView || currentViewIfRendering();

  return HTML.toHTML(Blast._expandView(contentAsView(content), parentView));
};

/**
 * @summary Renders a template or View to HTML with a data context.  Otherwise identical to `Blast.toHTML`.
 * @locus Client
 * @param {Template|Blast.View} templateOrView The template (e.g. `Template.myTemplate`) or View object from which to generate HTML.
 * @param {Object|Function} data The data context to use, or a function returning a data context.
 */
Blast.toHTMLWithData = function (content, data, parentView) {
  parentView = parentView || currentViewIfRendering();

  return HTML.toHTML(Blast._expandView(Blast._TemplateWith(data, contentAsFunc(content)), parentView));
};

Blast._toText = function (htmljs, parentView, textMode) {
  if (typeof htmljs === 'function') { throw new Error("Blast._toText doesn't take a function, just HTMLjs"); }

  if ((parentView != null) && !(parentView instanceof Blast.View)) {
    // omitted parentView argument
    textMode = parentView;
    parentView = null;
  }
  parentView = parentView || currentViewIfRendering();

  if (!textMode) { throw new Error('textMode required'); }
  if (!(textMode === HTML.TEXTMODE.STRING
         || textMode === HTML.TEXTMODE.RCDATA
         || textMode === HTML.TEXTMODE.ATTRIBUTE)) { throw new Error(`Unknown textMode: ${textMode}`); }

  return HTML.toText(Blast._expand(htmljs, parentView), textMode);
};

/**
 * @summary Returns the current data context, or the data context that was used when rendering a particular DOM element or View from a Meteor template.
 * @locus Client
 * @param {DOMElement|Blast.View} [elementOrView] Optional.  An element that was rendered by a Meteor, or a View.
 */
Blast.getData = function (elementOrView) {
  let theWith;

  if (!elementOrView) {
    theWith = Blast.getView('with');
  } else if (elementOrView instanceof Blast.View) {
    const view = elementOrView;
    theWith = (view.name === 'with' ? view
      : Blast.getView(view, 'with'));
  } else if (typeof elementOrView.nodeType === 'number') {
    if (elementOrView.nodeType !== 1) { throw new Error('Expected DOM element'); }
    theWith = Blast.getView(elementOrView, 'with');
  } else {
    throw new Error('Expected DOM element or View');
  }

  return theWith ? theWith.dataVar.get() : null;
};

// For back-compat
Blast.getElementData = function (element) {
  Blast._warn('Blast.getElementData has been deprecated.  Use '
              + 'Blast.getData(element) instead.');

  if (element.nodeType !== 1) { throw new Error('Expected DOM element'); }

  return Blast.getData(element);
};

// Both arguments are optional.

/**
 * @summary Gets either the current View, or the View enclosing the given DOM element.
 * @locus Client
 * @param {DOMElement} [element] Optional.  If specified, the View enclosing `element` is returned.
 */
Blast.getView = function (elementOrView, _viewName) {
  let viewName = _viewName;

  if ((typeof elementOrView) === 'string') {
    // omitted elementOrView; viewName present
    viewName = elementOrView;
    elementOrView = null;
  }

  // We could eventually shorten the code by folding the logic
  // from the other methods into this method.
  if (!elementOrView) {
    return Blast._getCurrentView(viewName);
  } if (elementOrView instanceof Blast.View) {
    return Blast._getParentView(elementOrView, viewName);
  } if (typeof elementOrView.nodeType === 'number') {
    return Blast._getElementView(elementOrView, viewName);
  }
  throw new Error('Expected DOM element or View');
};

// Gets the current view or its nearest ancestor of name
// `name`.
Blast._getCurrentView = function (name) {
  let view = Blast.currentView;
  // Better to fail in cases where it doesn't make sense
  // to use Blast._getCurrentView().  There will be a current
  // view anywhere it does.  You can check Blast.currentView
  // if you want to know whether there is one or not.
  if (!view) throw new Error('There is no current view');

  if (name) {
    while (view && view.name !== name) view = view.parentView;
    return view || null;
  }
  // Blast._getCurrentView() with no arguments just returns
  // Blast.currentView.
  return view;
};

Blast._getParentView = function (view, name) {
  let v = view.parentView;

  if (name) {
    while (v && v.name !== name) { v = v.parentView; }
  }

  return v || null;
};

Blast._getElementView = function (elem, name) {
  let range = Blast._DOMRange.forElement(elem);
  let view = null;
  while (range && !view) {
    view = (range.view || null);
    if (!view) {
      if (range.parentRange) range = range.parentRange;
      else range = Blast._DOMRange.forElement(range.parentElement);
    }
  }

  if (name) {
    while (view && view.name !== name) view = view.parentView;
    return view || null;
  }
  return view;
};

Blast._addEventMap = function (view, eventMap, thisInHandler) {
  thisInHandler = (thisInHandler || null);
  const handles = [];

  if (!view._domrange) { throw new Error('View must have a DOMRange'); }

  view._domrange.onAttached((range, element) => {
    Object.keys(eventMap).forEach((spec) => {
      const handler = eventMap[spec];
      const clauses = spec.split(/,\s+/);
      // iterate over clauses of spec, e.g. ['click .foo', 'click .bar']
      clauses.forEach((clause) => {
        const parts = clause.split(/\s+/);
        if (parts.length === 0) { return; }

        const newEvents = parts.shift();
        const selector = parts.join(' ');
        handles.push(Blast._EventSupport.listen(
          element,
          newEvents,
          selector,
          function (evt) {
            if (!range.containsElement(evt.currentTarget)) { return null; }
            const handlerThis = thisInHandler || this;
            const handlerArgs = arguments;
            return Blast._withCurrentView(view, () => handler.apply(handlerThis, handlerArgs));
          },
          range,
          (r) => r.parentRange,
        ));
      });
    });
  });

  view.onViewDestroyed(() => {
    handles.forEach((h) => {
      h.stop();
    });
    handles.length = 0;
  });
};
