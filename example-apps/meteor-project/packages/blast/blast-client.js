const { Template } = require('@blastjs/templating-runtime');
const { Blast } = require('@blastjs/blast');
const { Spacebars } = require('@blastjs/spacebars');
const { HTML } = require('@blastjs/htmljs');

global.Template = Template;
global.Spacebars = Spacebars;
global.Blast = Blast;
global.HTML = HTML;
