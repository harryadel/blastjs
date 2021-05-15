
Template.__checkName("ui_dynamic_test");
Template["ui_dynamic_test"] = new Template("Template.ui_dynamic_test", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName")), data: Spacebars.call(view.lookup("templateData"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

Template.__checkName("ui_dynamic_test_no_data");
Template["ui_dynamic_test_no_data"] = new Template("Template.ui_dynamic_test_no_data", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

Template.__checkName("ui_dynamic_test_inherited_data");
Template["ui_dynamic_test_inherited_data"] = new Template("Template.ui_dynamic_test_inherited_data", (function () { var view = this; return Spacebars.With(function () { return Spacebars.call(view.lookup("context")); }, (function () { return ["\n    ", Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }), "\n  "]; }), (function () { return ["\n    ", Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }), "\n  "]; })); }));

Template.__checkName("ui_dynamic_test_sub");
Template["ui_dynamic_test_sub"] = new Template("Template.ui_dynamic_test_sub", (function () { var view = this; return ["test", Blaze.View("lookup:foo", function () { return Spacebars.mustache(view.lookup("foo")); })]; }));

Template.__checkName("ui_dynamic_test_contentblock");
Template["ui_dynamic_test_contentblock"] = new Template("Template.ui_dynamic_test_contentblock", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName")), data: Spacebars.call(view.lookup("templateData"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }, (function () { return "contentBlock"; })); }); }));

Template.__checkName("ui_dynamic_test_contentblock_no_data");
Template["ui_dynamic_test_contentblock_no_data"] = new Template("Template.ui_dynamic_test_contentblock_no_data", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }, (function () { return "contentBlock"; })); }); }));

Template.__checkName("ui_dynamic_test_sub_contentblock");
Template["ui_dynamic_test_sub_contentblock"] = new Template("Template.ui_dynamic_test_sub_contentblock", (function () { var view = this; return ["test", Blaze.View("lookup:foo", function () { return Spacebars.mustache(view.lookup("foo")); }), Blaze._InOuterTemplateScope(view, function () { return Spacebars.include(function () { return Spacebars.call(view.templateContentBlock); }); })]; }));

Template.__checkName("ui_dynamic_test_falsey_inner_context");
Template["ui_dynamic_test_falsey_inner_context"] = new Template("Template.ui_dynamic_test_falsey_inner_context", (function () { var view = this; return Spacebars.With(function () { return {foo: Spacebars.call("bar")}; }, (function () { return ["\n    ", Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName")), data: Spacebars.call(view.lookup("context"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }), "\n  "]; })); }));

Template.__checkName("ui_dynamic_test_bad_args0");
Template["ui_dynamic_test_bad_args0"] = new Template("Template.ui_dynamic_test_bad_args0", (function () { var view = this; return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }));

Template.__checkName("ui_dynamic_test_bad_args1");
Template["ui_dynamic_test_bad_args1"] = new Template("Template.ui_dynamic_test_bad_args1", (function () { var view = this; return Blaze._TemplateWith(function () { return {foo: Spacebars.call("bar")}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

Template.__checkName("ui_dynamic_test_bad_args2");
Template["ui_dynamic_test_bad_args2"] = new Template("Template.ui_dynamic_test_bad_args2", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call("ui_dynamic_test_sub"), foo: Spacebars.call("bar")}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

Template.__checkName("ui_dynamic_test_falsey_context");
Template["ui_dynamic_test_falsey_context"] = new Template("Template.ui_dynamic_test_falsey_context", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call("ui_dynamic_test_falsey_context_sub")}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

Template.__checkName("ui_dynamic_test_falsey_context_sub");
Template["ui_dynamic_test_falsey_context_sub"] = new Template("Template.ui_dynamic_test_falsey_context_sub", (function () { var view = this; return Blaze.View("lookup:foo", function () { return Spacebars.mustache(view.lookup("foo")); }); }));

Template.__checkName("ui_dynamic_backcompat");
Template["ui_dynamic_backcompat"] = new Template("Template.ui_dynamic_backcompat", (function () { var view = this; return Blaze._TemplateWith(function () { return {template: Spacebars.call(view.lookup("templateName")), data: Spacebars.call(view.lookup("templateData"))}; }, function () { return Spacebars.include(function () { return Spacebars.call(Template.__dynamic); }); }); }));

