import { HTMLTools } from 'meteor/html-tools';

const { Scanner } = HTMLTools;
const { getComment } = HTMLTools.Parse;
const { getDoctype } = HTMLTools.Parse;
const { getHTMLToken } = HTMLTools.Parse;

// "tokenize" is not really a great operation for real use, because
// it ignores the special content rules for tags like "style" and
// "script".
const tokenize = function (input) {
  const scanner = new Scanner(input);
  const tokens = [];
  while (!scanner.isEOF()) {
    const token = getHTMLToken(scanner);
    if (token) { tokens.push(token); }
  }

  return tokens;
};

test('html-tools - comments', () => {
  const succeed = function (input, content) {
    const scanner = new Scanner(input);
    const result = getComment(scanner);
    expect(result).toBeTruthy();
    expect(scanner.pos).toEqual(content.length + 7);
    expect(result).toEqual({
      t: 'Comment',
      v: content,
    });
  };

  const ignore = function (input) {
    const scanner = new Scanner(input);
    const result = getComment(scanner);
    expect(result).toBeFalsy();
    expect(scanner.pos).toEqual(0);
  };

  const fatal = function (input, messageContains) {
    const scanner = new Scanner(input);
    let error;
    try {
      getComment(scanner);
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    if (error) { expect(messageContains && error.message.indexOf(messageContains) >= 0, error.message).toBeTruthy(); }
  };

  expect(getComment(new Scanner('<!-- hello -->'))).toEqual(
    { t: 'Comment', v: ' hello ' },
  );

  ignore('<!DOCTYPE>');
  ignore('<!-a');
  ignore('<--');
  ignore('<!');
  ignore('abc');
  ignore('<a');

  fatal('<!--', 'Unclosed');
  fatal('<!---', 'Unclosed');
  fatal('<!----', 'Unclosed');
  fatal('<!-- -', 'Unclosed');
  fatal('<!-- --', 'Unclosed');
  fatal('<!-- -- abcd', 'Unclosed');
  fatal('<!-- ->', 'Unclosed');
  fatal('<!-- a--b -->', 'cannot contain');
  fatal('<!--x--->', 'must end at first');

  fatal('<!-- a\u0000b -->', 'cannot contain');
  fatal('<!--\u0000 x-->', 'cannot contain');

  succeed('<!---->', '');
  succeed('<!---x-->', '-x');
  succeed('<!--x-->', 'x');
  succeed('<!-- hello - - world -->', ' hello - - world ');
});

test('html-tools - doctype', () => {
  const succeed = function (input, expectedProps) {
    const scanner = new Scanner(input);
    const result = getDoctype(scanner);
    expect(result).toBeTruthy();
    expect(scanner.pos).toEqual(result.v.length);
    expect(input.slice(0, result.v.length)).toEqual(result.v);
    const actualProps = { ...result };
    delete actualProps.t;
    delete actualProps.v;
    expect(actualProps).toEqual(expectedProps);
  };

  const fatal = function (input, messageContains) {
    const scanner = new Scanner(input);
    let error;
    try {
      getDoctype(scanner);
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    if (messageContains) { expect(error.message.indexOf(messageContains) >= 0, error.message).toBeTruthy(); }
  };

  expect(getDoctype(new Scanner('<!DOCTYPE html>x'))).toEqual(
    {
      t: 'Doctype',
      v: '<!DOCTYPE html>',
      name: 'html',
    },
  );

  expect(getDoctype(new Scanner("<!DOCTYPE html SYSTEM 'about:legacy-compat'>x"))).toEqual(
    {
      t: 'Doctype',
      v: "<!DOCTYPE html SYSTEM 'about:legacy-compat'>",
      name: 'html',
      systemId: 'about:legacy-compat',
    },
  );

  expect(getDoctype(new Scanner("<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.0//EN'>x"))).toEqual(
    {
      t: 'Doctype',
      v: "<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.0//EN'>",
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
    },
  );

  expect(getDoctype(new Scanner("<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.0//EN' 'http://www.w3.org/TR/html4/strict.dtd'>x"))).toEqual(
    {
      t: 'Doctype',
      v: "<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.0//EN' 'http://www.w3.org/TR/html4/strict.dtd'>",
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
      systemId: 'http://www.w3.org/TR/html4/strict.dtd',
    },
  );

  succeed('<!DOCTYPE html>', { name: 'html' });
  succeed('<!DOCTYPE htML>', { name: 'html' });
  succeed('<!DOCTYPE HTML>', { name: 'html' });
  succeed('<!doctype html>', { name: 'html' });
  succeed('<!doctYPE html>', { name: 'html' });
  succeed('<!DOCTYPE html \u000c>', { name: 'html' });
  fatal('<!DOCTYPE', 'Expected space');
  fatal('<!DOCTYPE ', 'Malformed DOCTYPE');
  fatal('<!DOCTYPE  ', 'Malformed DOCTYPE');
  fatal('<!DOCTYPE>', 'Expected space');
  fatal('<!DOCTYPE >', 'Malformed DOCTYPE');
  fatal('<!DOCTYPE\u0000', 'Expected space');
  fatal('<!DOCTYPE \u0000', 'Malformed DOCTYPE');
  fatal('<!DOCTYPE html\u0000>', 'Malformed DOCTYPE');
  fatal('<!DOCTYPE html', 'Malformed DOCTYPE');

  succeed('<!DOCTYPE html SYSTEM "about:legacy-compat">', { name: 'html', systemId: 'about:legacy-compat' });
  succeed('<!doctype HTML system "about:legacy-compat">', { name: 'html', systemId: 'about:legacy-compat' });
  succeed("<!DOCTYPE html SYSTEM 'about:legacy-compat'>", { name: 'html', systemId: 'about:legacy-compat' });
  succeed("<!dOcTyPe HtMl sYsTeM 'about:legacy-compat'>", { name: 'html', systemId: 'about:legacy-compat' });
  succeed('<!DOCTYPE  html\tSYSTEM\t"about:legacy-compat"   \t>', { name: 'html', systemId: 'about:legacy-compat' });
  fatal('<!DOCTYPE html SYSTE "about:legacy-compat">', 'Expected PUBLIC or SYSTEM');
  fatal('<!DOCTYPE html SYSTE', 'Expected PUBLIC or SYSTEM');
  fatal('<!DOCTYPE html SYSTEM"about:legacy-compat">', 'Expected space');
  fatal('<!DOCTYPE html SYSTEM');
  fatal('<!DOCTYPE html SYSTEM ');
  fatal('<!DOCTYPE html SYSTEM>');
  fatal('<!DOCTYPE html SYSTEM >');
  fatal('<!DOCTYPE html SYSTEM ">">');
  fatal('<!DOCTYPE html SYSTEM "\u0000about:legacy-compat">');
  fatal('<!DOCTYPE html SYSTEM "about:legacy-compat\u0000">');
  fatal('<!DOCTYPE html SYSTEM "');
  fatal('<!DOCTYPE html SYSTEM "">');
  fatal('<!DOCTYPE html SYSTEM \'');
  fatal('<!DOCTYPE html SYSTEM\'a\'>');
  fatal('<!DOCTYPE html SYSTEM about:legacy-compat>');

  succeed('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0//EN">',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
    });
  succeed('<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.0//EN\'>',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
    });
  succeed('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0//EN" "http://www.w3.org/TR/REC-html40/strict.dtd">',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
      systemId: 'http://www.w3.org/TR/REC-html40/strict.dtd',
    });
  succeed('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0//EN" \'http://www.w3.org/TR/REC-html40/strict.dtd\'>',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
      systemId: 'http://www.w3.org/TR/REC-html40/strict.dtd',
    });
  succeed('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' \'http://www.w3.org/TR/REC-html40/strict.dtd\'>',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
      systemId: 'http://www.w3.org/TR/REC-html40/strict.dtd',
    });
  succeed('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\'\t\'http://www.w3.org/TR/REC-html40/strict.dtd\'   >',
    {
      name: 'html',
      publicId: '-//W3C//DTD HTML 4.0//EN',
      systemId: 'http://www.w3.org/TR/REC-html40/strict.dtd',
    });
  fatal('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' \'http://www.w3.org/TR/REC-html40/strict.dtd\'');
  fatal('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' \'http://www.w3.org/TR/REC-html40/strict.dtd\'');
  fatal('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' \'http://www.w3.org/TR/REC-html40/strict.dtd');
  fatal('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' \'');
  fatal('<!DOCTYPE html public \'-//W3C//DTD HTML 4.0//EN\' ');
  fatal('<!DOCTYPE html public \'- ');
  fatal('<!DOCTYPE html public>');
  fatal('<!DOCTYPE html public "-//W3C//DTD HTML 4.0//EN""http://www.w3.org/TR/REC-html40/strict.dtd">');
});

test('html-tools - tokenize', () => {
  const fatal = function (input, messageContains) {
    let error;
    try {
      tokenize(input);
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    if (messageContains) { expect(error.message.indexOf(messageContains) >= 0, error.message).toBeTruthy(); }
  };

  expect(tokenize('')).toEqual([]);
  expect(tokenize('abc')).toEqual([{ t: 'Chars', v: 'abc' }]);
  expect(tokenize('&')).toEqual([{ t: 'Chars', v: '&' }]);
  expect(tokenize('&amp;')).toEqual([{ t: 'CharRef', v: '&amp;', cp: [38] }]);
  expect(tokenize('ok&#32;fine')).toEqual(
    [{ t: 'Chars', v: 'ok' },
      { t: 'CharRef', v: '&#32;', cp: [32] },
      { t: 'Chars', v: 'fine' }],
  );

  expect(tokenize('a<!--b-->c')).toEqual(
    [{
      t: 'Chars',
      v: 'a',
    },
    {
      t: 'Comment',
      v: 'b',
    },
    {
      t: 'Chars',
      v: 'c',
    }],
  );

  expect(tokenize('<a>')).toEqual([{ t: 'Tag', n: 'a' }]);

  fatal('<');
  fatal('<x');
  fatal('<x ');
  fatal('<x a');
  fatal('<x a ');
  fatal('<x a =');
  fatal('<x a = ');
  fatal('<x a = b');
  fatal('<x a = "b');
  fatal('<x a = \'b');
  fatal('<x a = b ');
  fatal('<x a = b /');
  expect(tokenize('<x a = b />')).toEqual(
    [{
      t: 'Tag',
      n: 'x',
      attrs: { a: [{ t: 'Chars', v: 'b' }] },
      isSelfClosing: true,
    }],
  );

  expect(tokenize('<a>X</a>')).toEqual(
    [{ t: 'Tag', n: 'a' },
      { t: 'Chars', v: 'X' },
      { t: 'Tag', n: 'a', isEnd: true }],
  );

  fatal('<x a a>'); // duplicate attribute value
  expect(tokenize('<a b  >')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [] } }],
  );
  fatal('< a>');
  fatal('< /a>');
  fatal('</ a>');

  // Slash does not end an unquoted attribute, interestingly
  expect(tokenize('<a b=/>')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [{ t: 'Chars', v: '/' }] } }],
  );

  expect(tokenize('<a b="c" d=e f=\'g\' h \t>')).toEqual(
    [{
      t: 'Tag',
      n: 'a',
      attrs: {
        b: [{ t: 'Chars', v: 'c' }],
        d: [{ t: 'Chars', v: 'e' }],
        f: [{ t: 'Chars', v: 'g' }],
        h: [],
      },
    }],
  );

  fatal('</a b="c" d=e f=\'g\' h \t\u0000>');
  fatal('</a b="c" d=ef=\'g\' h \t>');
  fatal('</a b="c"d=e f=\'g\' h \t>');

  expect(tokenize('<a/>')).toEqual([{ t: 'Tag', n: 'a', isSelfClosing: true }]);

  fatal('<a/ >');
  fatal('<a/b>');
  fatal('<a b=c`>');
  fatal('<a b=c<>');

  expect(tokenize('<a# b0="c@" d1=e2 f#=\'g  \' h \t>')).toEqual(
    [{
      t: 'Tag',
      n: 'a#',
      attrs: {
        b0: [{ t: 'Chars', v: 'c@' }],
        d1: [{ t: 'Chars', v: 'e2' }],
        'f#': [{ t: 'Chars', v: 'g  ' }],
        h: [],
      },
    }],
  );

  expect(tokenize('<div class=""></div>')).toEqual(
    [{ t: 'Tag', n: 'div', attrs: { class: [] } },
      { t: 'Tag', n: 'div', isEnd: true }],
  );

  expect(tokenize('<div class="&">')).toEqual(
    [{ t: 'Tag', n: 'div', attrs: { class: [{ t: 'Chars', v: '&' }] } }],
  );
  expect(tokenize('<div class=&>')).toEqual(
    [{ t: 'Tag', n: 'div', attrs: { class: [{ t: 'Chars', v: '&' }] } }],
  );
  expect(tokenize('<div class=&amp;>')).toEqual(
    [{ t: 'Tag', n: 'div', attrs: { class: [{ t: 'CharRef', v: '&amp;', cp: [38] }] } }],
  );

  expect(tokenize('<div class=aa&&zopf;&acE;&bb>')).toEqual(
    [{
      t: 'Tag',
      n: 'div',
      attrs: {
        class: [
          { t: 'Chars', v: 'aa&' },
          { t: 'CharRef', v: '&zopf;', cp: [120171] },
          { t: 'CharRef', v: '&acE;', cp: [8766, 819] },
          { t: 'Chars', v: '&bb' },
        ],
      },
    }],
  );

  expect(tokenize('<div class="aa &&zopf;&acE;& bb">')).toEqual(
    [{
      t: 'Tag',
      n: 'div',
      attrs: {
        class: [
          { t: 'Chars', v: 'aa &' },
          { t: 'CharRef', v: '&zopf;', cp: [120171] },
          { t: 'CharRef', v: '&acE;', cp: [8766, 819] },
          { t: 'Chars', v: '& bb' },
        ],
      },
    }],
  );

  expect(tokenize('<a b="\'`<>&">')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [{ t: 'Chars', v: '\'`<>&' }] } }],
  );
  expect(tokenize('<a b=\'"`<>&\'>')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [{ t: 'Chars', v: '"`<>&' }] } }],
  );

  fatal('&gt');
  fatal('&gtc');
  expect(tokenize('<a b=&gtc>')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [{ t: 'Chars', v: '&gtc' }] } }],
  );
  expect(tokenize('<a b="&gtc">')).toEqual(
    [{ t: 'Tag', n: 'a', attrs: { b: [{ t: 'Chars', v: '&gtc' }] } }],
  );
  fatal('<a b=&gt>');
  fatal('<a b="&gt">');
  fatal('<a b="&gt=">');

  fatal('<!');
  fatal('<!x>');

  fatal('<a{{b}}>');
  fatal('<{{a}}>');
  fatal('</a b=c>'); // end tag can't have attributes
  fatal('</a/>'); // end tag can't be self-closing
  fatal('</a  />');
});
