import { TemplatingTools } from '../src/templating-tools';

test("templating-tools - html scanner", function () {
  // returns the appropriate code to put content in the body,
  // where content is something simple like the string "Hello"
  // (passed in as a source string including the quotes).
  var simpleBody = function (content) {
    return "\nTemplate.body.addContent((function() {\n  var view = this;\n  return " + content + ";\n}));\nMeteor.startup(Template.body.renderToDocument);\n";
  };

  // arguments are quoted strings like '"hello"'
  var simpleTemplate = function (templateName, content) {
    // '"hello"' into '"Template.hello"'
    var viewName = templateName.slice(0, 1) + 'Template.' + templateName.slice(1);

    return '\nTemplate.__checkName(' + templateName + ');\nTemplate[' + templateName +
      '] = new Template(' + viewName +
      ', (function() {\n  var view = this;\n  return ' + content + ';\n}));\n';
  };

  var checkResults = function (results, expectJs, expectHead, expectBodyAttrs) {
    expect(results.body).toEqual('');
    expect(results.js).toEqual(expectJs || '');
    expect(results.head).toEqual(expectHead || '');
    expect(results.bodyAttrs).toEqual(expectBodyAttrs || {});
  };

  function scanForTest(contents) {
    const tags = TemplatingTools.scanHtmlForTags({
      sourceName: "",
      contents: contents,
      tagNames: ["body", "head", "template"]
    });

    return TemplatingTools.compileTagsWithSpacebars(tags);
  }

  expect(function () {
    return scanForTest("asdf");
  }).toThrowError("Expected one of: <body>, <head>, <template>");

  // body all on one line
  checkResults(
    scanForTest("<body>Hello</body>"),
    simpleBody('"Hello"')
  );

  // multi-line body, contents trimmed
  checkResults(
    scanForTest("\n\n\n<body>\n\nHello\n\n</body>\n\n\n"),
    simpleBody('"Hello"')
  );

  // same as previous, but with various HTML comments
  checkResults(
    scanForTest("\n<!--\n\nfoo\n-->\n<!-- -->\n" +
      "<body>\n\nHello\n\n</body>\n\n<!----\n>\n\n"),
    simpleBody('"Hello"')
  );

  // head and body
  checkResults(
    scanForTest("<head>\n<title>Hello</title>\n</head>\n\n<body>World</body>\n\n"),
    simpleBody('"World"'),
    "<title>Hello</title>"
  );

  // head and body with tag whitespace
  checkResults(
    scanForTest("<head\n>\n<title>Hello</title>\n</head  >\n\n<body>World</body\n\n>\n\n"),
    simpleBody('"World"'),
    "<title>Hello</title>"
  );

  // head, body, and template
  checkResults(
    scanForTest("<head>\n<title>Hello</title>\n</head>\n\n<body>World</body>\n\n" +
      '<template name="favoritefood">\n  pizza\n</template>\n'),
    simpleBody('"World"') + simpleTemplate('"favoritefood"', '"pizza"'),
    "<title>Hello</title>"
  );

  // one-line template
  checkResults(
    scanForTest('<template name="favoritefood">pizza</template>'),
    simpleTemplate('"favoritefood"', '"pizza"')
  );

  // template with other attributes
  checkResults(
    scanForTest('<template foo="bar" name="favoritefood" baz="qux">' +
      'pizza</template>'),
    simpleTemplate('"favoritefood"', '"pizza"')
  );

  // whitespace around '=' in attributes and at end of tag
  checkResults(
    scanForTest('<template foo = "bar" name  ="favoritefood" baz= "qux"  >' +
      'pizza</template\n\n>'),
    simpleTemplate('"favoritefood"', '"pizza"')
  );

  // whitespace around template name
  checkResults(
    scanForTest('<template name=" favoritefood  ">pizza</template>'),
    simpleTemplate('"favoritefood"', '"pizza"')
  );

  // single quotes around template name
  checkResults(
    scanForTest('<template name=\'the "cool" template\'>' +
      'pizza</template>'),
    simpleTemplate('"the \\"cool\\" template"', '"pizza"')
  );

  checkResults(
    scanForTest('<body foo="bar">\n  Hello\n</body>'),
    simpleBody('"Hello"'), "", { foo: "bar" }
    );

  // error cases; exact line numbers are not critical, these just reflect
  // the current implementation

  // unclosed body (error mentions body)
  expect(function () {
    return scanForTest("\n\n<body>\n  Hello\n</body");
  }).toThrowError("body");

  // bad open tag
  expect(function () {
    return scanForTest("\n\n\n<bodyd>\n  Hello\n</body>");
  }).toThrowError("Expected one of: <body>, <head>, <template>");

  expect(function () {
    return scanForTest("\n\n\n\n<body foo=>\n  Hello\n</body>");
  }).toThrowError("error in tag");

  // unclosed tag
  expect(function () {
    return scanForTest("\n<body>Hello");
  }).toThrowError("nclosed");

  // unnamed template
  expect(function () {
    return scanForTest(
      "\n\n<template>Hi</template>\n\n<template>Hi</template>");
  }).toThrowError("name");

  // helpful doctype message
  expect(function () {
    return scanForTest(
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
      '"http://www.w3.org/TR/html4/strict.dtd">' +
      '\n\n<head>\n</head>');
  }).toThrowError("DOCTYPE");

  // lowercase basic doctype
  expect(function () {
    return scanForTest(
      '<!doctype html>');
  }).toThrowError("DOCTYPE");

  // attributes on head not supported
  expect(function () {
    return scanForTest('<head foo="bar">\n  Hello\n</head>');
  }).toThrowError("<head>");

  // can't mismatch quotes
  expect(function () {
    return scanForTest('<template name="foo\'>' +
      'pizza</template>');
  }).toThrowError("error in tag");

  // unexpected <html> at top level
  expect(function () {
    return scanForTest('\n<html>\n</html>');
  }).toThrowError("Expected one of: <body>, <head>, <template>");

});