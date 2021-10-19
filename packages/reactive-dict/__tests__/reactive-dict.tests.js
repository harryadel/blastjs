import { Tracker } from '@blastjs/tracker';
import { MongoID } from '@blastjs/mongo-id';
import { ReactiveDict } from '../src/reactive-dict';

test('ReactiveDict - set to undefined', () => {
  const dict = new ReactiveDict();
  dict.set('foo', undefined);
  expect(Object.keys(dict.all())).toEqual(['foo']);
  dict.setDefault('foo', 'bar');
  expect(dict.get('foo')).toEqual(undefined);
});

test('ReactiveDict - initialize with data', () => {
  const now = new Date();
  let dict = new ReactiveDict({
    now,
  });

  let nowFromDict = dict.get('now');
  expect(nowFromDict).toEqual(now);

  // Test with static value here as a named dict could
  // be migrated if code reload happens while testing
  dict = new ReactiveDict('foo', {
    foo: 'bar',
  });

  nowFromDict = dict.get('foo');
  expect(nowFromDict).toEqual('bar');

  dict = new ReactiveDict(undefined, {
    now,
  });

  nowFromDict = dict.get('now');
  expect(nowFromDict).toEqual(now);
});

test('ReactiveDict - setDefault', () => {
  let dict = new ReactiveDict();
  dict.set('A', 'blah');
  dict.set('B', undefined);
  dict.setDefault('A', 'default');
  dict.setDefault('B', 'default');
  dict.setDefault('C', 'default');
  dict.setDefault('D', undefined);
  expect(dict.all()).toEqual({
    A: 'blah',
    B: undefined,
    C: 'default',
    D: undefined,
  });

  dict = new ReactiveDict();
  dict.set('A', 'blah');
  dict.set('B', undefined);
  dict.setDefault({
    A: 'default',
    B: 'defualt',
    C: 'default',
    D: undefined,
  });
  expect(dict.all()).toEqual({
    A: 'blah',
    B: undefined,
    C: 'default',
    D: undefined,
  });
});

test('ReactiveDict - all() works', () => {
  let all = {};
  const dict = new ReactiveDict();
  Tracker.autorun(() => {
    all = dict.all();
  });

  expect(all).toEqual({});

  dict.set('foo', 'bar');
  Tracker.flush();
  expect(all).toEqual({ foo: 'bar' });

  dict.set('blah', undefined);
  Tracker.flush();
  expect(all).toEqual({ foo: 'bar', blah: undefined });
});

test('ReactiveDict - clear() works', () => {
  const dict = new ReactiveDict();
  dict.set('foo', 'bar');

  // Clear should not throw an error now
  // See issue #5530
  dict.clear();

  dict.set('foo', 'bar');

  let val;
  let equals;
  let equalsUndefined;
  let all;
  Tracker.autorun(() => {
    val = dict.get('foo');
  });
  Tracker.autorun(() => {
    equals = dict.equals('foo', 'bar');
  });
  Tracker.autorun(() => {
    equalsUndefined = dict.equals('foo', undefined);
  });
  Tracker.autorun(() => {
    all = dict.all();
  });

  expect(val).toEqual('bar');
  expect(equals).toEqual(true);
  expect(equalsUndefined).toEqual(false);
  expect(all).toEqual({ foo: 'bar' });

  dict.clear();
  Tracker.flush();
  expect(val).toBeUndefined();
  expect(equals).toEqual(false);
  expect(equalsUndefined).toEqual(true);
  expect(all).toEqual({});
});

test('ReactiveDict - get/set/equals types', () => {
  const dict = new ReactiveDict();

  expect(dict.get('u')).toEqual(undefined);
  expect(dict.equals('u', undefined)).toEqual(true);
  expect(dict.equals('u', null)).toEqual(false);
  expect(dict.equals('u', 0)).toEqual(false);
  expect(dict.equals('u', '')).toEqual(false);

  dict.set('u', undefined);
  expect(dict.get('u')).toEqual(undefined);
  expect(dict.equals('u', undefined)).toEqual(true);
  expect(dict.equals('u', null)).toEqual(false);
  expect(dict.equals('u', 0)).toEqual(false);
  expect(dict.equals('u', '')).toEqual(false);
  expect(dict.equals('u', 'undefined')).toEqual(false);
  expect(dict.equals('u', 'null')).toBeFalsy();

  dict.set('n', null);
  expect(dict.get('n')).toEqual(null);
  expect(dict.equals('n', undefined)).toBeFalsy();
  expect(dict.equals('n', null)).toBeTruthy();
  expect(dict.equals('n', 0)).toBeFalsy();
  expect(dict.equals('n', '')).toBeFalsy();
  expect(dict.equals('n', 'undefined')).toBeFalsy();
  expect(dict.equals('n', 'null')).toBeFalsy();

  dict.set('t', true);
  expect(dict.get('t')).toEqual(true);
  expect(dict.equals('t', true)).toBeTruthy();
  expect(dict.equals('t', false)).toBeFalsy();
  expect(dict.equals('t', 1)).toBeFalsy();
  expect(dict.equals('t', 'true')).toBeFalsy();

  dict.set('f', false);
  expect(dict.get('f')).toEqual(false);
  expect(dict.equals('f', true)).toBeFalsy();
  expect(dict.equals('f', false)).toBeTruthy();
  expect(dict.equals('f', 1)).toBeFalsy();
  expect(dict.equals('f', 'false')).toBeFalsy();

  dict.set('num', 0);
  expect(dict.get('num')).toEqual(0);
  expect(dict.equals('num', 0)).toBeTruthy();
  expect(dict.equals('num', false)).toBeFalsy();
  expect(dict.equals('num', '0')).toBeFalsy();
  expect(dict.equals('num', 1)).toBeFalsy();

  dict.set('str', 'true');
  expect(dict.get('str')).toBeTruthy();
  expect(dict.equals('str', 'true')).toBeTruthy();
  expect(dict.equals('str', true)).toBeFalsy();

  dict.set('arr', [1, 2, { a: 1, b: [5, 6] }]);
  expect(dict.get('arr')).toEqual([1, 2, { b: [5, 6], a: 1 }]);
  expect(dict.equals('arr', 1)).toBeFalsy();
  expect(dict.equals('arr', '[1,2,{"a":1,"b":[5,6]}]')).toBeFalsy();
  expect(() => {
    dict.equals('arr', [1, 2, { a: 1, b: [5, 6] }]);
  }).toThrow();

  dict.set('obj', { a: 1, b: [5, 6] });
  expect(dict.get('obj')).toEqual({ b: [5, 6], a: 1 });
  expect(dict.equals('obj', 1)).toBeFalsy();
  expect(dict.equals('obj', '{"a":1,"b":[5,6]}')).toBeFalsy();
  expect(() => {
    dict.equals('obj', { a: 1, b: [5, 6] });
  }).toThrow();

  dict.set('date', new Date(1234));
  expect(dict.get('date')).toEqual(new Date(1234));
  expect(dict.equals('date', new Date(3455))).toBeFalsy();
  expect(dict.equals('date', new Date(1234))).toBeTruthy();
  dict.set('oid', new MongoID.ObjectID('ffffffffffffffffffffffff'));

  expect(dict.get('oid')).toEqual(
    new MongoID.ObjectID('ffffffffffffffffffffffff'),
  );
  expect(
    dict.equals('oid', new MongoID.ObjectID('fffffffffffffffffffffffa')),
  ).toBeFalsy();

  expect(
    dict.equals('oid', new MongoID.ObjectID('ffffffffffffffffffffffff')),
  ).toBeTruthy();
});

test('ReactiveDict - delete(key) works', () => {
  const dict = new ReactiveDict();
  dict.set('foo', 'bar');
  dict.set('bar', 'foo');

  dict.set('baz', 123);
  expect(dict.delete('baz')).toEqual(true);
  expect(dict.delete('baz')).toEqual(false);

  let val;
  let equals;
  let equalsUndefined;
  let all;

  Tracker.autorun(() => {
    val = dict.get('foo');
  });
  Tracker.autorun(() => {
    equals = dict.equals('foo', 'bar');
  });
  Tracker.autorun(() => {
    equalsUndefined = dict.equals('foo', undefined);
  });
  Tracker.autorun(() => {
    all = dict.all();
  });

  expect(val).toEqual('bar');
  expect(equals).toEqual(true);
  expect(equalsUndefined).toEqual(false);
  expect(all).toEqual({ foo: 'bar', bar: 'foo' });

  let didRemove = dict.delete('foo');
  expect(didRemove).toEqual(true);

  Tracker.flush();

  expect(val).toBeUndefined();
  expect(equals).toEqual(false);
  expect(equalsUndefined).toEqual(true);
  expect(all).toEqual({ bar: 'foo' });

  didRemove = dict.delete('barfoobar');
  expect(didRemove).toEqual(false);
});

test('ReactiveDict - destroy works', () => {
  let dict = new ReactiveDict('test');

  // Should throw on client when reload package is present
  // typeof window === 'object' && expect(() => {
  //   var dict2 = new ReactiveDict('test');
  // }).toThrow();

  dict.set('foo', 'bar');

  let val;
  let equals;
  let equalsUndefined;
  let all;
  Tracker.autorun(() => {
    val = dict.get('foo');
  });
  Tracker.autorun(() => {
    equals = dict.equals('foo', 'bar');
  });
  Tracker.autorun(() => {
    equalsUndefined = dict.equals('foo', undefined);
  });
  Tracker.autorun(() => {
    all = dict.all();
  });

  expect(val).toEqual('bar');
  expect(equals).toEqual(true);
  expect(equalsUndefined).toEqual(false);
  expect(all).toEqual({ foo: 'bar' });

  // .destroy() should clear the dict
  dict.destroy();
  Tracker.flush();
  expect(val).toBeUndefined();
  expect(equals).toEqual(false);
  expect(equalsUndefined).toEqual(true);
  expect(all).toEqual({});

  // Shouldn't throw now that we've destroyed the previous dict
  dict = new ReactiveDict('test');
});
