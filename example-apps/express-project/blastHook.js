const hook = require('node-hook');
const { TemplatingTools } = require('@blastjs/templating-tools');

function logLoadedFilename(source, filename) {
  const tags = TemplatingTools.scanHtmlForTags({
    sourceName: filename,
    contents: source,
    tagNames: ['body', 'head', 'template'],
  });
  const ret = TemplatingTools.compileTagsWithSpacebars(tags);
  return ret.js;
}
hook.hook('.html', logLoadedFilename);
