const express = require('express');

const app = express();
const port = 3000;
const { JSDOM } = require('jsdom');

window = new JSDOM('...').window;
document = window.document;
const { Template } = require('@blastjs/templating-runtime');
const { Blast } = require('@blastjs/blast');
const { Spacebars } = require('@blastjs/spacebars');

global.Template = Template;
global.Blast = Blast;
global.Spacebars = Spacebars;

require('./blastHook');
require('./example.html');

app.get('/', (req, res) => {
  const query = req.url.split('?')[1];
  const data = {};
  if (query) {
    const parts = query.split('&').map((p) => p.split('='));
    if (parts.length && parts[0][0] === 'name') {
      data.name = parts[0][1];
    }
  }
  res.send(Blast.toHTMLWithData(Template.example, data));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
