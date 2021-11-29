Template.__checkName('ui_dynamic_test');
Template.ui_dynamic_test = new Template('Template.ui_dynamic_test', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')), data: Spacebars.call(view.lookup('templateData')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));

Template.__checkName('ui_dynamic_test_no_data');
Template.ui_dynamic_test_no_data = new Template('Template.ui_dynamic_test_no_data', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));

Template.__checkName('ui_dynamic_test_inherited_data');
Template.ui_dynamic_test_inherited_data = new Template('Template.ui_dynamic_test_inherited_data', (function () { const view = this; return Spacebars.With(() => Spacebars.call(view.lookup('context')), (() => ['\n    ', Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))), '\n  ']), (() => ['\n    ', Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))), '\n  '])); }));

Template.__checkName('ui_dynamic_test_sub');
Template.ui_dynamic_test_sub = new Template('Template.ui_dynamic_test_sub', (function () { const view = this; return ['test', Blaze.View('lookup:foo', () => Spacebars.mustache(view.lookup('foo')))]; }));

Template.__checkName('ui_dynamic_test_contentblock');
Template.ui_dynamic_test_contentblock = new Template('Template.ui_dynamic_test_contentblock', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')), data: Spacebars.call(view.lookup('templateData')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic), (() => 'contentBlock'))); }));

Template.__checkName('ui_dynamic_test_contentblock_no_data');
Template.ui_dynamic_test_contentblock_no_data = new Template('Template.ui_dynamic_test_contentblock_no_data', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic), (() => 'contentBlock'))); }));

Template.__checkName('ui_dynamic_test_sub_contentblock');
Template.ui_dynamic_test_sub_contentblock = new Template('Template.ui_dynamic_test_sub_contentblock', (function () { const view = this; return ['test', Blaze.View('lookup:foo', () => Spacebars.mustache(view.lookup('foo'))), Blaze._InOuterTemplateScope(view, () => Spacebars.include(() => Spacebars.call(view.templateContentBlock)))]; }));

Template.__checkName('ui_dynamic_test_falsey_inner_context');
Template.ui_dynamic_test_falsey_inner_context = new Template('Template.ui_dynamic_test_falsey_inner_context', (function () { const view = this; return Spacebars.With(() => ({ foo: Spacebars.call('bar') }), (() => ['\n    ', Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')), data: Spacebars.call(view.lookup('context')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))), '\n  '])); }));

Template.__checkName('ui_dynamic_test_bad_args0');
Template.ui_dynamic_test_bad_args0 = new Template('Template.ui_dynamic_test_bad_args0', (function () { const view = this; return Spacebars.include(() => Spacebars.call(Template.__dynamic)); }));

Template.__checkName('ui_dynamic_test_bad_args1');
Template.ui_dynamic_test_bad_args1 = new Template('Template.ui_dynamic_test_bad_args1', (function () { const view = this; return Blaze._TemplateWith(() => ({ foo: Spacebars.call('bar') }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));

Template.__checkName('ui_dynamic_test_bad_args2');
Template.ui_dynamic_test_bad_args2 = new Template('Template.ui_dynamic_test_bad_args2', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call('ui_dynamic_test_sub'), foo: Spacebars.call('bar') }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));

Template.__checkName('ui_dynamic_test_falsey_context');
Template.ui_dynamic_test_falsey_context = new Template('Template.ui_dynamic_test_falsey_context', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call('ui_dynamic_test_falsey_context_sub') }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));

Template.__checkName('ui_dynamic_test_falsey_context_sub');
Template.ui_dynamic_test_falsey_context_sub = new Template('Template.ui_dynamic_test_falsey_context_sub', (function () { const view = this; return Blaze.View('lookup:foo', () => Spacebars.mustache(view.lookup('foo'))); }));

Template.__checkName('ui_dynamic_backcompat');
Template.ui_dynamic_backcompat = new Template('Template.ui_dynamic_backcompat', (function () { const view = this; return Blaze._TemplateWith(() => ({ template: Spacebars.call(view.lookup('templateName')), data: Spacebars.call(view.lookup('templateData')) }), () => Spacebars.include(() => Spacebars.call(Template.__dynamic))); }));
