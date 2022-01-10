import { ReactiveVar } from '@blastjs/reactive-var';
import { BlastTools } from '@blastjs/blast-tools';
import { Tracker } from '@blastjs/tracker';
import { HTML } from '@blastjs/htmljs';
import $ from 'jquery';
import { Blast, canonicalizeHtml, Template } from '../src/index';

const toCode = BlastTools.toJS;

const { P } = HTML;
const { CharRef } = HTML;
const { DIV } = HTML;
const { Comment } = HTML;
const { BR } = HTML;
const { A } = HTML;
const { UL } = HTML;
const { LI } = HTML;
const { SPAN } = HTML;
const { HR } = HTML;
const { TEXTAREA } = HTML;
const { INPUT } = HTML;

const materialize = function (content, parent) {
  let func = content;
  if (typeof content !== 'function') {
    func = function () {
      return content;
    };
  }
  Blast.render(func, parent);
};

const { toHTML } = Blast;

test('blast - render - basic', () => {
  const run = function (input, expectedInnerHTML, expectedHTML, expectedCode) {
    const div = document.createElement('DIV');
    materialize(input, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual(expectedInnerHTML);
    expect(toHTML(input)).toEqual(expectedHTML);
    if (typeof expectedCode !== 'undefined') { expect(toCode(input)).toEqual(expectedCode); }
  };

  run(
    P('Hello'),
    '<p>Hello</p>',
    '<p>Hello</p>',
    'HTML.P("Hello")',
  );

  run([], '', '', '[]');
  run([null, null], '', '', '[null, null]');

  // Test crazy character references

  // `&zopf;` is "Mathematical double-struck small z" a.k.a. "open-face z"
  run(
    P(CharRef({ html: '&zopf;', str: '\ud835\udd6b' })),
    '<p>\ud835\udd6b</p>',
    '<p>&zopf;</p>',
    'HTML.P(HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"}))',
  );

  run(
    P({ id: CharRef({ html: '&zopf;', str: '\ud835\udd6b' }) }, 'Hello'),
    '<p id="\ud835\udd6b">Hello</p>',
    '<p id="&zopf;">Hello</p>',
    'HTML.P({id: HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"})}, "Hello")',
  );

  run(
    P({ id: [CharRef({ html: '&zopf;', str: '\ud835\udd6b' }), '!'] }, 'Hello'),
    '<p id="\ud835\udd6b!">Hello</p>',
    '<p id="&zopf;!">Hello</p>',
    'HTML.P({id: [HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"}), "!"]}, "Hello")',
  );

  // Test comments

  run(
    DIV(Comment('Test')),
    '<div><!----></div>', // our innerHTML-canonicalization function kills comment contents
    '<div><!--Test--></div>',
    'HTML.DIV(HTML.Comment("Test"))',
  );

  // Test arrays

  run(
    [P('Hello'), P('World')],
    '<p>Hello</p><p>World</p>',
    '<p>Hello</p><p>World</p>',
    '[HTML.P("Hello"), HTML.P("World")]',
  );

  // Test slightly more complicated structure

  run(
    DIV({ class: 'foo' }, UL(
      LI(P(A({ href: '#one' }, 'One'))),
      LI(P('Two', BR(), 'Three')),
    )),
    '<div class="foo"><ul><li><p><a href="#one">One</a></p></li><li><p>Two<br>Three</p></li></ul></div>',
    '<div class="foo"><ul><li><p><a href="#one">One</a></p></li><li><p>Two<br>Three</p></li></ul></div>',
    'HTML.DIV({"class": "foo"}, HTML.UL(HTML.LI(HTML.P(HTML.A({href: "#one"}, "One"))), HTML.LI(HTML.P("Two", HTML.BR(), "Three"))))',
  );

  // Test nully attributes
  run(
    BR({
      x: null,
      y: [[], []],
      a: [['']],
    }),
    '<br a="">',
    '<br a="">',
    'HTML.BR({a: [[""]]})',
  );

  run(
    BR({
      x() { return Blast.View(() => Blast.View(() => [])); },
      a() { return Blast.View(() => Blast.View(() => '')); },
    }),
    '<br a="">',
    '<br a="">',
  );
});

// test that we correctly update the 'value' property on input fields
// rather than the 'value' attribute. the 'value' attribute only sets
// the initial value.
test('blast - render - input - value', () => {
  const R = ReactiveVar('hello');
  const div = document.createElement('DIV');
  materialize(INPUT({ value() { return R.get(); } }), div);
  const inputEl = div.querySelector('input');
  expect(inputEl.value).toEqual('hello');
  inputEl.value = 'goodbye';
  R.set('hola');
  Tracker.flush();
  expect(inputEl.value).toEqual('hola');
});

// test that we correctly update the 'checked' property rather than
// the 'checked' attribute on input fields of type 'checkbox'. the
// 'checked' attribute only sets the initial value.
test('blast - render - input - checked', () => {
  const R = ReactiveVar(null);
  const div = document.createElement('DIV');
  materialize(INPUT({ type: 'checkbox', checked() { return R.get(); } }), div);
  const inputEl = div.querySelector('input');
  expect(inputEl.checked).toEqual(false);
  inputEl.checked = true;

  R.set('checked');
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  expect(inputEl.checked).toEqual(false);
});

test('blast - render - textarea', () => {
  const run = function (optNode, text, html, code) {
    if (typeof optNode === 'string') {
      // called with args (text, html, code)
      code = html;
      html = text;
      text = optNode;
      optNode = null;
    }
    const div = document.createElement('DIV');
    const node = TEXTAREA({ value: optNode || text });
    materialize(node, div);

    let { value } = div.querySelector('textarea');
    value = value.replace(/\r\n/g, '\n'); // IE8 substitutes \n with \r\n
    expect(value).toEqual(text);

    expect(toHTML(node)).toEqual(html);
    if (typeof code === 'string') { expect(toCode(node)).toEqual(code); }
  };

  run(
    'Hello',
    '<textarea>Hello</textarea>',
    'HTML.TEXTAREA({value: "Hello"})',
  );

  run(
    '\nHello',
    '<textarea>\n\nHello</textarea>',
    'HTML.TEXTAREA({value: "\\nHello"})',
  );

  run(
    '</textarea>',
    '<textarea>&lt;/textarea></textarea>',
    'HTML.TEXTAREA({value: "</textarea>"})',
  );

  run(
    CharRef({ html: '&amp;', str: '&' }),
    '&',
    '<textarea>&amp;</textarea>',
    'HTML.TEXTAREA({value: HTML.CharRef({html: "&amp;", str: "&"})})',
  );

  run(
    () => ['a', Blast.View(() => 'b'), 'c'],
    'abc',
    '<textarea>abc</textarea>',
  );

  // test that reactivity of textarea "value" attribute works...
  (function () {
    const R = ReactiveVar('one');
    const div = document.createElement('DIV');
    const node = TEXTAREA({
      value() {
        return Blast.View(() => R.get());
      },
    });
    materialize(node, div);
    const textarea = div.querySelector('textarea');
    expect(textarea.value).toEqual('one');
    R.set('two');
    Tracker.flush();
    expect(textarea.value).toEqual('two');
  }());

  // ... while "content" reactivity simply doesn't update
  // (but doesn't throw either)
  (function () {
    const R = ReactiveVar('one');
    const div = document.createElement('DIV');
    const node = TEXTAREA([Blast.View(() => R.get())]);
    materialize(node, div);
    const textarea = div.querySelector('textarea');
    expect(textarea.value).toEqual('one');
    R.set('two');
    Tracker.flush({ _throwFirstError: true });
    expect(textarea.value).toEqual('one');
  }());
});

test('blast - render - view isolation', () => {
  // Reactively change a text node
  (function () {
    const R = ReactiveVar('Hello');
    const test1 = function () {
      return P(Blast.View(() => R.get()));
    };

    expect(toHTML(test1())).toEqual('<p>Hello</p>');

    const div = document.createElement('DIV');
    materialize(test1, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>Hello</p>');

    R.set('World');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>World</p>');
  }());

  // Reactively change an array of text nodes
  (function () {
    const R = ReactiveVar(['Hello', ' World']);
    const test1 = function () {
      return P(Blast.View(() => R.get()));
    };

    expect(toHTML(test1())).toEqual('<p>Hello World</p>');

    const div = document.createElement('DIV');
    materialize(test1, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>Hello World</p>');

    R.set(['Goodbye', ' World']);
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>Goodbye World</p>');
  }());
});

// IE strips malformed styles like "bar::d" from the `style`
// attribute. We detect this to adjust expectations for the StyleHandler
// test below.
const malformedStylesAllowed = function () {
  const div = document.createElement('div');
  div.setAttribute('style', 'bar::d;');
  return (div.getAttribute('style') === 'bar::d;');
};

test('blast - render - view GC', () => {
  // test that removing parent element removes listeners and stops autoruns.
  (function () {
    const R = ReactiveVar('Hello');
    const test1 = P(Blast.View(() => R.get()));

    const div = document.createElement('DIV');
    materialize(test1, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>Hello</p>');

    R.set('World');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>World</p>');

    expect(R._numListeners()).toEqual(1);

    $(div).remove();

    expect(R._numListeners()).toEqual(0);

    R.set('Steve');
    Tracker.flush();
    // should not have changed:
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>World</p>');
  }());
});

test('blast - render - reactive attributes', () => {
  (function () {
    const R = ReactiveVar({
      class: ['david gre', CharRef({ html: '&euml;', str: '\u00eb' }), 'nspan'],
      id: 'foo',
    });

    const spanFunc = function () {
      return SPAN(HTML.Attrs(
        () => R.get(),
      ));
    };

    expect(Blast.toHTML(spanFunc())).toEqual(
      '<span class="david gre&euml;nspan" id="foo"></span>',
    );

    expect(R._numListeners()).toEqual(0);

    const div = document.createElement('DIV');
    Blast.render(spanFunc, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span class="david gre\u00ebnspan" id="foo"></span>');

    expect(R._numListeners()).toEqual(1);

    const span = div.firstChild;
    expect(span.nodeName).toEqual('SPAN');
    span.className += ' blah'; // change the element's class outside of Blast. this simulates what a jQuery could do

    R.set({ class: 'david smith', id: 'bar' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span class="david smith blah" id="bar"></span>');
    expect(R._numListeners()).toEqual(1);

    R.set({});
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span class="blah"></span>');
    expect(R._numListeners()).toEqual(1);

    $(div).remove();

    expect(R._numListeners()).toEqual(0);
  }());

  (function () {
    const style = ReactiveVar(false);

    const div = document.createElement('DIV');

    const divFunc = function () {
      return DIV({
        style() {
          return [Blast.If(() => style.get(), () => 'background-color: red; '), 'padding: 10px'];
        },
      });
    };

    Blast.render(divFunc, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<div style="padding: 10px"></div>');

    style.set('blue');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<div style="background-color: red; padding: 10px"></div>');

    $(div).remove();

    expect(style._numListeners()).toEqual(0);
  }());

  // Test styles.
  (function () {
    // Test the case where there is a semicolon in the css attribute.
    const R = ReactiveVar({
      style: 'foo: "a;aa"; bar: b;',
      id: 'foo',
    });

    const spanFunc = function () {
      return SPAN(HTML.Attrs(() => R.get()));
    };

    expect(Blast.toHTML(spanFunc())).toEqual('<span style="foo: &quot;a;aa&quot;; bar: b;" id="foo"></span>');

    expect(R._numListeners()).toEqual(0);

    const div = document.createElement('DIV');
    Blast.render(spanFunc, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span id="foo" style="foo: &quot;a;aa&quot;; bar: b"></span>');

    expect(R._numListeners()).toEqual(1);
    const span = div.firstChild;
    expect(span.nodeName).toEqual('SPAN');

    span.setAttribute('style', `${span.getAttribute('style')}; jquery-style: hidden`);

    R.set({ style: 'foo: "a;zz;aa";', id: 'bar' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML, true)).toEqual('<span id="bar" style="foo: &quot;a;zz;aa&quot;; jquery-style: hidden"></span>');
    expect(R._numListeners()).toEqual(1);

    R.set({});
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="jquery-style: hidden"></span>');
    expect(R._numListeners()).toEqual(1);

    $(div).remove();

    expect(R._numListeners()).toEqual(0);
  }());

  // Test that identical styles are successfully overwritten.
  (function () {
    const R = ReactiveVar({ style: 'foo: a;' });

    const spanFunc = function () {
      return SPAN(HTML.Attrs(() => R.get()));
    };

    const div = document.createElement('DIV');
    document.body.appendChild(div);
    Blast.render(spanFunc, div);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="foo: a"></span>');

    const span = div.firstChild;
    expect(span.nodeName).toEqual('SPAN');
    span.setAttribute('style', 'foo: b;');
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="foo: b"></span>');

    R.set({ style: 'foo: c;' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="foo: c"></span>');

    // test malformed styles - different expectations in IE (which
    // strips malformed styles) from other browsers
    R.set({ style: 'foo: a; bar::d;:e; baz: c;' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual(
      malformedStylesAllowed()
        ? '<span style="foo: a; bar::d; baz: c"></span>'
        : '<span style="foo: a; baz: c"></span>',
    );

    // Test strange styles
    R.set({ style: ' foo: c; constructor: a; __proto__: b;' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="foo: c; constructor: a; __proto__: b"></span>');

    R.set({});
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span></span>');

    R.set({ style: 'foo: bar;' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span style="foo: bar"></span>');
  }());

  // Test `null`, `undefined`, and `[]` attributes
  (function () {
    const R = ReactiveVar({
      id: 'foo',
      aaa: null,
      bbb: undefined,
      ccc: [],
      ddd: [null],
      eee: [undefined],
      fff: [[]],
      ggg: ['x', ['y', ['z']]],
    });

    const spanFunc = function () {
      return SPAN(HTML.Attrs(
        () => R.get(),
      ));
    };

    expect(Blast.toHTML(spanFunc())).toEqual('<span id="foo" ggg="xyz"></span>');
    expect(toCode(SPAN(R.get()))).toEqual(
      'HTML.SPAN({id: "foo", ggg: ["x", ["y", ["z"]]]})',
    );

    const div = document.createElement('DIV');
    Blast.render(spanFunc, div);
    const span = div.firstChild;
    expect(span.nodeName).toEqual('SPAN');

    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span ggg="xyz" id="foo"></span>');
    R.set({ id: 'foo', ggg: [[], [], []] });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span id="foo"></span>');

    R.set({ id: 'foo', ggg: null });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span id="foo"></span>');

    R.set({ id: 'foo', ggg: '' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('<span ggg="" id="foo"></span>');

    $(div).remove();

    expect(R._numListeners()).toEqual(0);
  }());
});

test('blast - render - templates and views', () => {
  (function () {
    let counter = 1;
    const buf = [];

    const myTemplate = Template(
      'myTemplate',
      function () {
        return [String(this.number),
          (this.number < 3 ? makeView() : HR())];
      },
    );

    myTemplate.constructView = function (number) {
      const view = Template.prototype.constructView.call(this);
      view.number = number;
      return view;
    };

    myTemplate.created = function () {
      expect(Tracker.active).toBeFalsy();
      const { view } = this;
      const parent = Blast.getView(view, 'myTemplate');
      if (parent) {
        buf.push(`parent of ${view.number} is ${
          parent.number}`);
      }

      buf.push(`created ${Template.currentData()}`);
    };

    myTemplate.onRendered(function () {
      expect(Tracker.active).toBeFalsy();
      const nodeDescr = function (node) {
        if (node.nodeType === 8) // comment
        { return ''; }
        if (node.nodeType === 3) // text
        { return node.nodeValue; }

        return node.nodeName;
      };

      const { view } = this;
      let start = view.firstNode();
      let end = view.lastNode();
      // skip marker nodes
      while (start !== end && !nodeDescr(start)) { start = start.nextSibling; }
      while (end !== start && !nodeDescr(end)) { end = end.previousSibling; }

      buf.push(`dom-${Template.currentData()
      } is ${nodeDescr(start)}..${
        nodeDescr(end)}`);
    });

    myTemplate.onDestroyed(() => {
      expect(Tracker.active).toBeFalsy();
      buf.push(`destroyed ${Template.currentData()}`);
    });

    var makeView = function () {
      const number = counter++;
      return Blast.With(number, () => myTemplate.constructView(number));
    };

    const div = document.createElement('DIV');

    Blast.render(makeView, div);
    buf.push('---flush---');
    Tracker.flush();
    expect(buf).toEqual(['created 1',
      'parent of 2 is 1',
      'created 2',
      'parent of 3 is 2',
      'created 3',
      '---flush---',
      // (proper order for these has not be thought out:)
      'dom-3 is 3..HR',
      'dom-2 is 2..HR',
      'dom-1 is 1..HR']);

    expect(canonicalizeHtml(div.innerHTML)).toEqual('123<hr>');

    buf.length = 0;
    $(div).remove();
    buf.sort();
    expect(buf).toEqual(['destroyed 1', 'destroyed 2', 'destroyed 3']);

    // Now use toHTML.  Should still get most of the callbacks (not `rendered`).

    buf.length = 0;
    counter = 1;

    const html = Blast.toHTML(makeView());

    expect(buf).toEqual(['created 1',
      'parent of 2 is 1',
      'created 2',
      'parent of 3 is 2',
      'created 3',
      'destroyed 3',
      'destroyed 2',
      'destroyed 1']);

    expect(html).toEqual('123<hr>');
  }());
});

test('blast - render - findAll', () => {
  let found = null;
  let $found = null;

  const myTemplate = new Template(
    'findAllTest',
    (() => DIV([P('first'), P('second')])),
  );
  myTemplate.rendered = function () {
    found = this.findAll('p');
    $found = this.$('p');
  };

  const div = document.createElement('DIV');

  Blast.render(myTemplate, div);
  Tracker.flush();

  expect(Array.isArray(found)).toEqual(true);
  expect(Array.isArray($found)).toEqual(false);
  expect(found.length).toEqual(2);
  expect($found.length).toEqual(2);
});

test('blast - render - reactive attributes 2', () => {
  const R1 = ReactiveVar(['foo']);
  const R2 = ReactiveVar(['bar']);

  const spanFunc = function () {
    return SPAN(HTML.Attrs(
      { blah() { return R1.get(); } },
      () => ({ blah: R2.get() }),
    ));
  };

  const div = document.createElement('DIV');
  Blast.render(spanFunc, div);
  const check = function (expected) {
    expect(Blast.toHTML(spanFunc())).toEqual(expected);
    expect(canonicalizeHtml(div.innerHTML)).toEqual(expected);
  };
  check('<span blah="bar"></span>');

  expect(R1._numListeners()).toEqual(1);
  expect(R2._numListeners()).toEqual(1);

  R2.set([[]]);
  Tracker.flush();
  // We combine `['foo']` with what evaluates to `[[[]]]`, which is nully.
  check('<span blah="foo"></span>');

  R2.set([['']]);
  Tracker.flush();
  // We combine `['foo']` with what evaluates to `[[['']]]`, which is non-nully.
  check('<span blah=""></span>');

  R2.set(null);
  Tracker.flush();
  // We combine `['foo']` with `[null]`, which is nully.
  check('<span blah="foo"></span>');

  R1.set([[], []]);
  Tracker.flush();
  // We combine two nully values.
  check('<span></span>');

  R1.set([[], ['foo']]);
  Tracker.flush();
  check('<span blah="foo"></span>');

  // clean up

  $(div).remove();

  expect(R1._numListeners()).toEqual(0);
  expect(R2._numListeners()).toEqual(0);
});

test('blast - render - SVG', () => {
  if (!document.createElementNS) {
    // IE 8
    return;
  }

  const fillColor = ReactiveVar('red');
  const classes = ReactiveVar('one two');

  const content = DIV({ class: 'container' }, HTML.SVG(
    { width: 100, height: 100 },
    HTML.CIRCLE({
      cx: 50,
      cy: 50,
      r: 40,
      stroke: 'black',
      'stroke-width': 3,
      class() { return classes.get(); },
      fill() { return fillColor.get(); },
    }),
  ));

  const div = document.createElement('DIV');
  materialize(content, div);

  const circle = div.querySelector('.container > svg > circle');
  expect(circle.getAttribute('fill')).toEqual('red');
  expect(circle.className.baseVal).toEqual('one two');

  fillColor.set('green');
  classes.set('two three');
  Tracker.flush();
  expect(circle.getAttribute('fill')).toEqual('green');
  expect(circle.className.baseVal).toEqual('two three');

  expect(circle.nodeName).toEqual('circle');
  expect(circle.namespaceURI).toEqual('http://www.w3.org/2000/svg');
  expect(circle.parentNode.namespaceURI).toEqual('http://www.w3.org/2000/svg');
});

test('ui - attributes', () => {
  const { SPAN } = HTML;
  const amp = HTML.CharRef({ html: '&amp;', str: '&' });

  expect(HTML.toHTML(SPAN({ title: ['M', amp, 'Ms'] }, 'M', amp, 'M candies'))).toEqual(
    '<span title="M&amp;Ms">M&amp;M candies</span>',
  );
});

if (typeof MutationObserver !== 'undefined') {
  // This test is not really able to test that Blast._materializeDOM is called only when
  // not Blast._isContentEqual(lastHtmljs, htmljs), which is what we would in fact want to test.
  test('blast - render - optimization', () => {
    const R = ReactiveVar('aa');
    const view = Blast.View(() => R.get().substr(0, 1));

    let renderedCount = 0;
    expect(view.renderCount).toEqual(0);

    view._onViewRendered(() => {
      renderedCount++;
    });

    const test1 = P(view);

    const div = document.createElement('DIV');

    const observedMutations = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        observedMutations.push(mutation);
      });
    });

    observer.observe(div, { childList: true, subtree: true });

    let materializeCount = 0;
    const originalMaterializeDOM = Blast._materializeDOM;
    Blast._materializeDOM = function (htmljs, intoArray, parentView, _existingWorkStack) {
      if (parentView === view) {
        materializeCount++;
      }
      return originalMaterializeDOM(htmljs, intoArray, parentView, _existingWorkStack);
    };

    try {
      materialize(test1, div);
      expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>a</p>');

      expect(view.renderCount).toEqual(1);

      R.set('ab');
      Tracker.flush();
      expect(canonicalizeHtml(div.innerHTML)).toEqual('<p>a</p>');

      expect(view.renderCount).toEqual(2);
      expect(renderedCount).toEqual(1);
    } finally {
      Blast._materializeDOM = originalMaterializeDOM;
    }

    expect(materializeCount).toEqual(1);

    // We have to wait a bit, for mutation observer to run.
    setTimeout(() => {
      // We do not update anything after initial rendering, so only one mutation is there.
      expect(observedMutations.length).toEqual(1);

      $(div).remove();
      observer.disconnect();

      onComplete();
    }, 0);
  });
}
