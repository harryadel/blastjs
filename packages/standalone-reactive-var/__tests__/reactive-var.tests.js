import { test } from '@jest/globals';
import { ReactiveVar } from '../src/reactive-var';

test('ReactiveVar - initialize with default Value', () => {
  const responsiveVar = new ReactiveVar('foo')
  expect(responsiveVar.get('foo')).toEqual('foo');
})

test('ReactiveVar - set/get', () => {
  const responsiveVar = new ReactiveVar()
  responsiveVar.set('foo');
  expect(responsiveVar.get('foo')).toEqual('foo');
});

test('ReactiveVar - mutate value', () => {
  const responsiveVar = new ReactiveVar()
  responsiveVar.set('foo');
  responsiveVar.set('bar');
  expect(responsiveVar.get('bar')).toEqual('bar');
});

test('ReactiveVar - _isEqual - same value and type', () => {
  expect(ReactiveVar._isEqual("foo", "foo")).toEqual(true)
});

test('ReactiveVar - _isEqual - different value but same type', () => {
  expect(ReactiveVar._isEqual("foo", "bar")).toEqual(false)
});

test('ReactiveVar - toString', function () {
  const responsiveVar = new ReactiveVar('baseValue')
  expect(responsiveVar.toString()).toEqual('ReactiveVar{baseValue}')
});

