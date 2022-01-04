import { TemplatingTools } from '@blastjs/templating-tools';
import { HTML } from '@blastjs/htmljs';

global.TemplatingTools = TemplatingTools;
// global.HTML = HTML;

Plugin.registerCompiler({
  extensions: ['html'],
  isTemplate: true,
}, (...args) => new CachingHtmlCompiler(
  'templating',
  (...args) => TemplatingTools.scanHtmlForTags(...args),
  TemplatingTools.compileTagsWithSpacebars,
));
