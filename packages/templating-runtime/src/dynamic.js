const { Template } = Blast;

/**
 * @isTemplate true
 * @memberOf Template
 * @function dynamic
 * @summary Choose a template to include dynamically, by name.
 * @locus Templates
 * @param {String} template The name of the template to include.
 * @param {Object} [data] Optional. The data context in which to include the
 * template.
 */

Template.__dynamicWithDataContext.helpers({
  chooseTemplate(name) {
    return Blast._getTemplate(name, () => Template.instance());
  },
});

Template.__dynamic.helpers({
  dataContextPresent() {
    return _.has(this, 'data');
  },
  checkContext() {
    if (!_.has(this, 'template')) {
      throw new Error("Must specify name in the 'template' argument "
                      + 'to {{> Template.dynamic}}.');
    }

    _.each(this, (v, k) => {
      if (k !== 'template' && k !== 'data') {
        throw new Error(`Invalid argument to {{> Template.dynamic}}: ${
          k}`);
      }
    });
  },
});
