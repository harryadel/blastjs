import { TemplatingTools } from '@blastjs/templating-tools';
// global.TemplatingTools = TemplatingTools;

Plugin.registerCompiler({
  extensions: ['html'],
  isTemplate: true,
}, (...args) => new CachingHtmlCompiler(
  'templating',
  (...args) => TemplatingTools.scanHtmlForTags(...args),
  TemplatingTools.compileTagsWithSpacebars,
));
