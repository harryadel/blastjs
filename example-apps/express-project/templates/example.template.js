
Template.__checkName("example");
Template["example"] = new Template("Template.example", (function () { var view = this; return ["This is an example\n  ", Blaze.If(function () { return Spacebars.call(view.lookup("name")); }, (function () { return ["\n    Hello ", Blaze.View("lookup:name", function () { return Spacebars.mustache(view.lookup("name")); }), "\n  "]; }), (function () { return "\n    Stick ?name=yourName in the URL\n  "; }))]; }));

