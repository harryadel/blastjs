const { TemplatingTools } = require("../src/index.js");
const fs = require("fs");
const tags = TemplatingTools.scanHtmlForTags({
  sourceName: "",
  contents: fs.readFileSync(process.argv[2]).toString(),
  tagNames: ["body", "head", "template"]
});
const ret = TemplatingTools.compileTagsWithSpacebars(tags);
console.log(ret.js);
