import { Template } from '@blastjs/blast';
import has from 'lodash.has';
import './dynamic.html.template';

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
    return has(this, 'data');
  },
  checkContext() {
    if (!has(this, 'template')) {
      throw new Error(
        "Must specify name in the 'template' argument "
          + 'to {{> Template.dynamic}}.',
      );
    }

    Object.keys(this).forEach((k) => {
      if (k !== 'template' && k !== 'data') {
        throw new Error(`Invalid argument to {{> Template.dynamic}}: ${k}`);
      }
    });
  },
});
