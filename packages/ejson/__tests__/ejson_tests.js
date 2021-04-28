import { EJSON } from '../src/ejson';
import EJSONTest from './custom_models_for_tests';

test('ejson - keyOrderSensitive', () => {
  expect(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        d: { f: 4, e: 3 },
        a: { c: 2, b: 1 },
      },
    ),
  ).toBeTruthy();

  expect(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        d: { f: 4, e: 3 },
        a: { c: 2, b: 1 },
      },
      { keyOrderSensitive: true },
    ),
  ).toBeFalsy();

  expect(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        a: { c: 2, b: 1 },
        d: { f: 4, e: 3 },
      },
      { keyOrderSensitive: true },
    ),
  ).toBeFalsy();
  expect(
    EJSON.equals({ a: {} }, { a: { b: 2 } }, { keyOrderSensitive: true }),
  ).toBeFalsy();
  expect(
    EJSON.equals({ a: { b: 2 } }, { a: {} }, { keyOrderSensitive: true }),
  ).toBeFalsy();
});

test('ejson - nesting and literal', () => {
  const d = new Date();
  const obj = { $date: d };
  const eObj = EJSON.toJSONValue(obj);
  const roundTrip = EJSON.fromJSONValue(eObj);
  expect(obj).toEqual(roundTrip);
});

test('ejson - some equality tests', () => {
  expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 2 })).toBeTruthy();
  expect(EJSON.equals({ a: 1, b: 2 }, { a: 1, c: 3, b: 2 })).toBeFalsy();
  expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBeFalsy();
  expect(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 4 })).toBeFalsy();
  expect(EJSON.equals({ a: {} }, { a: { b: 2 } })).toBeFalsy();
  expect(EJSON.equals({ a: { b: 2 } }, { a: {} })).toBeFalsy();
});

test('ejson - equality and falsiness', () => {
  expect(EJSON.equals(null, null)).toBeTruthy();
  expect(EJSON.equals(undefined, undefined)).toBeTruthy();
  expect(EJSON.equals({ foo: 'foo' }, null)).toBeFalsy();
  expect(EJSON.equals(null, { foo: 'foo' })).toBeFalsy();
  expect(EJSON.equals(undefined, { foo: 'foo' })).toBeFalsy();
  expect(EJSON.equals({ foo: 'foo' }, undefined)).toBeFalsy();
});

test('ejson - NaN and Inf', () => {
  expect(EJSON.parse('{"$InfNaN": 1}')).toEqual(Infinity);
  expect(EJSON.parse('{"$InfNaN": -1}')).toEqual(-Infinity);
  expect(Number.isNaN(EJSON.parse('{"$InfNaN": 0}'))).toBeTruthy();
  expect(EJSON.parse(EJSON.stringify(Infinity))).toEqual(Infinity);
  expect(EJSON.parse(EJSON.stringify(-Infinity))).toEqual(-Infinity);
  expect(Number.isNaN(EJSON.parse(EJSON.stringify(NaN)))).toBeTruthy();
  expect(EJSON.equals(NaN, NaN)).toBeTruthy();
  expect(EJSON.equals(Infinity, Infinity)).toBeTruthy();
  expect(EJSON.equals(-Infinity, -Infinity)).toBeTruthy();
  expect(EJSON.equals(Infinity, -Infinity)).toBeFalsy();
  expect(EJSON.equals(Infinity, NaN)).toBeFalsy();
  expect(EJSON.equals(Infinity, 0)).toBeFalsy();
  expect(EJSON.equals(NaN, 0)).toBeFalsy();

  expect(
    EJSON.equals(EJSON.parse('{"a": {"$InfNaN": 1}}'), { a: Infinity }),
  ).toBeTruthy();
  expect(
    EJSON.equals(EJSON.parse('{"a": {"$InfNaN": 0}}'), { a: NaN }),
  ).toBeTruthy();
});

test('ejson - clone', () => {
  const cloneTest = (x, identical) => {
    const y = EJSON.clone(x);
    expect(EJSON.equals(x, y)).toBeTruthy();
    expect(x === y).toEqual(!!identical);
  };
  cloneTest(null, true);
  cloneTest(undefined, true);
  cloneTest(42, true);
  cloneTest('asdf', true);
  cloneTest([1, 2, 3]);
  cloneTest([1, 'fasdf', { foo: 42 }]);
  cloneTest({ x: 42, y: 'asdf' });

  function testCloneArgs(...args) {
    const clonedArgs = EJSON.clone(args);
    expect(clonedArgs).toEqual([1, 2, 'foo', [4]]);
  }
  testCloneArgs(1, 2, 'foo', [4]);
});

test('ejson - stringify', () => {
  expect(EJSON.stringify(null)).toEqual('null');
  expect(EJSON.stringify(true)).toEqual('true');
  expect(EJSON.stringify(false)).toEqual('false');
  expect(EJSON.stringify(123)).toEqual('123');
  expect(EJSON.stringify('abc')).toEqual('"abc"');

  expect(EJSON.stringify([1, 2, 3])).toEqual('[1,2,3]');
  expect(
    EJSON.stringify([1, 2, 3], { indent: true }),
  ).toEqual(
    '[\n  1,\n  2,\n  3\n]',
  );
  expect(EJSON.stringify([1, 2, 3], { canonical: false })).toEqual('[1,2,3]');

  expect(
    EJSON.stringify([1, 2, 3], { indent: true, canonical: false }),
  ).toEqual(
    '[\n  1,\n  2,\n  3\n]',
  );

  expect(
    EJSON.stringify([1, 2, 3], { indent: 4 }),
  )
    .toEqual('[\n    1,\n    2,\n    3\n]');

  expect(
    EJSON.stringify([1, 2, 3], { indent: '--' }),
  ).toEqual(
    '[\n--1,\n--2,\n--3\n]',
  );

  expect(
    EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: true }),
  ).toEqual(
    '{"a":1,"b":[2,{"c":3,"d":4}]}',
  );
  expect(
    EJSON.stringify(
      { b: [2, { d: 4, c: 3 }], a: 1 },
      {
        indent: true,
        canonical: true,
      },
    ),
  ).toEqual(
    '{\n'
      + '  "a": 1,\n'
      + '  "b": [\n'
      + '    2,\n'
      + '    {\n'
      + '      "c": 3,\n'
      + '      "d": 4\n'
      + '    }\n'
      + '  ]\n'
      + '}',
  );
  expect(
    EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: false }),
  ).toEqual(
    '{"b":[2,{"d":4,"c":3}],"a":1}',
  );
  expect(
    EJSON.stringify(
      { b: [2, { d: 4, c: 3 }], a: 1 },
      { indent: true, canonical: false },
    ),
  ).toEqual(
    '{\n'
      + '  "b": [\n'
      + '    2,\n'
      + '    {\n'
      + '      "d": 4,\n'
      + '      "c": 3\n'
      + '    }\n'
      + '  ],\n'
      + '  "a": 1\n'
      + '}',
  );
});

test('ejson - parse', () => {
  expect(EJSON.parse('[1,2,3]')).toEqual([1, 2, 3]);
  expect(() => {
    EJSON.parse(null);
  }).toThrowError(/argument should be a string/);
});

test('ejson - regexp', () => {
  expect(EJSON.stringify(/foo/gi)).toEqual('{"$regexp":"foo","$flags":"gi"}');
  const obj = { $regexp: 'foo', $flags: 'gi' };

  const eObj = EJSON.toJSONValue(obj);
  const roundTrip = EJSON.fromJSONValue(eObj);
  expect(obj).toEqual(roundTrip);
});

test('ejson - custom types', () => {
  const testSameConstructors = (someObj, compareWith) => {
    expect(someObj.constructor).toEqual(compareWith.constructor);
    if (typeof someObj === 'object') {
      Object.keys(someObj).forEach((key) => {
        const value = someObj[key];
        testSameConstructors(value, compareWith[key]);
      });
    }
  };

  const testReallyEqual = (someObj, compareWith) => {
    expect(someObj).toEqual(compareWith);
    testSameConstructors(someObj, compareWith);
  };

  const testRoundTrip = (someObj) => {
    const str = EJSON.stringify(someObj);
    const roundTrip = EJSON.parse(str);
    testReallyEqual(someObj, roundTrip);
  };

  const testCustomObject = (someObj) => {
    testRoundTrip(someObj);
    testReallyEqual(someObj, EJSON.clone(someObj));
  };

  const a = new EJSONTest.Address('Montreal', 'Quebec');
  testCustomObject({ address: a });
  // Test that difference is detected even if they
  // have similar toJSONValue results:
  const nakedA = { city: 'Montreal', state: 'Quebec' };
  expect(nakedA).not.toBe(a);
  expect(a).not.toBe(nakedA);
  const holder = new EJSONTest.Holder(nakedA);
  expect(holder.toJSONValue()).toEqual(a.toJSONValue()); // sanity check
  expect(holder).not.toBe(a);
  expect(a).not.toBe(holder);

  const d = new Date();
  const obj = new EJSONTest.Person('John Doe', d, a);
  testCustomObject(obj);

  // Test clone is deep:
  const clone = EJSON.clone(obj);
  clone.address.city = 'Sherbrooke';
  expect(obj).not.toBe(clone);
});

// Verify objects with a property named "length" can be handled by the EJSON
// API properly (see https://github.com/meteor/meteor/issues/5175).
test('ejson - handle objects with properties named "length"', () => {
  class Widget {
    constructor() {
      this.length = 10;
    }
  }
  const widget = new Widget();

  const toJsonWidget = EJSON.toJSONValue(widget);
  expect(widget).toEqual(toJsonWidget);

  const fromJsonWidget = EJSON.fromJSONValue(widget);
  expect(widget).toEqual(fromJsonWidget);

  const stringifiedWidget = EJSON.stringify(widget);
  expect(stringifiedWidget).toEqual('{"length":10}');

  const parsedWidget = EJSON.parse('{"length":10}');
  expect({ length: 10 }).toEqual(parsedWidget);

  expect(EJSON.isBinary(widget)).toBeFalsy();

  const widget2 = new Widget();
  expect(widget).toEqual(widget2);

  const clonedWidget = EJSON.clone(widget);
  expect(widget).toEqual(clonedWidget);
});
