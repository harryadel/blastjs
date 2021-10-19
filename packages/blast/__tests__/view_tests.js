import { ReactiveVar } from '@blastjs/reactive-var';
import { Tracker } from '@blastjs/tracker';
import { Blast, canonicalizeHtml } from '../src/index';

test('blast - view - callbacks', () => {
  const R = ReactiveVar('foo');

  let buf = '';

  const v = Blast.View(() => R.get());

  v.onViewCreated(() => {
    buf += `c${v.renderCount}`;
  });
  v._onViewRendered(() => {
    buf += `r${v.renderCount}`;
  });
  v.onViewReady(() => {
    buf += `y${v.renderCount}`;
  });
  v.onViewDestroyed(() => {
    buf += `d${v.renderCount}`;
  });

  expect(buf).toEqual('');

  const div = document.createElement('DIV');
  expect(v.isRendered).toBeFalsy();
  expect(v._isAttached).toBeFalsy();
  expect(canonicalizeHtml(div.innerHTML)).toEqual('');
  // expect(() => {
  //   const v = function () { v.firstNode(); }
  // }).toThrowError(/View must be attached/);

  // expect(() => {
  //   const v = function () { v.lastNode(); }
  // }).toThrowError(/View must be attached/);

  Blast.render(v, div);
  expect(buf).toEqual('c0r1');
  expect(typeof (v.firstNode().nodeType)).toEqual('number');
  expect(typeof (v.lastNode().nodeType)).toEqual('number');
  expect(v.isRendered).toBeTruthy();
  expect(v._isAttached).toBeTruthy();
  expect(buf).toEqual('c0r1');
  expect(canonicalizeHtml(div.innerHTML)).toEqual('foo');
  Tracker.flush();
  expect(buf).toEqual('c0r1y1');

  R.set('bar');
  Tracker.flush();
  expect(buf).toEqual('c0r1y1r2y2');
  expect(canonicalizeHtml(div.innerHTML)).toEqual('bar');

  Blast.remove(v);
  expect(buf).toEqual('c0r1y1r2y2d2');
  expect(canonicalizeHtml(div.innerHTML)).toEqual('');

  buf = '';
  R.set('baz');
  Tracker.flush();
  expect(buf).toEqual('');
});
