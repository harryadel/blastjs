import { CachingHtmlCompiler, TemplatingTools } from '@blastjs/caching-html-compiler';

Plugin.registerCompiler({
  extensions: ['html'],
  archMatching: 'web',
  isTemplate: true,
}, () => new CachingHtmlCompiler(
  'templating',
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars,
));
