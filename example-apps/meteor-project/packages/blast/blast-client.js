const { Template } = require('@blastjs/templating-runtime');
const { Blast } = require('@blastjs/blast');
const { Spacebars } = require('@blastjs/spacebars');
const { HTML } = require('@blastjs/htmljs');

// not sure why this is required? I guess a different global context.
window.Template = Template;
window.Spacebars = Spacebars;
window.Blast = Blast;
window.HTML = HTML;
