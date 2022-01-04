import { Blast } from '@blastjs/blast';
import { Template } from '@blastjs/templating-runtime';
import { HTML } from '@blastjs/htmljs';

global.Template = Template;
global.HTML = HTML;

require('./components/main.js');

Blast.renderWithData(Template.main, {}, document.getElementsByTagName('body')[0]);
