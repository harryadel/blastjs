test(
  'spacebars - ui-dynamic-template - render template dynamically', () => {
    const tmpl = Template.ui_dynamic_test;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
      templateData() {
        return dataVar.get();
      },
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set('ui_dynamic_test_sub');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('test');

    // Set a data context.
    dataVar.set({ foo: 'bar' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testbar');
  },
);

// Same test as above, but the {{> Template.dynamic}} inclusion has no
// `dataContext` argument.
test(
  'spacebars - ui-dynamic-template - render template dynamically, no data context',
  () => {
    const tmpl = Template.ui_dynamic_test_no_data;

    const nameVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
    });

    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    nameVar.set('ui_dynamic_test_sub');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('test');
  },
);

test(
  'spacebars - ui-dynamic-template - render template '
    + 'dynamically, data context gets inherited',
  () => {
    const tmpl = Template.ui_dynamic_test_inherited_data;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
      context() {
        return dataVar.get();
      },
    });

    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    nameVar.set('ui_dynamic_test_sub');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('test');

    // Set the top-level template's data context; this should be
    // inherited by the dynamically-chosen template, since the {{>
    // Template.dynamic}} inclusion didn't include a data argument.
    dataVar.set({ foo: 'bar' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testbar');
  },
);

test(
  'spacebars - ui-dynamic-template - render template dynamically with contentBlock', () => {
    const tmpl = Template.ui_dynamic_test_contentblock;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
      templateData() {
        return dataVar.get();
      },
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set('ui_dynamic_test_sub_contentblock');
    Tracker.flush({ _throwFirstError: true });
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testcontentBlock');

    // Set a data context.
    dataVar.set({ foo: 'bar' });
    Tracker.flush({ _throwFirstError: true });
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testbarcontentBlock');
  },
);

// Same test as above, but the {{> Template.dynamic}} inclusion has no
// `dataContext` argument.
test(
  'spacebars - ui-dynamic-template - render template dynamically with contentBlock, no data context',
  () => {
    const tmpl = Template.ui_dynamic_test_contentblock_no_data;

    const nameVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
    });

    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    nameVar.set('ui_dynamic_test_sub_contentblock');
    Tracker.flush({ _throwFirstError: true });
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testcontentBlock');
  },
);

test(
  'spacebars - ui-dynamic-template - render template '
    + 'dynamically, data context does not get inherited if '
    + 'falsey context is passed in',
  () => {
    const tmpl = Template.ui_dynamic_test_falsey_inner_context;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
      context() {
        return dataVar.get();
      },
    });

    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    nameVar.set('ui_dynamic_test_sub');
    Tracker.flush();
    // Even though the data context is falsey, we DON'T expect the
    // subtemplate to inherit the data context from the parent template.
    expect(canonicalizeHtml(div.innerHTML)).toEqual('test');
  },
);

test(
  'spacebars - ui-dynamic-template - render template '
    + 'dynamically, bad arguments',
  () => {
    const tmplPrefix = 'ui_dynamic_test_bad_args';
    const errors = [
      "Must specify 'template' as an argument",
      "Must specify 'template' as an argument",
      'Invalid argument to {{> Template.dynamic}}',
    ];

    for (let i = 0; i < 3; i++) {
      var tmpl = Template[tmplPrefix + i];
      expect(() => {
        Blaze._throwNextException = true;
        const div = renderToDiv(tmpl);
      }).toThrow();
    }
  },
);

test(
  'spacebars - ui-dynamic-template - render template '
    + 'dynamically, falsey context',
  () => {
    const tmpl = Template.ui_dynamic_test_falsey_context;
    const subtmpl = Template.ui_dynamic_test_falsey_context_sub;

    let subtmplContext;
    subtmpl.helpers({
      foo() {
        subtmplContext = this;
      },
    });
    const div = renderToDiv(tmpl);

    // Because `this` can only be an object, Blaze normalizes falsey
    // data contexts to {}.
    expect(subtmplContext).toEqual({});
  },
);

test(
  'spacebars - ui-dynamic-template - back-compat', () => {
    const tmpl = Template.ui_dynamic_backcompat;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName() {
        return nameVar.get();
      },
      templateData() {
        return dataVar.get();
      },
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    expect(canonicalizeHtml(div.innerHTML)).toEqual('');

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set('ui_dynamic_test_sub');
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('test');

    // Set a data context.
    dataVar.set({ foo: 'bar' });
    Tracker.flush();
    expect(canonicalizeHtml(div.innerHTML)).toEqual('testbar');
  },
);
