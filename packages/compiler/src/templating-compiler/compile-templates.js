import TemplatingTools from "../templating-tools/templating-tools.js";

const compiler = new CachingHtmlCompiler(
  "templating",
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars
);

try {
  const tags = TemplatingTools.scanHtmlForTags({
    sourceName: inputPath,
    contents: contents,
    tagNames: ["body", "head", "template"]
  });

  return TemplatingTools.compileTagsWithSpacebars(tags);
}
catch (e) {
  if (e instanceof TemplatingTools.CompileError) {
    inputFile.error({
      message: e.message,
      line: e.line
    });
    return null;
  } else {
    throw e;
  }
}
