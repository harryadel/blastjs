Package.describe({
  name: 'harry97:blast',
  version: '2.3.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

// NOTE: intentionally NOT npm depending this - if we do, meteor will bundle meteor-blaze-runtime in here, we don't want it to - we want meteor-blaze-runtime to be bundled with the rest of the npm modules.
/*
Npm.depends({
  "meteor-blaze-runtime": "1.1.8"
});
*/

Package.onUse((api) => {
  api.use('ecmascript');
  api.use('reactive-var');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use('jquery', 'client');
  api.mainModule('blast-client.js', 'client', { lazy: true });
  api.mainModule('blast-server.js', 'server', { lazy: true });
  // api.mainModule('blast-client.js', 'server', { lazy: true });
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('harry97:blast');
  api.mainModule('blast-tests.js');
});

Package.registerBuildPlugin({
  name: 'compileTemplatesBatch',
  use: [
    'ecmascript',
    'caching-html-compiler@1.1.2',
  ],
  sources: [
    'blast.js',
  ],
  npmDependencies: {
    'meteor-blaze-compiler': '1.0.12',
  },
});
