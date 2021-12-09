import $jq from 'jquery';
import { Blast } from './preamble';

const DOMBackend = {};
Blast._DOMBackend = DOMBackend;

if (!$jq) { throw new Error('jQuery not found'); }

DOMBackend._$jq = $jq;

DOMBackend.parseHTML = function (html) {
  // Return an array of nodes.
  //
  // jQuery does fancy stuff like creating an appropriate
  // container element and setting innerHTML on it, as well
  // as working around various IE quirks.
  return $jq.parseHTML(html) || [];
};

DOMBackend.Events = {
  // `selector` is non-null.  `type` is one type (but
  // may be in backend-specific form, e.g. have namespaces).
  // Order fired must be order bound.
  delegateEvents(elem, type, selector, handler) {
    $jq(elem).on(type, selector, handler);
  },

  undelegateEvents(elem, type, handler) {
    $jq(elem).off(type, '**', handler);
  },

  bindEventCapturer(elem, type, selector, handler) {
    const $elem = $jq(elem);

    const wrapper = function (event) {
      event = $jq.event.fix(event);
      event.currentTarget = event.target;

      // Note: It might improve jQuery interop if we called into jQuery
      // here somehow.  Since we don't use jQuery to dispatch the event,
      // we don't fire any of jQuery's event hooks or anything.  However,
      // since jQuery can't bind capturing handlers, it's not clear
      // where we would hook in.  Internal jQuery functions like `dispatch`
      // are too high-level.
      const $target = $jq(event.currentTarget);
      if ($target.is($elem.find(selector))) handler.call(elem, event);
    };

    handler._meteorui_wrapper = wrapper;

    type = DOMBackend.Events.parseEventType(type);
    // add *capturing* event listener
    elem.addEventListener(type, wrapper, true);
  },

  unbindEventCapturer(elem, type, handler) {
    type = DOMBackend.Events.parseEventType(type);
    elem.removeEventListener(type, handler._meteorui_wrapper, true);
  },

  parseEventType(type) {
    // strip off namespaces
    const dotLoc = type.indexOf('.');
    if (dotLoc >= 0) return type.slice(0, dotLoc);
    return type;
  },
};

/// // Removal detection and interoperability.

// For an explanation of this technique, see:
// http://bugs.jquery.com/ticket/12213#comment:23 .
//
// In short, an element is considered "removed" when jQuery
// cleans up its *private* userdata on the element,
// which we can detect using a custom event with a teardown
// hook.

const NOOP = function () {};

// Circular doubly-linked list
const TeardownCallback = function (func) {
  this.next = this;
  this.prev = this;
  this.func = func;
};

// Insert newElt before oldElt in the circular list
TeardownCallback.prototype.linkBefore = function (oldElt) {
  this.prev = oldElt.prev;
  this.next = oldElt;
  oldElt.prev.next = this;
  oldElt.prev = this;
};

TeardownCallback.prototype.unlink = function () {
  this.prev.next = this.next;
  this.next.prev = this.prev;
};

TeardownCallback.prototype.go = function () {
  const { func } = this;
  func && func();
};

TeardownCallback.prototype.stop = TeardownCallback.prototype.unlink;

DOMBackend.Teardown = {
  _JQUERY_EVENT_NAME: 'blast_teardown_watcher',
  _CB_PROP: '$blast_teardown_callbacks',
  // Registers a callback function to be called when the given element or
  // one of its ancestors is removed from the DOM via the backend library.
  // The callback function is called at most once, and it receives the element
  // in question as an argument.
  onElementTeardown(elem, func) {
    const elt = new TeardownCallback(func);

    const propName = DOMBackend.Teardown._CB_PROP;
    if (!elem[propName]) {
      // create an empty node that is never unlinked
      elem[propName] = new TeardownCallback();

      // Set up the event, only the first time.
      $jq(elem).on(DOMBackend.Teardown._JQUERY_EVENT_NAME, NOOP);
    }

    elt.linkBefore(elem[propName]);

    return elt; // so caller can call stop()
  },
  // Recursively call all teardown hooks, in the backend and registered
  // through DOMBackend.onElementTeardown.
  tearDownElement(elem) {
    const elems = [];
    // Array.prototype.slice.call doesn't work when given a NodeList in
    // IE8 ("JScript object expected").
    const nodeList = elem.getElementsByTagName('*');
    for (let i = 0; i < nodeList.length; i++) {
      elems.push(nodeList[i]);
    }
    elems.push(elem);
    $jq.cleanData(elems);
  },
};

if ($jq.event) {
  $jq.event.special[DOMBackend.Teardown._JQUERY_EVENT_NAME] = {
    setup() {
    // This "setup" callback is important even though it is empty!
    // Without it, jQuery will call addEventListener, which is a
    // performance hit, especially with Chrome's async stack trace
    // feature enabled.
    },
    teardown() {
      const elem = this;
      const callbacks = elem[DOMBackend.Teardown._CB_PROP];
      if (callbacks) {
        let elt = callbacks.next;
        while (elt !== callbacks) {
          elt.go();
          elt = elt.next;
        }
        callbacks.go();

        elem[DOMBackend.Teardown._CB_PROP] = null;
      }
    },
  };

  // Must use jQuery semantics for `context`, not
  // querySelectorAll's.  In other words, all the parts
  // of `selector` must be found under `context`.
  DOMBackend.findBySelector = function (selector, context) {
    return $jq(selector, context);
  };
}
