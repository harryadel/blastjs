const { TemplatingTools } = require("meteor-blaze-compiler");

module.exports = function(contents) {
  const tags = TemplatingTools.scanHtmlForTags({
    sourceName: "",
    contents: contents,
    tagNames: ["body", "head", "template"]
  });
  const ret = TemplatingTools.compileTagsWithSpacebars(tags);
  return ret.js;
}
