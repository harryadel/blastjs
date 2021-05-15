// NOTE: don't change this, jquery is a peer dependency of meteor-blaze-runtime
import "jquery";
import "meteor-blaze-runtime";
//not sure why this is required? I guess a different global context.
window.Template = Template;
window.Spacebars = Spacebars;
window.Blaze = Blaze;
window.HTML = HTML;
