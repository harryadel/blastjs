const { HtmlScan } = require("./html-scanner");
const { generateTemplateJS, generateBodyJS } = require("./code-generation.js");
const { compileTagsWithSpacebars } = require("./compile-tags-with-spacebars.js");
const { TemplatingTools: tt } = require("./object.js");

tt.scanHtmlForTags = function scanHtmlForTags(options) {
  const scan = new HtmlScan(options);
  return scan.getTags();
};
tt.throwCompileError = function throwCompileError(tag, message, overrideIndex) {
  const finalIndex = (typeof overrideIndex === 'number' ?
    overrideIndex : tag.tagStartIndex);

  const err = new tt.CompileError();
  err.message = message || "bad formatting in template file";
  err.file = tag.sourceName;
  err.line = tag.fileContents.substring(0, finalIndex).split('\n').length;
  throw err;
};
tt.compileTagsWithSpacebars = compileTagsWithSpacebars;
tt.generateBodyJS = generateBodyJS;
tt.generateTemplateJS = generateTemplateJS;
tt.throwCompileError = function() {
  console.error(arguments);
};
// This type of error should be thrown during compilation
tt.CompileError = class CompileError {};

module.exports = tt;
