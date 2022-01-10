import has from 'lodash.has';
import { HTML } from '@blastjs/htmljs';
import { Tracker } from '@blastjs/tracker';
import { Blast } from './preamble';

const ElementAttributesUpdater = function (elem) {
  this.elem = elem;
  this.handlers = {};
};

// Update attributes on `elem` to the dictionary `attrs`, whose
// values are strings.
ElementAttributesUpdater.prototype.update = function (newAttrs) {
  const { elem } = this;
  const { handlers } = this;

  for (var k in handlers) {
    if (!has(newAttrs, k)) {
      // remove attributes (and handlers) for attribute names
      // that don't exist as keys of `newAttrs` and so won't
      // be visited when traversing it.  (Attributes that
      // exist in the `newAttrs` object but are `null`
      // are handled later.)
      var handler = handlers[k];
      var oldValue = handler.value;
      handler.value = null;
      handler.update(elem, oldValue, null);
      delete handlers[k];
    }
  }

  for (var k in newAttrs) {
    var handler = null;
    var oldValue = null;
    const value = newAttrs[k];
    if (!has(handlers, k)) {
      if (value !== null) {
        // make new handler
        handler = Blast._makeAttributeHandler(elem, k, value);
        handlers[k] = handler;
      }
    } else {
      handler = handlers[k];
      oldValue = handler.value;
    }
    if (oldValue !== value) {
      handler.value = value;
      handler.update(elem, oldValue, value);
      if (value === null) { delete handlers[k]; }
    }
  }
};

const materializeDOMInner = function (htmljs, intoArray, parentView, workStack) {
  if (htmljs == null) {
    // null or undefined
    return;
  }

  switch (typeof htmljs) {
    case 'string': case 'boolean': case 'number':
      intoArray.push(document.createTextNode(String(htmljs)));
      return;
    case 'object':
      if (htmljs.htmljsType) {
        switch (htmljs.htmljsType) {
          case HTML.Tag.htmljsType:
            intoArray.push(materializeTag(htmljs, parentView, workStack));
            return;
          case HTML.CharRef.htmljsType:
            intoArray.push(document.createTextNode(htmljs.str));
            return;
          case HTML.Comment.htmljsType:
            intoArray.push(document.createComment(htmljs.sanitizedValue));
            return;
          case HTML.Raw.htmljsType:
            // Get an array of DOM nodes by using the browser's HTML parser
            // (like innerHTML).
            var nodes = Blast._DOMBackend.parseHTML(htmljs.value);
            for (var i = 0; i < nodes.length; i++) { intoArray.push(nodes[i]); }
            return;
        }
      } else if (HTML.isArray(htmljs)) {
        for (var i = htmljs.length - 1; i >= 0; i--) {
          workStack.push(Blast._bind(
            Blast._materializeDOM,
            null,
            htmljs[i],
            intoArray,
            parentView,
            workStack,
          ));
        }
        return;
      } else {
        if (htmljs instanceof Blast.Template) {
          htmljs = htmljs.constructView();
        // fall through to Blast.View case below
        }
        if (htmljs instanceof Blast.View) {
          Blast._materializeView(htmljs, parentView, workStack, intoArray);
          return;
        }
      }
  }

  throw new Error(`Unexpected object in htmljs: ${htmljs}`);
};

// Turns HTMLjs into DOM nodes and DOMRanges.
//
// - `htmljs`: the value to materialize, which may be any of the htmljs
//   types (Tag, CharRef, Comment, Raw, array, string, boolean, number,
//   null, or undefined) or a View or Template (which will be used to
//   construct a View).
// - `intoArray`: the array of DOM nodes and DOMRanges to push the output
//   into (required)
// - `parentView`: the View we are materializing content for (optional)
// - `_existingWorkStack`: optional argument, only used for recursive
//   calls when there is some other _materializeDOM on the call stack.
//   If _materializeDOM called your function and passed in a workStack,
//   pass it back when you call _materializeDOM (such as from a workStack
//   task).
//
// Returns `intoArray`, which is especially useful if you pass in `[]`.
Blast._materializeDOM = function (
  htmljs,
  intoArray,
  parentView,
  _existingWorkStack,
) {
  // In order to use fewer stack frames, materializeDOMInner can push
  // tasks onto `workStack`, and they will be popped off
  // and run, last first, after materializeDOMInner returns.  The
  // reason we use a stack instead of a queue is so that we recurse
  // depth-first, doing newer tasks first.
  const workStack = (_existingWorkStack || []);
  materializeDOMInner(htmljs, intoArray, parentView, workStack);

  if (!_existingWorkStack) {
    // We created the work stack, so we are responsible for finishing
    // the work.  Call each "task" function, starting with the top
    // of the stack.
    while (workStack.length) {
      // Note that running task() may push new items onto workStack.
      const task = workStack.pop();
      task();
    }
  }

  return intoArray;
};

const isSVGAnchor = function (node) {
  // We generally aren't able to detect SVG <a> elements because
  // if "A" were in our list of known svg element names, then all
  // <a> nodes would be created using
  // `document.createElementNS`. But in the special case of <a
  // xlink:href="...">, we can at least detect that attribute and
  // create an SVG <a> tag in that case.
  //
  // However, we still have a general problem of knowing when to
  // use document.createElementNS and when to use
  // document.createElement; for example, font tags will always
  // be created as SVG elements which can cause other
  // problems. #1977
  return (node.tagName === 'a'
          && node.attrs
          && node.attrs['xlink:href'] !== undefined);
};

var materializeTag = function (tag, parentView, workStack) {
  const { tagName } = tag;
  let elem;
  if ((HTML.isKnownSVGElement(tagName) || isSVGAnchor(tag))
      && document.createElementNS) {
    // inline SVG
    elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  } else {
    // normal elements
    elem = document.createElement(tagName);
  }

  let rawAttrs = tag.attrs;
  let { children } = tag;
  if (tagName === 'textarea' && tag.children.length
      && !(rawAttrs && ('value' in rawAttrs))) {
    // Provide very limited support for TEXTAREA tags with children
    // rather than a "value" attribute.
    // Reactivity in the form of Views nested in the tag's children
    // won't work.  Compilers should compile textarea contents into
    // the "value" attribute of the tag, wrapped in a function if there
    // is reactivity.
    if (typeof rawAttrs === 'function'
        || HTML.isArray(rawAttrs)) {
      throw new Error("Can't have reactive children of TEXTAREA node; "
                      + "use the 'value' attribute instead.");
    }
    rawAttrs = { ...rawAttrs || null };
    rawAttrs.value = Blast._expand(children, parentView);
    children = [];
  }

  if (rawAttrs) {
    const attrUpdater = new ElementAttributesUpdater(elem);
    const updateAttributes = function () {
      const expandedAttrs = Blast._expandAttributes(rawAttrs, parentView);
      const flattenedAttrs = HTML.flattenAttributes(expandedAttrs);
      const stringAttrs = {};
      for (const attrName in flattenedAttrs) {
        // map `null`, `undefined`, and `false` to null, which is important
        // so that attributes with nully values are considered absent.
        // stringify anything else (e.g. strings, booleans, numbers including 0).
        if (flattenedAttrs[attrName] == null || flattenedAttrs[attrName] === false) { stringAttrs[attrName] = null; } else {
          stringAttrs[attrName] = Blast._toText(
            flattenedAttrs[attrName],
            parentView,
            HTML.TEXTMODE.STRING,
          );
        }
      }
      attrUpdater.update(stringAttrs);
    };
    let updaterComputation;
    if (parentView) {
      updaterComputation = parentView.autorun(updateAttributes, undefined, 'updater');
    } else {
      updaterComputation = Tracker.nonreactive(() => Tracker.autorun(() => {
        Tracker._withCurrentView(parentView, updateAttributes);
      }));
    }
    Blast._DOMBackend.Teardown.onElementTeardown(elem, () => {
      updaterComputation.stop();
    });
  }

  if (children.length) {
    const childNodesAndRanges = [];
    // push this function first so that it's done last
    workStack.push(() => {
      for (let i = 0; i < childNodesAndRanges.length; i++) {
        const x = childNodesAndRanges[i];
        if (x instanceof Blast._DOMRange) { x.attach(elem); } else { elem.appendChild(x); }
      }
    });
    // now push the task that calculates childNodesAndRanges
    workStack.push(Blast._bind(
      Blast._materializeDOM,
      null,
      children,
      childNodesAndRanges,
      parentView,
      workStack,
    ));
  }

  return elem;
};
