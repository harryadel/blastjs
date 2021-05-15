const express = require('express')
const app = express()
const port = 3000
const {JSDOM} = require("jsdom");
window = new JSDOM('...').window;
document = window.document;
// prints fulle dummy.js filename, runs dummy.js
require("./blazeHook.js")
require("meteor-blaze-runtime");
require("./example.html");

app.get('/', (req, res) => {
  const query = req.url.split("?")[1];
  const data = {};
  if (query) {
    const parts = query.split("&").map(p => p.split("="));
    if (parts.length && parts[0][0] === "name") {
      data.name = parts[0][1];
    }
  }
  res.send(Blaze.toHTMLWithData(Template.example, data));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
