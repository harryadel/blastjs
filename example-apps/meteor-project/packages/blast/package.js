Package.describe({
  name: 'harry97:blast',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/harryadel/blastjs/tree/main/example-apps/meteor-project/packages/blast',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Npm.depends({
  jsdom: '19.0.0',
  '@blastjs/blast': '2.4.16',
  '@blastjs/spacebars': '0.1.4',
  '@blastjs/templating-runtime': '1.4.5',
  '@blastjs/htmljs': '0.1.2',
});

Package.onUse((api) => {
  api.use('ecmascript');
  api.use('isobuild:compiler-plugin@1.0.0', 'server');
  api.mainModule('blast-client.js', 'client');
  api.mainModule('blast-server.js', 'server');
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
  ],
  sources: [
    'compile-templates.js',
  ],
  npmDependencies: {
    '@blastjs/caching-html-compiler': '0.1.5',
  },
});
