import { ReactiveVar } from 'standalone-reactive-var';
import { Tracker } from 'standalone-tracker';
import { Blaze, canonicalizeHtml } from '../src/index';

test("blaze - view - callbacks", () => {
  var R = ReactiveVar('foo');

  var buf = '';

  var v = Blaze.View(function () {
    return R.get();
  });

  v.onViewCreated(function () {
    buf += 'c' + v.renderCount;
  });
  v._onViewRendered(function () {
    buf += 'r' + v.renderCount;
  });
  v.onViewReady(function () {
    buf += 'y' + v.renderCount;
  });
  v.onViewDestroyed(function () {
    buf += 'd' + v.renderCount;
  });

  expect(buf).toEqual('');

  var div = document.createElement("DIV");
  expect(v.isRendered).toBeFalsy();
  expect(v._isAttached).toBeFalsy();
  expect(canonicalizeHtml(div.innerHTML)).toEqual("");
  // expect(() => {
  //   const v = function () { v.firstNode(); }
  // }).toThrowError(/View must be attached/);

  // expect(() => {
  //   const v = function () { v.lastNode(); }
  // }).toThrowError(/View must be attached/);

  Blaze.render(v, div);
  expect(buf).toEqual('c0r1');
  expect(typeof (v.firstNode().nodeType)).toEqual("number");
  expect(typeof (v.lastNode().nodeType)).toEqual("number");
  expect(v.isRendered).toBeTruthy();
  expect(v._isAttached).toBeTruthy();
  expect(buf).toEqual('c0r1');
  expect(canonicalizeHtml(div.innerHTML)).toEqual("foo");
  Tracker.flush();
  expect(buf).toEqual('c0r1y1');

  R.set("bar");
  Tracker.flush();
  expect(buf).toEqual('c0r1y1r2y2');
  expect(canonicalizeHtml(div.innerHTML)).toEqual("bar");

  Blaze.remove(v);
  expect(buf).toEqual('c0r1y1r2y2d2');
  expect(canonicalizeHtml(div.innerHTML)).toEqual("");

  buf = "";
  R.set("baz");
  Tracker.flush();
  expect(buf).toEqual("");
});
