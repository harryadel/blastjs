import { JSDOM } from 'jsdom';
import { Blast } from '@blastjs/blast';
import { Template } from '@blastjs/templating-runtime';
import { HTML } from '@blastjs/htmljs';
import { Spacebars } from '@blastjs/spacebars';

// global.document = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
// global.window = document.defaultView;
// document = window.document;

global.Template = Template;
global.HTML = HTML;
global.Blast = Blast;
global.Spacebars = Spacebars;
require('./components/main.js');

Blast.renderWithData(Template.main, {}, document.getElementsByTagName('body')[0]);
