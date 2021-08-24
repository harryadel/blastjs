import { SpacebarsCompiler } from '../src/preamble';

export function runCompilerOutputTests(run) {
  run("abc", `function () {
  var view = this;
  return "abc";
}`);
  run("{{foo}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"));
  });
}`);
  run("{{foo bar}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"),
                              view.lookup("bar"));
  });
}`);
  run("{{foo x=bar}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"), Spacebars.kw({
      x: view.lookup("bar")
    }));
  });
}`);
  run("{{foo.bar baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo.bar", function() {
    return Spacebars.mustache(Spacebars.dot(
             view.lookup("foo"), "bar"),
             view.lookup("baz"));
  });
}`);
  run("{{foo.bar (baz qux)}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo.bar", function() {
    return Spacebars.mustache(Spacebars.dot(
             view.lookup("foo"), "bar"),
             Spacebars.dataMustache(view.lookup("baz"), view.lookup("qux")));
  });
}`);
  run("{{foo bar.baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"),
           Spacebars.dot(view.lookup("bar"), "baz"));
  });
}`);
  run("{{foo x=bar.baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"), Spacebars.kw({
      x: Spacebars.dot(view.lookup("bar"), "baz")
    }));
  });
}`);
  run("{{#foo}}abc{{/foo}}", `function() {
  var view = this;
  return Spacebars.include(view.lookupTemplate("foo"), (function() {
    return "abc";
  }));
}`);
  run("{{#if cond}}aaa{{else}}bbb{{/if}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return "aaa";
  }), (function() {
    return "bbb";
  }));
}`);
  run("{{!-- --}}{{#if cond}}aaa{{!\n}}{{else}}{{!}}bbb{{!-- --}}{{/if}}{{!}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return "aaa";
  }), (function() {
    return "bbb";
  }));
}`);
  run("{{!-- --}}{{#if cond}}<p>aaa</p><p>ppp</p>{{!\n}}{{else}}{{!}}<p>{{bbb}}</p>{{!-- --}}{{/if}}{{!}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return HTML.Raw("<p>aaa</p><p>ppp</p>");
  }), (function() {
    return HTML.P(Blaze.View("lookup:bbb", function() {
      return Spacebars.mustache(view.lookup("bbb"));
    }));
  }));
}`);
  run("{{> foo bar}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("bar"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo x=bar}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      x: Spacebars.call(view.lookup("bar"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}
`);
  run("{{> foo bar.baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("bar"), "baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo x=bar.baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      x: Spacebars.call(Spacebars.dot(view.lookup("bar"), "baz"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo bar baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(view.lookup("bar"), view.lookup("baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}
`);
  run("{{#foo bar baz}}aaa{{/foo}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(view.lookup("bar"), view.lookup("baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"), (function() {
      return "aaa";
    }));
  });
}`);
  run("{{#foo p.q r.s}}aaa{{/foo}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(Spacebars.dot(view.lookup("p"), "q"), Spacebars.dot(view.lookup("r"), "s"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"), (function() {
      return "aaa";
    }));
  });
}`);
  run("<a {{b}}></a>", `function() {
  var view = this;
  return HTML.A(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("b"));
  }));
}`);
  run("<a {{b}} c=d{{e}}f></a>", `function() {
  var view = this;
  return HTML.A(HTML.Attrs({
    c: (function() { return [
      "d",
      Spacebars.mustache(view.lookup("e")),
      "f" ]; })
  }, function() {
    return Spacebars.attrMustache(view.lookup("b"));
  }));
}`);
  run("<asdf>{{foo}}</asdf>", `function() {
  var view = this;
  return HTML.getTag("asdf")(Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"));
  }));
}`);
  run("<textarea>{{foo}}</textarea>", `function() {
  var view = this;
  return HTML.TEXTAREA({value: (function () {
    return Spacebars.mustache(view.lookup("foo"));
  }) });
}`);
  run("<textarea>{{{{|{{|foo}}</textarea>", `function() {
  var view = this;
  return HTML.TEXTAREA({value: (function () {
    return [ "{{{{", "{{", "foo}}" ];
  }) });
}`);
  run("{{|foo}}", `function() {
  var view = this;
  return [ "{{", "foo}}" ];
}`);
  run("<a b={{{|></a>", `function() {
  var view = this;
  return HTML.A({
    b: (function () {
      return "{{{";
    })
  });
}`);
  run("<div><div>{{helper}}<div>a</div><div>b</div></div></div>", `function() {
  var view = this;
  return HTML.DIV(HTML.DIV(Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
  }), HTML.Raw("<div>a</div><div>b</div>")));
}`);
  run("<table><colgroup><col></colgroup><tr><td>aaa</td><td>bbb</td></tr></table>", `function() {
  var view = this;
  return HTML.TABLE(
    HTML.Raw("<colgroup><col></colgroup>"),
    HTML.TR(HTML.Raw("<td>aaa</td><td>bbb</td>"))
  );
}`);
  run(`<div>
    {{helper}}
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    "\\n    ",
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    }),
    "\\n"
  );
}`);
  run(`<div>
    {{helper}}
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    })
  );
}`, 'strip');
  run(`<div>
    {{helper}}
    <span>Test</span> <span>Spaces</span>
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    }),
    HTML.Raw("<span>Test</span> <span>Spaces</span>")
  );
}`, 'strip');
}

// test("spacebars-compiler - compiler output", function () {

//   var run = function (input, expected, whitespace = '') {
//     if (expected.fail) {
//       var expectedMessage = expected.fail;
//       // test for error starting with expectedMessage
//       var msg = '';
//       test.throws(function () {
//         try {
//           SpacebarsCompiler.compile(input, {isTemplate: true, whitespace});
//         } catch (e) {
//           msg = e.message;
//           throw e;
//         }
//       });
//       expect(msg.slice(0, expectedMessage.length)).toEqual(expectedMessage);
//     } else {
//       var output = SpacebarsCompiler.compile(input, {isTemplate: true, whitespace});
//       var postProcess = function (string) {
//         // remove initial and trailing parens
//         string = string.replace(/^\(([\S\s]*)\)$/, '$1');
//         if (! (Package['minifier-js'] && Package['minifier-js'].UglifyJSMinify)) {
//           // these tests work a lot better with access to beautification,
//           // but let's at least do some sort of test without it.
//           // These regexes may have to be adjusted if new tests are added.

//           // ======================== !!NOTE!! =================================
//           // Since we are bringing uglify-js in from NPM, this code should no
//           // longer ever be needed. Leaving it just in case.
//           // ==================================+================================

//           // Remove single-line comments, including line nums from build system.
//           string = string.replace(/\/\/.*$/mg, '');
//           string = string.replace(/\s+/g, ''); // kill whitespace
//         }
//         return string;
//       };
//       // compare using Function .toString()!
//       test._stringEqual(
//         postProcess(output.toString()),
//         postProcess(
//           SpacebarsCompiler._beautify('(' + expected.toString() + ')')),
//         input);
//     }
//   };

//   runCompilerOutputTests(run);
// });


test("spacebars-compiler - compiler errors", function () {

  var getError = function (input) {
    try {
      SpacebarsCompiler.compile(input);
    } catch (e) {
      return e.message;
    }
    test.fail("Didn't throw an error: " + input);
    return '';
  };

  var assertStartsWith = function (a, b) {
    expect(a.substring(0, b.length)).toEqual(b);
  };

  var isError = function (input, errorStart) {
    assertStartsWith(getError(input), errorStart);
  };

  isError("<input></input>",
          "Unexpected HTML close tag.  <input> should have no close tag.");
  isError("{{#each foo}}<input></input>{{/foo}}",
          "Unexpected HTML close tag.  <input> should have no close tag.");

  isError("{{#if}}{{/if}}", "#if requires an argument");
  isError("{{#with}}{{/with}}", "#with requires an argument");
  isError("{{#each}}{{/each}}", "#each requires an argument");
  isError("{{#unless}}{{/unless}}", "#unless requires an argument");

  isError("{{0 0}}", "Expected IDENTIFIER");

  isError("{{> foo 0 0}}",
          "First argument must be a function");
  isError("{{> foo 0 x=0}}",
          "First argument must be a function");
  isError("{{#foo 0 0}}{{/foo}}",
          "First argument must be a function");
  isError("{{#foo 0 x=0}}{{/foo}}",
          "First argument must be a function");

  ['asdf</br>', '{{!foo}}</br>', '{{!foo}} </br>',
          'asdf</a>', '{{!foo}}</a>', '{{!foo}} </a>'].forEach(
            function (badFrag) {
            isError(badFrag, "Unexpected HTML close tag");
          });

  isError("{{#let myHelper}}{{/let}}", "Incorrect form of #let");
  isError("{{#each foo in.in bar}}{{/each}}", "Malformed #each");
  isError("{{#each foo.bar in baz}}{{/each}}", "Bad variable name in #each");
  isError("{{#each ../foo in baz}}{{/each}}", "Bad variable name in #each");
  isError("{{#each 3 in baz}}{{/each}}", "Bad variable name in #each");

  isError("{{#foo}}x{{else bar}}y{{else}}z{{else baz}}q{{/foo}}", "Unexpected else after {{else}}");
  isError("{{#foo}}x{{else bar}}y{{else}}z{{else}}q{{/foo}}", "Unexpected else after {{else}}");

  // errors using `{{> React}}`
  isError("{{> React component=emptyComponent}}",
          "{{> React}} must be used in a container element");
  isError("<div>{{#if include}}{{> React component=emptyComponent}}{{/if}}</div>",
          "{{> React}} must be used in a container element");
  isError("<div><div>Sibling</div>{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
  isError("<div>Sibling{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
  isError("<div>{{#if sibling}}Sibling{{/if}}{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
});
