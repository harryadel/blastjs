import { HTMLTools } from '@blastjs/html-tools';
import { HTML } from '@blastjs/htmljs';
import { BlastTools } from '@blastjs/blast-tools';
import { CodeGen } from './codegen';
import { optimize } from './optimizer';
import { ReactComponentSiblingForbidder } from './react';
import { TemplateTag } from './templatetag';
import { removeWhitespace } from './whitespace';

const UglifyJSMinify = require('uglify-js').minify;

export function parse(input) {
  return HTMLTools.parseFragment(
    input,
    { getTemplateTag: TemplateTag.parseCompleteTag },
  );
}

export function compile(input, options) {
  const tree = parse(input);
  return codeGen(tree, options);
}

export const TemplateTagReplacer = HTML.TransformingVisitor.extend();
TemplateTagReplacer.def({
  visitObject(x) {
    if (x instanceof HTMLTools.TemplateTag) {
      // Make sure all TemplateTags in attributes have the right
      // `.position` set on them.  This is a bit of a hack
      // (we shouldn't be mutating that here), but it allows
      // cleaner codegen of "synthetic" attributes like TEXTAREA's
      // "value", where the template tags were originally not
      // in an attribute.
      if (this.inAttributeValue) x.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;

      return this.codegen.codeGenTemplateTag(x);
    }

    return HTML.TransformingVisitor.prototype.visitObject.call(this, x);
  },
  visitAttributes(attrs) {
    if (attrs instanceof HTMLTools.TemplateTag) return this.codegen.codeGenTemplateTag(attrs);

    // call super (e.g. for case where `attrs` is an array)
    return HTML.TransformingVisitor.prototype.visitAttributes.call(this, attrs);
  },
  visitAttribute(name, value, tag) {
    this.inAttributeValue = true;
    const result = this.visit(value);
    this.inAttributeValue = false;

    if (result !== value) {
      // some template tags must have been replaced, because otherwise
      // we try to keep things `===` when transforming.  Wrap the code
      // in a function as per the rules.  You can't have
      // `{id: Blast.View(...)}` as an attributes dict because the View
      // would be rendered more than once; you need to wrap it in a function
      // so that it's a different View each time.
      return BlastTools.EmitCode(this.codegen.codeGenBlock(result));
    }
    return result;
  },
});

export function codeGen(parseTree, options) {
  // is this a template, rather than a block passed to
  // a block helper, say
  const isTemplate = (options && options.isTemplate);
  const isBody = (options && options.isBody);
  const whitespace = (options && options.whitespace);
  const sourceName = (options && options.sourceName);

  let tree = parseTree;

  // The flags `isTemplate` and `isBody` are kind of a hack.
  if (isTemplate || isBody) {
    if (typeof whitespace === 'string' && whitespace.toLowerCase() === 'strip') {
      tree = removeWhitespace(tree);
    }
    // optimizing fragments would require being smarter about whether we are
    // in a TEXTAREA, say.
    tree = optimize(tree);
  }

  // throws an error if using `{{> React}}` with siblings
  new ReactComponentSiblingForbidder({ sourceName })
    .visit(tree);

  const codegen = new CodeGen();
  tree = (new TemplateTagReplacer(
    { codegen },
  )).visit(tree);

  let code = '(function () { ';
  if (isTemplate || isBody) {
    code += 'var view = this; ';
  }
  code += 'return ';
  code += BlastTools.toJS(tree);
  code += '; })';

  code = beautify(code);

  return code;
}

export function beautify(code) {
  if (!UglifyJSMinify) {
    return code;
  }

  const result = UglifyJSMinify(code, {
    fromString: true,
    mangle: false,
    compress: false,
    output: {
      beautify: true,
      indent_level: 2,
      width: 80,
    },
  });

  let output = result.code;
  // Uglify interprets our expression as a statement and may add a semicolon.
  // Strip trailing semicolon.
  output = output.replace(/;$/, '');
  return output;
}
