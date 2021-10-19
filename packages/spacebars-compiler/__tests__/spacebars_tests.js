import { BlastTools } from '@blastjs/blast-tools';
import { SpacebarsCompiler } from '../src/preamble';

test('spacebars-compiler - stache tags', () => {
  const run = function (input, expected) {
    if (typeof expected === 'string') {
      // test for error starting with string `expected`
      let msg = '';
      expect(() => {
        try {
          SpacebarsCompiler.TemplateTag.parse(input);
        } catch (e) {
          msg = e.message;
          throw e;
        }
      }).toThrow();
      expect(msg.slice(0, expected.length)).toEqual(expected);
    } else {
      const result = SpacebarsCompiler.TemplateTag.parse(input);
      expect(result).toEqual(expected);
    }
  };

  run('{{foo}}', { type: 'DOUBLE', path: ['foo'], args: [] });
  run('{{foo3}}', { type: 'DOUBLE', path: ['foo3'], args: [] });
  run('{{{foo}}}', { type: 'TRIPLE', path: ['foo'], args: [] });
  run('{{{foo}}', 'Expected `}}}`');
  run('{{{foo', 'Expected');
  run('{{foo', 'Expected');
  run('{{ {foo}}}', 'Unknown stache tag');
  run('{{{{foo}}}}', 'Unknown stache tag');
  run('{{{>foo}}}', 'Unknown stache tag');
  run('{{>>foo}}', 'Unknown stache tag');
  run('{{! asdf }}', { type: 'COMMENT', value: ' asdf ' });
  run('{{ ! asdf }}', { type: 'COMMENT', value: ' asdf ' });
  run('{{ ! asdf }asdf', 'Unclosed');
  run('{{!-- asdf --}}', { type: 'BLOCKCOMMENT', value: ' asdf ' });
  run('{{ !-- asdf -- }}', { type: 'BLOCKCOMMENT', value: ' asdf ' });
  run('{{ !-- {{asdf}} -- }}', { type: 'BLOCKCOMMENT', value: ' {{asdf}} ' });
  run('{{ !-- {{as--df}} --}}', { type: 'BLOCKCOMMENT', value: ' {{as--df}} ' });
  run('{{ !-- asdf }asdf', 'Unclosed');
  run('{{ !-- asdf --}asdf', 'Unclosed');
  run('{{else}}', { type: 'ELSE' });
  run('{{ else }}', { type: 'ELSE' });
  run('{{ else}}', { type: 'ELSE' });
  run('{{ else x}}', { type: 'ELSE', path: ['x'], args: [] });
  run('{{else_x}}', { type: 'DOUBLE', path: ['else_x'], args: [] });
  run('{{ else else_x}}', { type: 'ELSE', path: ['else_x'], args: [] });
  run('{{/if}}', { type: 'BLOCKCLOSE', path: ['if'] });
  run('{{ / if }}', { type: 'BLOCKCLOSE', path: ['if'] });
  run('{{/if x}}', 'Expected');
  run('{{#if}}', { type: 'BLOCKOPEN', path: ['if'], args: [] });
  run('{{ # if }}', { type: 'BLOCKOPEN', path: ['if'], args: [] });
  run('{{#if_3}}', { type: 'BLOCKOPEN', path: ['if_3'], args: [] });
  run('{{>x}}', { type: 'INCLUSION', path: ['x'], args: [] });
  run('{{ > x }}', { type: 'INCLUSION', path: ['x'], args: [] });
  run('{{>x_3}}', { type: 'INCLUSION', path: ['x_3'], args: [] });

  run('{{foo 3}}', { type: 'DOUBLE', path: ['foo'], args: [['NUMBER', 3]] });
  run('{{ foo  3 }}', { type: 'DOUBLE', path: ['foo'], args: [['NUMBER', 3]] });
  run('{{#foo 3}}', { type: 'BLOCKOPEN', path: ['foo'], args: [['NUMBER', 3]] });
  run('{{ # foo  3 }}', {
    type: 'BLOCKOPEN',
    path: ['foo'],
    args: [['NUMBER', 3]],
  });
  run('{{>foo 3}}', { type: 'INCLUSION', path: ['foo'], args: [['NUMBER', 3]] });
  run('{{ > foo  3 }}', {
    type: 'INCLUSION',
    path: ['foo'],
    args: [['NUMBER', 3]],
  });
  run('{{{foo 3}}}', { type: 'TRIPLE', path: ['foo'], args: [['NUMBER', 3]] });
  run('{{else foo 3}}', { type: 'ELSE', path: ['foo'], args: [['NUMBER', 3]] });

  run('{{foo bar ./foo foo/bar a.b.c baz=qux x3=.}}',
    {
      type: 'DOUBLE',
      path: ['foo'],
      args: [['PATH', ['bar']],
        ['PATH', ['.', 'foo']],
        ['PATH', ['foo', 'bar']],
        ['PATH', ['a', 'b', 'c']],
        ['PATH', ['qux'], 'baz'],
        ['PATH', ['.'], 'x3']],
    });

  // nested expressions
  run('{{helper (subhelper ./arg) arg.sub (args.passedHelper)}}', {
    type: 'DOUBLE',
    path: ['helper'],
    args: [
      [
        'EXPR', {
          type: 'EXPR',
          path: ['subhelper'],
          args: [['PATH', ['.', 'arg']]],
        },
      ], [
        'PATH', ['arg', 'sub'],
      ], [
        'EXPR', {
          type: 'EXPR',
          path: ['args', 'passedHelper'],
          args: [],
        },
      ],
    ],
  });
  run('{{helper (h arg}}', 'Expected `)`');
  run('{{helper (h arg))}}', 'Expected');
  run('{{helper ) h arg}}', 'Expected');
  run('{{(dyn) arg}}', 'Expected ID');

  run('{{{x 0.3 [0].[3] .4 ./[4]}}}',
    {
      type: 'TRIPLE',
      path: ['x'],
      args: [['NUMBER', 0.3],
        ['PATH', ['0', '3']],
        ['NUMBER', 0.4],
        ['PATH', ['.', '4']]],
    });

  run('{{# foo this this.x null z=null}}',
    {
      type: 'BLOCKOPEN',
      path: ['foo'],
      args: [['PATH', ['.']],
        ['PATH', ['.', 'x']],
        ['NULL', null],
        ['NULL', null, 'z']],
    });
  run('{{else foo this this.x null z=null}}',
    {
      type: 'ELSE',
      path: ['foo'],
      args: [['PATH', ['.']],
        ['PATH', ['.', 'x']],
        ['NULL', null],
        ['NULL', null, 'z']],
    });

  run('{{./foo 3}}', { type: 'DOUBLE', path: ['.', 'foo'], args: [['NUMBER', 3]] });
  run('{{this/foo 3}}', { type: 'DOUBLE', path: ['.', 'foo'], args: [['NUMBER', 3]] });
  run('{{../foo 3}}', { type: 'DOUBLE', path: ['..', 'foo'], args: [['NUMBER', 3]] });
  run('{{../../foo 3}}', { type: 'DOUBLE', path: ['...', 'foo'], args: [['NUMBER', 3]] });

  run('{{foo x/..}}', 'Expected');
  run('{{foo x/.}}', 'Expected');

  run('{{#a.b.c}}', {
    type: 'BLOCKOPEN',
    path: ['a', 'b', 'c'],
    args: [],
  });
  run('{{> a.b.c}}', {
    type: 'INCLUSION',
    path: ['a', 'b', 'c'],
    args: [],
  });
  run('{{else a.b.c}}', {
    type: 'ELSE',
    path: ['a', 'b', 'c'],
    args: [],
  });

  run('{{foo.[]/[]}}', {
    type: 'DOUBLE',
    path: ['foo', '', ''],
    args: [],
  });
  run('{{x foo.[=]}}', {
    type: 'DOUBLE',
    path: ['x'],
    args: [['PATH', ['foo', '=']]],
  });
  run('{{[].foo}}', "Path can't start with empty string");

  run('{{foo null}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['NULL', null]],
  });
  run('{{foo false}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['BOOLEAN', false]],
  });
  run('{{foo true}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['BOOLEAN', true]],
  });
  run('{{foo "bar"}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['STRING', 'bar']],
  });
  run("{{foo 'bar'}}", {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['STRING', 'bar']],
  });

  run('{{foo -1 -2}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['NUMBER', -1], ['NUMBER', -2]],
  });

  run('{{x "\'"}}', { type: 'DOUBLE', path: ['x'], args: [['STRING', "'"]] });
  run('{{x \'"\'}}', { type: 'DOUBLE', path: ['x'], args: [['STRING', '"']] });

  run('{{> foo x=1 y=2}}',
    {
      type: 'INCLUSION',
      path: ['foo'],
      args: [['NUMBER', 1, 'x'],
        ['NUMBER', 2, 'y']],
    });
  // spaces around '=' are fine
  run('{{> foo x = 1 y = 2}}',
    {
      type: 'INCLUSION',
      path: ['foo'],
      args: [['NUMBER', 1, 'x'],
        ['NUMBER', 2, 'y']],
    });
  run('{{> foo with-dashes=1 another-one=2}}',
    {
      type: 'INCLUSION',
      path: ['foo'],
      args: [['NUMBER', 1, 'with-dashes'],
        ['NUMBER', 2, 'another-one']],
    });
  run('{{> foo 1="keyword can start with a number"}}',
    {
      type: 'INCLUSION',
      path: ['foo'],
      args: [['STRING', 'keyword can start with a number', '1']],
    });
  run('{{> foo disallow-dashes-in-posarg}}',
    'Expected');
  run('{{> foo disallow-#=1}}',
    'Expected');
  run('{{> foo disallow->=1}}',
    'Expected');
  run('{{> foo disallow-{=1}}',
    'Expected');
  run('{{> foo disallow-(=1}}',
    'Expected');
  run('{{> foo disallow-}=1}}',
    'Expected');
  run('{{> foo disallow-)=1}}',
    'Expected');
  run('{{> foo x=1 y=2 z}}',
    "Can't have a non-keyword argument");

  run('{{true.foo}}', "Can't use");
  run('{{foo.this}}', 'Can only use');
  run('{{./this}}', 'Can only use');
  run('{{../this}}', 'Can only use');

  run('{{foo "="}}', {
    type: 'DOUBLE',
    path: ['foo'],
    args: [['STRING', '=']],
  });

  run('{{| asdf', { type: 'ESCAPE', value: '{{' });
  run('{{{| asdf', { type: 'ESCAPE', value: '{{{' });
  run('{{{{| asdf', { type: 'ESCAPE', value: '{{{{' });
});

/// ///////////////////////////////////////////////

test('spacebars-compiler - parse', () => {
  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "DOUBLE", path: ["foo"]})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{!foo}}'))).toEqual('null');
  expect(BlastTools.toJS(SpacebarsCompiler.parse('x{{!foo}}y'))).toEqual('"xy"');

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{!--foo--}}'))).toEqual('null');
  expect(BlastTools.toJS(SpacebarsCompiler.parse('x{{!--foo--}}y'))).toEqual('"xy"');

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x"})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}{{#bar}}{{/bar}}{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"]})})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('<div>hello</div> {{#foo}}<div>{{#bar}}world{{/bar}}</div>{{/foo}}'))).toEqual(
    '[HTML.DIV("hello"), " ", SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: HTML.DIV(SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"], content: "world"}))})]',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{else}}y{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x", elseContent: "y"})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{else bar}}y{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x", elseContent: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"], content: "y"})})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{else bar}}y{{else}}z{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x", elseContent: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"], content: "y", elseContent: "z"})})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{else bar}}y{{else baz}}q{{else}}z{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x", elseContent: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"], content: "y", elseContent: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["baz"], content: "q", elseContent: "z"})})})',
  );

  expect(BlastTools.toJS(SpacebarsCompiler.parse('{{#foo}}x{{else bar}}{{#baz}}z{{/baz}}{{/foo}}'))).toEqual(
    'SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["foo"], content: "x", elseContent: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["bar"], content: SpacebarsCompiler.TemplateTag({type: "BLOCKOPEN", path: ["baz"], content: "z"})})})',
  );

  expect(() => {
    SpacebarsCompiler.parse('<a {{{x}}}></a>');
  }).toThrow();
  expect(() => {
    SpacebarsCompiler.parse('<a {{#if x}}{{/if}}></a>');
  }).toThrow();
  expect(() => {
    SpacebarsCompiler.parse('<a {{k}}={[v}}></a>');
  }).toThrow();
  expect(() => {
    SpacebarsCompiler.parse('<a x{{y}}></a>');
  }).toThrow();
  expect(() => {
    SpacebarsCompiler.parse('<a x{{y}}=z></a>');
  }).toThrow();
  expect(() => {
    SpacebarsCompiler.parse('<a {{> x}}></a>');
  }).toThrow();

  expect(BlastTools.toJS(SpacebarsCompiler.parse('<a {{! x--}} b=c{{! x}} {{! x}}></a>'))).toEqual('HTML.A({b: "c"})');

  expect(BlastTools.toJS(SpacebarsCompiler.parse('<a {{!-- x--}} b=c{{ !-- x --}} {{!-- x -- }}></a>'))).toEqual('HTML.A({b: "c"})');

  // currently, if there are only comments, the attribute is truthy.  This is
  // because comments are stripped during tokenization.  If we include
  // comments in the token stream, these cases will become falsy for selected.
  expect(BlastTools.toJS(SpacebarsCompiler.parse('<input selected={{!foo}}>'))).toEqual(
    'HTML.INPUT({selected: ""})',
  );
  expect(BlastTools.toJS(SpacebarsCompiler.parse('<input selected={{!foo}}{{!bar}}>'))).toEqual(
    'HTML.INPUT({selected: ""})',
  );
  expect(BlastTools.toJS(SpacebarsCompiler.parse('<input selected={{!--foo--}}>'))).toEqual(
    'HTML.INPUT({selected: ""})',
  );
  expect(BlastTools.toJS(SpacebarsCompiler.parse('<input selected={{!--foo--}}{{!--bar--}}>'))).toEqual(
    'HTML.INPUT({selected: ""})',
  );
});
