require('./blastHook');
require('./example.html');

const express = require('express');
const { JSDOM } = require('jsdom');
const { Blast, Template } = require('@blastjs/blast');

const app = express();
const port = 3000;

window = new JSDOM('...').window;
document = window.document;

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
