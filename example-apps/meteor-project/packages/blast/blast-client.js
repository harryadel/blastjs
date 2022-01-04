const { Template } = require('@blastjs/templating-runtime');
const { Blast } = require('@blastjs/blast');
const { Spacebars } = require('@blastjs/spacebars');
const { HTML } = require('@blastjs/htmljs');

// not sure why this is required? I guess a different global context.
global.Template = Template;
global.Spacebars = Spacebars;
global.Blast = Blast;
global.HTML = HTML;
