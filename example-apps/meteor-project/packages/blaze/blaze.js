import { TemplatingTools } from "meteor-blaze-compiler";
//global.TemplatingTools = TemplatingTools;

Plugin.registerCompiler({
  extensions: ['html'],
  isTemplate: true
}, (...args) => {
  return new CachingHtmlCompiler(
    "templating",
    (...args) => {
      return TemplatingTools.scanHtmlForTags(...args);
    },
    TemplatingTools.compileTagsWithSpacebars
  )
});
