import EJSON from 'ejson';

const hasOwn = Object.prototype.hasOwnProperty;

const isEmpty = (obj) => {
  if (obj == null) {
    return true;
  }

  if (Array.isArray(obj)
    || typeof obj === 'string') {
    return obj.length === 0;
  }

  for (const key in obj) {
    if (hasOwn.call(obj, key)) {
      return false;
    }
  }

  return true;
};

export const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

export const parseDDP = function (stringMessage) {
  let msg;
  try {
    msg = JSON.parse(stringMessage);
  } catch (e) {
    console.debug('Discarding message with invalid JSON', stringMessage);
    return null;
  }
  // DDP messages must be objects.
  if (msg === null || typeof msg !== 'object') {
    console.debug('Discarding non-object DDP message', stringMessage);
    return null;
  }

  // massage msg to get it into "abstract ddp" rather than "wire ddp" format.

  // switch between "cleared" rep of unsetting fields and "undefined"
  // rep of same
  if (hasOwn.call(msg, 'cleared')) {
    if (!hasOwn.call(msg, 'fields')) {
      msg.fields = {};
    }
    msg.cleared.forEach((clearKey) => {
      msg.fields[clearKey] = undefined;
    });
    delete msg.cleared;
  }

  ['fields', 'params', 'result'].forEach((field) => {
    if (hasOwn.call(msg, field)) {
      msg[field] = EJSON._adjustTypesFromJSONValue(msg[field]);
    }
  });

  return msg;
};

export const stringifyDDP = function (msg) {
  const copy = EJSON.clone(msg);

  // swizzle 'changed' messages from 'fields undefined' rep to 'fields
  // and cleared' rep
  if (hasOwn.call(msg, 'fields')) {
    const cleared = [];

    Object.keys(msg.fields).forEach((key) => {
      const value = msg.fields[key];

      if (typeof value === 'undefined') {
        cleared.push(key);
        delete copy.fields[key];
      }
    });

    if (!isEmpty(cleared)) {
      copy.cleared = cleared;
    }

    if (isEmpty(copy.fields)) {
      delete copy.fields;
    }
  }

  // adjust types to basic
  ['fields', 'params', 'result'].forEach((field) => {
    if (hasOwn.call(copy, field)) {
      copy[field] = EJSON._adjustTypesToJSONValue(copy[field]);
    }
  });

  if (msg.id && typeof msg.id !== 'string') {
    throw new Error('Message id is not a string');
  }

  return JSON.stringify(copy);
};
