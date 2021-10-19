import { Tracker } from '@blastjs/tracker';
import { ReactiveVar } from '@blastjs/reactive-var';
import { HTML } from '@blastjs/htmljs';
import { Blast } from './preamble';

Blast._calculateCondition = function (cond) {
  if (HTML.isArray(cond) && cond.length === 0) { cond = false; }
  return !!cond;
};

/**
 * @summary Constructs a View that renders content with a data context.
 * @locus Client
 * @param {Object|Function} data An object to use as the data context, or a function returning such an object.  If a function is provided, it will be reactively re-run.
 * @param {Function} contentFunc A Function that returns [*renderable content*](#Renderable-Content).
 */
Blast.With = function (data, contentFunc) {
  const view = Blast.View('with', contentFunc);

  view.dataVar = new ReactiveVar();

  view.onViewCreated(() => {
    if (typeof data === 'function') {
      // `data` is a reactive function
      view.autorun(() => {
        view.dataVar.set(data());
      }, view.parentView, 'setData');
    } else {
      view.dataVar.set(data);
    }
  });

  return view;
};

/**
 * Attaches bindings to the instantiated view.
 * @param {Object} bindings A dictionary of bindings, each binding name
 * corresponds to a value or a function that will be reactively re-run.
 * @param {View} view The target.
 */
Blast._attachBindingsToView = function (bindings, view) {
  view.onViewCreated(() => {
    _.each(bindings, (binding, name) => {
      view._scopeBindings[name] = new ReactiveVar();
      if (typeof binding === 'function') {
        view.autorun(() => {
          view._scopeBindings[name].set(binding());
        }, view.parentView);
      } else {
        view._scopeBindings[name].set(binding);
      }
    });
  });
};

/**
 * @summary Constructs a View setting the local lexical scope in the block.
 * @param {Function} bindings Dictionary mapping names of bindings to
 * values or computations to reactively re-run.
 * @param {Function} contentFunc A Function that returns [*renderable content*](#Renderable-Content).
 */
Blast.Let = function (bindings, contentFunc) {
  const view = Blast.View('let', contentFunc);
  Blast._attachBindingsToView(bindings, view);

  return view;
};

/**
 * @summary Constructs a View that renders content conditionally.
 * @locus Client
 * @param {Function} conditionFunc A function to reactively re-run.  Whether the result is truthy or falsy determines whether `contentFunc` or `elseFunc` is shown.  An empty array is considered falsy.
 * @param {Function} contentFunc A Function that returns [*renderable content*](#Renderable-Content).
 * @param {Function} [elseFunc] Optional.  A Function that returns [*renderable content*](#Renderable-Content).  If no `elseFunc` is supplied, no content is shown in the "else" case.
 */
Blast.If = function (conditionFunc, contentFunc, elseFunc, _not) {
  const conditionVar = new ReactiveVar();

  const view = Blast.View(_not ? 'unless' : 'if', () => (conditionVar.get() ? contentFunc()
    : (elseFunc ? elseFunc() : null)));
  view.__conditionVar = conditionVar;
  view.onViewCreated(function () {
    this.autorun(() => {
      const cond = Blast._calculateCondition(conditionFunc());
      conditionVar.set(_not ? (!cond) : cond);
    }, this.parentView, 'condition');
  });

  return view;
};

/**
 * @summary An inverted [`Blast.If`](#Blast-If).
 * @locus Client
 * @param {Function} conditionFunc A function to reactively re-run.  If the result is falsy, `contentFunc` is shown, otherwise `elseFunc` is shown.  An empty array is considered falsy.
 * @param {Function} contentFunc A Function that returns [*renderable content*](#Renderable-Content).
 * @param {Function} [elseFunc] Optional.  A Function that returns [*renderable content*](#Renderable-Content).  If no `elseFunc` is supplied, no content is shown in the "else" case.
 */
Blast.Unless = function (conditionFunc, contentFunc, elseFunc) {
  return Blast.If(conditionFunc, contentFunc, elseFunc, true /* _not */);
};

/**
 * @summary Constructs a View that renders `contentFunc` for each item in a sequence.
 * @locus Client
 * @param {Function} argFunc A function to reactively re-run. The function can
 * return one of two options:
 *
 * 1. An object with two fields: '_variable' and '_sequence'. Each iterates over
 *   '_sequence', it may be a Cursor, an array, null, or undefined. Inside the
 *   Each body you will be able to get the current item from the sequence using
 *   the name specified in the '_variable' field.
 *
 * 2. Just a sequence (Cursor, array, null, or undefined) not wrapped into an
 *   object. Inside the Each body, the current item will be set as the data
 *   context.
 * @param {Function} contentFunc A Function that returns  [*renderable
 * content*](#Renderable-Content).
 * @param {Function} [elseFunc] A Function that returns [*renderable
 * content*](#Renderable-Content) to display in the case when there are no items
 * in the sequence.
 */
Blast.Each = function (argFunc, contentFunc, elseFunc) {
  const eachView = Blast.View('each', function () {
    const subviews = this.initialSubviews;
    this.initialSubviews = null;
    if (this._isCreatedForExpansion) {
      this.expandedValueDep = new Tracker.Dependency();
      this.expandedValueDep.depend();
    }
    return subviews;
  });
  eachView.initialSubviews = [];
  eachView.numItems = 0;
  eachView.inElseMode = false;
  eachView.stopHandle = null;
  eachView.contentFunc = contentFunc;
  eachView.elseFunc = elseFunc;
  eachView.argVar = new ReactiveVar();
  eachView.variableName = null;

  // update the @index value in the scope of all subviews in the range
  const updateIndices = function (from, to) {
    if (to === undefined) {
      to = eachView.numItems - 1;
    }

    for (let i = from; i <= to; i++) {
      const { view } = eachView._domrange.members[i];
      view._scopeBindings['@index'].set(i);
    }
  };

  eachView.onViewCreated(() => {
    // We evaluate argFunc in an autorun to make sure
    // Blast.currentView is always set when it runs (rather than
    // passing argFunc straight to ObserveSequence).
    eachView.autorun(() => {
      // argFunc can return either a sequence as is or a wrapper object with a
      // _sequence and _variable fields set.
      let arg = argFunc();
      if (_.isObject(arg) && _.has(arg, '_sequence')) {
        eachView.variableName = arg._variable || null;
        arg = arg._sequence;
      }

      eachView.argVar.set(arg);
    }, eachView.parentView, 'collection');

    eachView.stopHandle = ObserveSequence.observe(() => eachView.argVar.get(), {
      addedAt(id, item, index) {
        Tracker.nonreactive(() => {
          let newItemView;
          if (eachView.variableName) {
            // new-style #each (as in {{#each item in items}})
            // doesn't create a new data context
            newItemView = Blast.View('item', eachView.contentFunc);
          } else {
            newItemView = Blast.With(item, eachView.contentFunc);
          }

          eachView.numItems++;

          const bindings = {};
          bindings['@index'] = index;
          if (eachView.variableName) {
            bindings[eachView.variableName] = item;
          }
          Blast._attachBindingsToView(bindings, newItemView);

          if (eachView.expandedValueDep) {
            eachView.expandedValueDep.changed();
          } else if (eachView._domrange) {
            if (eachView.inElseMode) {
              eachView._domrange.removeMember(0);
              eachView.inElseMode = false;
            }

            const range = Blast._materializeView(newItemView, eachView);
            eachView._domrange.addMember(range, index);
            updateIndices(index);
          } else {
            eachView.initialSubviews.splice(index, 0, newItemView);
          }
        });
      },
      removedAt(id, item, index) {
        Tracker.nonreactive(() => {
          eachView.numItems--;
          if (eachView.expandedValueDep) {
            eachView.expandedValueDep.changed();
          } else if (eachView._domrange) {
            eachView._domrange.removeMember(index);
            updateIndices(index);
            if (eachView.elseFunc && eachView.numItems === 0) {
              eachView.inElseMode = true;
              eachView._domrange.addMember(
                Blast._materializeView(
                  Blast.View('each_else', eachView.elseFunc),
                  eachView,
                ), 0,
              );
            }
          } else {
            eachView.initialSubviews.splice(index, 1);
          }
        });
      },
      changedAt(id, newItem, oldItem, index) {
        Tracker.nonreactive(() => {
          if (eachView.expandedValueDep) {
            eachView.expandedValueDep.changed();
          } else {
            let itemView;
            if (eachView._domrange) {
              itemView = eachView._domrange.getMember(index).view;
            } else {
              itemView = eachView.initialSubviews[index];
            }
            if (eachView.variableName) {
              itemView._scopeBindings[eachView.variableName].set(newItem);
            } else {
              itemView.dataVar.set(newItem);
            }
          }
        });
      },
      movedTo(id, item, fromIndex, toIndex) {
        Tracker.nonreactive(() => {
          if (eachView.expandedValueDep) {
            eachView.expandedValueDep.changed();
          } else if (eachView._domrange) {
            eachView._domrange.moveMember(fromIndex, toIndex);
            updateIndices(
              Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex),
            );
          } else {
            const subviews = eachView.initialSubviews;
            const itemView = subviews[fromIndex];
            subviews.splice(fromIndex, 1);
            subviews.splice(toIndex, 0, itemView);
          }
        });
      },
    });

    if (eachView.elseFunc && eachView.numItems === 0) {
      eachView.inElseMode = true;
      eachView.initialSubviews[0] = Blast.View('each_else', eachView.elseFunc);
    }
  });

  eachView.onViewDestroyed(() => {
    if (eachView.stopHandle) { eachView.stopHandle.stop(); }
  });

  return eachView;
};

Blast._TemplateWith = function (arg, contentFunc) {
  let w;

  let argFunc = arg;
  if (typeof arg !== 'function') {
    argFunc = function () {
      return arg;
    };
  }

  // This is a little messy.  When we compile `{{> Template.contentBlock}}`, we
  // wrap it in Blast._InOuterTemplateScope in order to skip the intermediate
  // parent Views in the current template.  However, when there's an argument
  // (`{{> Template.contentBlock arg}}`), the argument needs to be evaluated
  // in the original scope.  There's no good order to nest
  // Blast._InOuterTemplateScope and Spacebars.TemplateWith to achieve this,
  // so we wrap argFunc to run it in the "original parentView" of the
  // Blast._InOuterTemplateScope.
  //
  // To make this better, reconsider _InOuterTemplateScope as a primitive.
  // Longer term, evaluate expressions in the proper lexical scope.
  const wrappedArgFunc = function () {
    let viewToEvaluateArg = null;
    if (w.parentView && w.parentView.name === 'InOuterTemplateScope') {
      viewToEvaluateArg = w.parentView.originalParentView;
    }
    if (viewToEvaluateArg) {
      return Blast._withCurrentView(viewToEvaluateArg, argFunc);
    }
    return argFunc();
  };

  const wrappedContentFunc = function () {
    let content = contentFunc.call(this);

    // Since we are generating the Blast._TemplateWith view for the
    // user, set the flag on the child view.  If `content` is a template,
    // construct the View so that we can set the flag.
    if (content instanceof Blast.Template) {
      content = content.constructView();
    }
    if (content instanceof Blast.View) {
      content._hasGeneratedParent = true;
    }

    return content;
  };

  w = Blast.With(wrappedArgFunc, wrappedContentFunc);
  w.__isTemplateWith = true;
  return w;
};

Blast._InOuterTemplateScope = function (templateView, contentFunc) {
  const view = Blast.View('InOuterTemplateScope', contentFunc);
  let { parentView } = templateView;

  // Hack so that if you call `{{> foo bar}}` and it expands into
  // `{{#with bar}}{{> foo}}{{/with}}`, and then `foo` is a template
  // that inserts `{{> Template.contentBlock}}`, the data context for
  // `Template.contentBlock` is not `bar` but the one enclosing that.
  if (parentView.__isTemplateWith) { parentView = parentView.parentView; }

  view.onViewCreated(function () {
    this.originalParentView = this.parentView;
    this.parentView = parentView;
    this.__childDoesntStartNewLexicalScope = true;
  });
  return view;
};

// XXX COMPAT WITH 0.9.0
Blast.InOuterTemplateScope = Blast._InOuterTemplateScope;
