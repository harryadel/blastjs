import { TemplatingTools } from '@blastjs/templating-tools';

global.TemplatingTools = TemplatingTools;

Plugin.registerCompiler({
  extensions: ['html'],
  archMatching: 'web',
  isTemplate: true,
}, () => new CachingHtmlCompiler(
  'templating',
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars,
));
