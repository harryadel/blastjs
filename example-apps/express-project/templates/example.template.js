const { Spacebars } = require('@blastjs/spacebars');
const { Blast } = require('@blastjs/blast');
const { Template } = require('@blastjs/templating-runtime');

Template.__checkName('example');

Template.example = new Template(
  'Template.example',
  (function () {
    const view = this;
    return ['This is an example\n  ',
      Blast.If(
        () => Spacebars.call(view.lookup('name')),
        (() => ['\n    Hello ',
          Blast.View(
            'lookup:name',
            () => Spacebars.mustache(view.lookup('name')),
          ),
          '\n  ']),
        (() => '\n    Stick ?name=yourName in the URL\n  '),
      )];
  }),
);
