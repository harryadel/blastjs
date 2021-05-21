import { HTML } from '../src/preamble';

test('htmljs - getTag', () => {
  const FOO = HTML.getTag('foo');
  expect(HTML.FOO === FOO).toBeTruthy();
  const x = FOO();

  expect(x.tagName).toEqual('foo');
  expect(x instanceof HTML.FOO).toBeTruthy();
  expect(x instanceof HTML.Tag).toBeTruthy();
  expect(x.children).toEqual([]);
  expect(x.attrs).toEqual(null);

  expect((new FOO()) instanceof HTML.FOO).toBeTruthy();
  expect((new FOO()) instanceof HTML.Tag).toBeTruthy();
  expect((new HTML.P()) instanceof HTML.FOO).toBeFalsy();

  const result = HTML.ensureTag('Bar');
  expect(typeof result).toEqual('undefined');
  const { BAR } = HTML;
  expect(BAR().tagName).toEqual('Bar');
});

test('htmljs - construction', () => {
  const A = HTML.getTag('a');
  const B = HTML.getTag('b');
  const C = HTML.getTag('c');

  const a = A(0, B({ q: 0 }, C(A(B({})), 'foo')));
  expect(a.tagName).toEqual('a');
  expect(a.attrs).toEqual(null);
  expect(a.children.length).toEqual(2);
  expect(a.children[0]).toEqual(0);
  const b = a.children[1];
  expect(b.tagName).toEqual('b');
  expect(b.attrs).toEqual({ q: 0 });
  expect(b.children.length).toEqual(1);
  const c = b.children[0];
  expect(c.tagName).toEqual('c');
  expect(c.attrs).toEqual(null);
  expect(c.children.length).toEqual(2);
  expect(c.children[0].tagName).toEqual('a');
  expect(c.children[0].attrs).toEqual(null);
  expect(c.children[0].children.length).toEqual(1);
  expect(c.children[0].children[0].tagName).toEqual('b');
  expect(c.children[0].children[0].children.length).toEqual(0);
  expect(c.children[0].children[0].attrs).toEqual({});
  expect(c.children[1]).toEqual('foo');

  const a2 = new A({ m: 1 }, { n: 2 }, B(), { o: 3 }, 'foo');
  expect(a2.tagName).toEqual('a');
  expect(a2.attrs).toEqual({ m: 1 });
  expect(a2.children.length).toEqual(4);
  expect(a2.children[0]).toEqual({ n: 2 });
  expect(a2.children[1].tagName).toEqual('b');
  expect(a2.children[2]).toEqual({ o: 3 });
  expect(a2.children[3]).toEqual('foo');

  // tests of HTML.isConstructedObject (indirectly)
  expect(A({ x: 1 }).children.length).toEqual(0);
  const f = function () {};
  expect(A(new f()).children.length).toEqual(1);
  expect(A(new Date()).children.length).toEqual(1);
  expect(A({ constructor: 'blah' }).children.length).toEqual(0);
  expect(A({ constructor: Object }).children.length).toEqual(0);

  expect(HTML.toHTML(HTML.CharRef({ html: '&amp;', str: '&' }))).toEqual('&amp;');
  expect(() => {
    HTML.CharRef({ html: '&amp;' }); // no 'str'
  }).toThrow();
});

// copied from here https://github.com/meteor/blaze/blob/ed9299ea32afdd04f33124957f22ce2b18b7f3ff/packages/html-tools/utils.js#L3
// to avoid circular dependency between htmljs and html-tools pacakge.
// this circular dependency was blocking the publish process.
const asciiLowerCase = function (str) {
  return str.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32));
};

test('htmljs - utils', () => {
  expect('\u00c9'.toLowerCase()).not.toBe('\u00c9');
  expect(asciiLowerCase('\u00c9')).toEqual('\u00c9');

  expect(asciiLowerCase('Hello There')).toEqual('hello there');

  expect(HTML.isVoidElement('br')).toBeTruthy();
  expect(HTML.isVoidElement('div')).toBeFalsy();
  expect(HTML.isKnownElement('div')).toBeTruthy();
});

test('htmljs - details', () => {
  expect(HTML.toHTML(false)).toEqual('false');
});
