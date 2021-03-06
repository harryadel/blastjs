import EJSON from 'ejson';
import Random from '@reactioncommerce/random';

const MongoID = {};

MongoID._looksLikeObjectID = (str) => str.length === 24 && str.match(/^[0-9a-f]*$/);

MongoID.ObjectID = class ObjectID {
  constructor(hexString) {
    // random-based impl of Mongo ObjectID
    if (hexString) {
      hexString = hexString.toLowerCase();
      if (!MongoID._looksLikeObjectID(hexString)) {
        throw new Error('Invalid hexadecimal string for creating an ObjectID');
      }
      // meant to work with _.isEqual(), which relies on structural equality
      this._str = hexString;
    } else {
      this._str = Random.hexString(24);
    }
  }

  equals(other) {
    return (
      other instanceof MongoID.ObjectID && this.valueOf() === other.valueOf()
    );
  }

  toString() {
    return `ObjectID("${this._str}")`;
  }

  clone() {
    return new MongoID.ObjectID(this._str);
  }

  typeName() {
    return 'oid';
  }

  getTimestamp() {
    return Number.parseInt(this._str.substr(0, 8), 16);
  }

  valueOf() {
    return this._str;
  }

  toJSONValue() {
    return this.valueOf();
  }

  toHexString() {
    return this.valueOf();
  }
};

EJSON.addType('oid', (str) => new MongoID.ObjectID(str));

MongoID.idStringify = (id) => {
  if (id instanceof MongoID.ObjectID) {
    return id.valueOf();
  }
  if (typeof id === 'string') {
    const firstChar = id.charAt(0);
    if (id === '') {
      return id;
    }
    if (
      firstChar === '-' // escape previously dashed strings
      || firstChar === '~' // escape escaped numbers, true, false
      || MongoID._looksLikeObjectID(id) // escape object-id-form strings
      || firstChar === '{'
    ) {
      // escape object-form strings, for maybe implementing later
      return `-${id}`;
    }
    return id; // other strings go through unchanged.
  }
  if (id === undefined) {
    return '-';
  }
  if (typeof id === 'object' && id !== null) {
    throw new Error(
      'Meteor does not currently support objects other than ObjectID as ids',
    );
  } else {
    // Numbers, true, false, null
    return `~${JSON.stringify(id)}`;
  }
};

MongoID.idParse = (id) => {
  const firstChar = id.charAt(0);
  if (id === '') {
    return id;
  }
  if (id === '-') {
    return undefined;
  }
  if (firstChar === '-') {
    return id.substr(1);
  }
  if (firstChar === '~') {
    return JSON.parse(id.substr(1));
  }
  if (MongoID._looksLikeObjectID(id)) {
    return new MongoID.ObjectID(id);
  }
  return id;
};

export { MongoID };
