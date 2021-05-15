require("meteor-blaze-runtime");
require("./components/main.js");

Blaze.renderWithData(Template.main, {}, document.getElementsByTagName("body")[0]);
