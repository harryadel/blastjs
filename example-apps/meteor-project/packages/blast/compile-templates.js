import { CachingHtmlCompiler, TemplatingTools } from '@blastjs/caching-html-compiler';

Plugin.registerCompiler({
  extensions: ['html'],
  isTemplate: true,
}, (...args) => new CachingHtmlCompiler(
  'templating',
  (...args) => TemplatingTools.scanHtmlForTags(...args),
  (...args) => TemplatingTools.compileTagsWithSpacebars(...args),
));
