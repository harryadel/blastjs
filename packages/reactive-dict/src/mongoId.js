/* eslint-disable no-underscore-dangle */
import Random from '@reactioncommerce/random';

const MongoID = {};

MongoID._looksLikeObjectID = (str) => str.length === 24 && str.match(/^[0-9a-f]*$/);

MongoID.ObjectID = class ObjectID {
  constructor(hexString) {
    // random-based impl of Mongo ObjectID
    if (hexString) {
      const lowerCaseHexString = hexString.toLowerCase();
      if (!MongoID._looksLikeObjectID(lowerCaseHexString)) {
        throw new Error('Invalid hexadecimal string for creating an ObjectID');
      }
      // meant to work with _.isEqual(), which relies on structural equality
      this._str = lowerCaseHexString;
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

  // eslint-disable-next-line class-methods-use-this
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

export default MongoID;
