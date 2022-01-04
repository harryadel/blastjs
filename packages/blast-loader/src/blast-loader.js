import { TemplatingTools } from '@blastjs/templating-tools';

module.exports = function (contents) {
  const tags = TemplatingTools.scanHtmlForTags({
    sourceName: '',
    contents,
    tagNames: ['body', 'head', 'template'],
  });
  const ret = TemplatingTools.compileTagsWithSpacebars(tags);
  return ret.js;
};
