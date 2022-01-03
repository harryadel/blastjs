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

Npm.depends({
  jsdom: '19.0.0',
  jquery: '3.0.0',
  '@blastjs/blast': '2.4.10',
  '@blastjs/spacebars': '0.1.3',
  '@blastjs/templating-runtime': '1.4.4',
  '@blastjs/templating-tools': '1.2.1',
  '@blastjs/htmljs': '0.1.2',
});

Package.onUse((api) => {
  api.use('ecmascript');
  api.use('reactive-var');
  api.use('isobuild:compiler-plugin@1.0.0');
  // api.use('jquery', 'client');
  api.mainModule('blast-client.js', 'client');
  api.mainModule('blast-server.js', 'server');
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
    '@blastjs/templating-tools': '1.2.1',
  },
});
