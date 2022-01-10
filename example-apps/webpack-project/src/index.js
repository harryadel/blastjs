import { Blast } from '@blastjs/blast';
import { Template } from '@blastjs/templating-runtime';
import { HTML } from '@blastjs/htmljs';
import { Spacebars } from '@blastjs/spacebars';

global.Template = Template;
global.HTML = HTML;
global.Blast = Blast;
global.Spacebars = Spacebars;
require('./components/main.js');

Blast.renderWithData(Template.main, {}, document.getElementsByTagName('body')[0]);
