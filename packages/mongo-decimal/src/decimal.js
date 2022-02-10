import EJSON from 'ejson';
import { Decimal } from 'decimal.js';

Decimal.prototype.typeName = function () {
  return 'Decimal';
};

Decimal.prototype.toJSONValue = function () {
  return this.toJSON();
};

Decimal.prototype.clone = function () {
  return Decimal(this.toString());
};

EJSON.addType('Decimal', (str) => Decimal(str));

export { Decimal };
