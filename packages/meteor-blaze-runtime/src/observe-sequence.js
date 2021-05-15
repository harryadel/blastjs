const { Meteor } = require("meteor-blaze-common");
const EJSON = require("meteor-ejson");
const _ = require("underscore");
const MongoID = require("meteor-standalone-mongo-id");
const LocalCollection = {};
const OrderedDict = require("meteor-standalone-ordered-dict");
const DiffSequence = require("meteor-standalone-diff-sequence");

const Tracker = typeof Package !== "undefined" && Package.tracker ? Package.tracker.Tracker : require("meteor-standalone-tracker");
const ReactiveVar = typeof Package !== "undefined" && Package["reactive-var"] ? Package["reactive-var"].ReactiveVar : require("meteor-standalone-reactive-var");
function load(Meteor) {
  var seqChangedToEmpty ,seqChangedToArray ,seqChangedToCursor;
  var ObserveSequence;

  var Package = {minimongo: {LocalCollection: LocalCollection}, "diff-sequence" : {DiffSequence: DiffSequence}};

// ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are IdMaps
LocalCollection._diffQueryChanges = function (ordered, oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);
};

LocalCollection._diffQueryUnorderedChanges = function (oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);
};


LocalCollection._diffQueryOrderedChanges =
  function (oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);
};

LocalCollection._diffObjects = function (left, right, callbacks) {
  return DiffSequence.diffObjects(left, right, callbacks);
};
// Is this selector just shorthand for lookup by _id?
LocalCollection._selectorIsId = function (selector) {
  return (typeof selector === "string") ||
    (typeof selector === "number") ||
    selector instanceof MongoID.ObjectID;
};

// Is the selector just lookup by _id (shorthand or not)?
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {
  return LocalCollection._selectorIsId(selector) ||
    (selector && typeof selector === "object" &&
     selector._id && LocalCollection._selectorIsId(selector._id) &&
     _.size(selector) === 1);
};

// If this is a selector which explicitly constrains the match by ID to a finite
// number of documents, returns a list of their IDs.  Otherwise returns
// null. Note that the selector may have other restrictions so it may not even
// match those document!  We care about $in and $and since those are generated
// access-controlled update and remove.
LocalCollection._idsMatchedBySelector = function (selector) {
  // Is the selector just an ID?
  if (LocalCollection._selectorIsId(selector))
    return [selector];
  if (!selector)
    return null;

  // Do we have an _id clause?
  if (_.has(selector, '_id')) {
    // Is the _id clause just an ID?
    if (LocalCollection._selectorIsId(selector._id))
      return [selector._id];
    // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
    if (selector._id && selector._id.$in
        && _.isArray(selector._id.$in)
        && !_.isEmpty(selector._id.$in)
        && _.all(selector._id.$in, LocalCollection._selectorIsId)) {
      return selector._id.$in;
    }
    return null;
  }

  // If this is a top-level $and, and any of the clauses constrain their
  // documents, then the whole selector is constrained by any one clause's
  // constraint. (Well, by their intersection, but that seems unlikely.)
  if (selector.$and && _.isArray(selector.$and)) {
    for (var i = 0; i < selector.$and.length; ++i) {
      var subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);
      if (subIds)
        return subIds;
    }
  }

  return null;
};


var warn = function () {
  if (ObserveSequence._suppressWarnings) {
    ObserveSequence._suppressWarnings--;
  } else {
    if (typeof console !== 'undefined' && console.warn)
      console.warn.apply(console, arguments);

    ObserveSequence._loggedWarnings++;
  }
};

var idStringify = MongoID.idStringify;
var idParse = MongoID.idParse;

ObserveSequence = {
  _suppressWarnings: 0,
  _loggedWarnings: 0,

  // A mechanism similar to cursor.observe which receives a reactive
  // function returning a sequence type and firing appropriate callbacks
  // when the value changes.
  //
  // @param sequenceFunc {Function} a reactive function returning a
  //     sequence type. The currently supported sequence types are:
  //     Array, Cursor, and null.
  //
  // @param callbacks {Object} similar to a specific subset of
  //     callbacks passed to `cursor.observe`
  //     (http://docs.meteor.com/#observe), with minor variations to
  //     support the fact that not all sequences contain objects with
  //     _id fields.  Specifically:
  //
  //     * addedAt(id, item, atIndex, beforeId)
  //     * changedAt(id, newItem, oldItem, atIndex)
  //     * removedAt(id, oldItem, atIndex)
  //     * movedTo(id, item, fromIndex, toIndex, beforeId)
  //
  // @returns {Object(stop: Function)} call 'stop' on the return value
  //     to stop observing this sequence function.
  //
  // We don't make any assumptions about our ability to compare sequence
  // elements (ie, we don't assume EJSON.equals works; maybe there is extra
  // state/random methods on the objects) so unlike cursor.observe, we may
  // sometimes call changedAt() when nothing actually changed.
  // XXX consider if we *can* make the stronger assumption and avoid
  //     no-op changedAt calls (in some cases?)
  //
  // XXX currently only supports the callbacks used by our
  // implementation of {{#each}}, but this can be expanded.
  //
  // XXX #each doesn't use the indices (though we'll eventually need
  // a way to get them when we support `@index`), but calling
  // `cursor.observe` causes the index to be calculated on every
  // callback using a linear scan (unless you turn it off by passing
  // `_no_indices`).  Any way to avoid calculating indices on a pure
  // cursor observe like we used to?
  observe: function (sequenceFunc, callbacks) {
    var lastSeq = null;
    var activeObserveHandle = null;

    // 'lastSeqArray' contains the previous value of the sequence
    // we're observing. It is an array of objects with '_id' and
    // 'item' fields.  'item' is the element in the array, or the
    // document in the cursor.
    //
    // '_id' is whichever of the following is relevant, unless it has
    // already appeared -- in which case it's randomly generated.
    //
    // * if 'item' is an object:
    //   * an '_id' field, if present
    //   * otherwise, the index in the array
    //
    // * if 'item' is a number or string, use that value
    //
    // XXX this can be generalized by allowing {{#each}} to accept a
    // general 'key' argument which could be a function, a dotted
    // field name, or the special @index value.
    var lastSeqArray = []; // elements are objects of form {_id, item}
    var computation = Tracker.autorun(function () {
      var seq = sequenceFunc();

      Tracker.nonreactive(function () {
        var seqArray; // same structure as `lastSeqArray` above.

        if (activeObserveHandle) {
          // If we were previously observing a cursor, replace lastSeqArray with
          // more up-to-date information.  Then stop the old observe.
          lastSeqArray = _.map(lastSeq.fetch(), function (doc) {
            return {_id: doc._id, item: doc};
          });
          activeObserveHandle.stop();
          activeObserveHandle = null;
        }

        if (!seq) {
          seqArray = seqChangedToEmpty(lastSeqArray, callbacks);
        } else if (seq instanceof Array) {
          seqArray = seqChangedToArray(lastSeqArray, seq, callbacks);
        } else if (isStoreCursor(seq)) {
          var result /* [seqArray, activeObserveHandle] */ =
                seqChangedToCursor(lastSeqArray, seq, callbacks);
          seqArray = result[0];
          activeObserveHandle = result[1];
        } else {
          throw badSequenceError();
        }

        diffArray(lastSeqArray, seqArray, callbacks);
        lastSeq = seq;
        lastSeqArray = seqArray;
      });
    });

    return {
      stop: function () {
        computation.stop();
        if (activeObserveHandle)
          activeObserveHandle.stop();
      }
    };
  },

  // Fetch the items of `seq` into an array, where `seq` is of one of the
  // sequence types accepted by `observe`.  If `seq` is a cursor, a
  // dependency is established.
  fetch: function (seq) {
    if (!seq) {
      return [];
    } else if (seq instanceof Array) {
      return seq;
    } else if (isStoreCursor(seq)) {
      return seq.fetch();
    } else {
      throw badSequenceError();
    }
  }
};

var badSequenceError = function () {
  return new Error("{{#each}} currently only accepts " +
                   "arrays, cursors or falsey values.");
};

var isStoreCursor = function (cursor) {
  return cursor && _.isObject(cursor) &&
    _.isFunction(cursor.observe) && _.isFunction(cursor.fetch);
};

// Calculates the differences between `lastSeqArray` and
// `seqArray` and calls appropriate functions from `callbacks`.
// Reuses Minimongo's diff algorithm implementation.
var diffArray = function (lastSeqArray, seqArray, callbacks) {
  var diffFn = Package['diff-sequence'].DiffSequence.diffQueryOrderedChanges;
  var oldIdObjects = [];
  var newIdObjects = [];
  var posOld = {}; // maps from idStringify'd ids
  var posNew = {}; // ditto
  var posCur = {};
  var lengthCur = lastSeqArray.length;

  _.each(seqArray, function (doc, i) {
    newIdObjects.push({_id: doc._id});
    posNew[idStringify(doc._id)] = i;
  });
  _.each(lastSeqArray, function (doc, i) {
    oldIdObjects.push({_id: doc._id});
    posOld[idStringify(doc._id)] = i;
    posCur[idStringify(doc._id)] = i;
  });

  // Arrays can contain arbitrary objects. We don't diff the
  // objects. Instead we always fire 'changedAt' callback on every
  // object. The consumer of `observe-sequence` should deal with
  // it appropriately.
  diffFn(oldIdObjects, newIdObjects, {
    addedBefore: function (id, doc, before) {
      var position = before ? posCur[idStringify(before)] : lengthCur;

      if (before) {
        // If not adding at the end, we need to update indexes.
        // XXX this can still be improved greatly!
        _.each(posCur, function (pos, id) {
          if (pos >= position)
            posCur[id]++;
        });
      }

      lengthCur++;
      posCur[idStringify(id)] = position;

      callbacks.addedAt(
        id,
        seqArray[posNew[idStringify(id)]].item,
        position,
        before);
    },
    movedBefore: function (id, before) {
      if (id === before)
        return;

      var oldPosition = posCur[idStringify(id)];
      var newPosition = before ? posCur[idStringify(before)] : lengthCur;

      // Moving the item forward. The new element is losing one position as it
      // was removed from the old position before being inserted at the new
      // position.
      // Ex.:   0  *1*  2   3   4
      //        0   2   3  *1*  4
      // The original issued callback is "1" before "4".
      // The position of "1" is 1, the position of "4" is 4.
      // The generated move is (1) -> (3)
      if (newPosition > oldPosition) {
        newPosition--;
      }

      // Fix up the positions of elements between the old and the new positions
      // of the moved element.
      //
      // There are two cases:
      //   1. The element is moved forward. Then all the positions in between
      //   are moved back.
      //   2. The element is moved back. Then the positions in between *and* the
      //   element that is currently standing on the moved element's future
      //   position are moved forward.
      _.each(posCur, function (elCurPosition, id) {
        if (oldPosition < elCurPosition && elCurPosition < newPosition)
          posCur[id]--;
        else if (newPosition <= elCurPosition && elCurPosition < oldPosition)
          posCur[id]++;
      });

      // Finally, update the position of the moved element.
      posCur[idStringify(id)] = newPosition;

      callbacks.movedTo(
        id,
        seqArray[posNew[idStringify(id)]].item,
        oldPosition,
        newPosition,
        before);
    },
    removed: function (id) {
      var prevPosition = posCur[idStringify(id)];

      _.each(posCur, function (pos, id) {
        if (pos >= prevPosition)
          posCur[id]--;
      });

      delete posCur[idStringify(id)];
      lengthCur--;

      callbacks.removedAt(
        id,
        lastSeqArray[posOld[idStringify(id)]].item,
        prevPosition);
    }
  });

  _.each(posNew, function (pos, idString) {
    var id = idParse(idString);
    if (_.has(posOld, idString)) {
      // specifically for primitive types, compare equality before
      // firing the 'changedAt' callback. otherwise, always fire it
      // because doing a deep EJSON comparison is not guaranteed to
      // work (an array can contain arbitrary objects, and 'transform'
      // can be used on cursors). also, deep diffing is not
      // necessarily the most efficient (if only a specific subfield
      // of the object is later accessed).
      var newItem = seqArray[pos].item;
      var oldItem = lastSeqArray[posOld[idString]].item;

      if (typeof newItem === 'object' || newItem !== oldItem)
          callbacks.changedAt(id, newItem, oldItem, pos);
      }
  });
};

seqChangedToEmpty = function (lastSeqArray, callbacks) {
  return [];
};

seqChangedToArray = function (lastSeqArray, array, callbacks) {
  var idsUsed = {};
  var seqArray = _.map(array, function (item, index) {
    var id;
    if (typeof item === 'string') {
      // ensure not empty, since other layers (eg DomRange) assume this as well
      id = "-" + item;
    } else if (typeof item === 'number' ||
               typeof item === 'boolean' ||
               item === undefined) {
      id = item;
    } else if (typeof item === 'object') {
      id = (item && ('_id' in item)) ? item._id : index;
    } else {
      throw new Error("{{#each}} doesn't support arrays with " +
                      "elements of type " + typeof item);
    }

    var idString = idStringify(id);
    if (idsUsed[idString]) {
      if (typeof item === 'object' && '_id' in item)
        warn("duplicate id " + id + " in", array);
      id = Random.id();
    } else {
      idsUsed[idString] = true;
    }

    return { _id: id, item: item };
  });

  return seqArray;
};

seqChangedToCursor = function (lastSeqArray, cursor, callbacks) {
  var initial = true; // are we observing initial data from cursor?
  var seqArray = [];

  var observeHandle = cursor.observe({
    addedAt: function (document, atIndex, before) {
      if (initial) {
        // keep track of initial data so that we can diff once
        // we exit `observe`.
        if (before !== null)
          throw new Error("Expected initial data from observe in order");
        seqArray.push({ _id: document._id, item: document });
      } else {
        callbacks.addedAt(document._id, document, atIndex, before);
      }
    },
    changedAt: function (newDocument, oldDocument, atIndex) {
      callbacks.changedAt(newDocument._id, newDocument, oldDocument,
                          atIndex);
    },
    removedAt: function (oldDocument, atIndex) {
      callbacks.removedAt(oldDocument._id, oldDocument, atIndex);
    },
    movedTo: function (document, fromIndex, toIndex, before) {
      callbacks.movedTo(
        document._id, document, fromIndex, toIndex, before);
    }
  });
  initial = false;

  return [seqArray, observeHandle];
};
  Meteor.LocalCollection = LocalCollection;
  Meteor.ObserveSequence = ObserveSequence;
};

load(Meteor);
module.exports = Meteor.ObserveSequence;
