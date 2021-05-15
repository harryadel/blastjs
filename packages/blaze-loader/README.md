# Blaze
This project is to extract the Meteor [Blaze Templating Engine](http://blazejs.org/) to npm so it can be used in other projects.

## Usage
This package can be used in three ways

1. Compile the templates yourself for later bundling
```
npm install meteor-blaze-compiler
node ./node_modules/.bin/blaze myTemplate.html > myTemplate.template.js
```
2. Use webpack - see the example webpack project for how to configure your modules. Note that I've not worked with webpack much, so there may be a better way to do this however it works nicely for me.

3. Compile the templates yourself, but serve the rendered HTML from a server - see the example express project. In principle, you compile the templates by hand, require them as needed, then use `Blaze.toHTML` or `Blaze.toHTMLWithData`

## Current status
This project is combined of 2 npm packages (and a common npm packages) a webpack npm package and an as-yet unpublished meteor package (just to demo that it).

1. `meteor-blaze-compiler` is the compiler for blaze. Include it in any project where you want to build templates (possibly as a dev dependency)
2. `meteor-blaze-runtime` is the runtime environment for blaze. Include it in any project where you will render blaze templates. In the browser this will also setup the events, on the server it will not.
3. `blaze-loader` is the webpack loader for blaze templates defined in `.html` files. Currently only the `<template>` tag is recognized (e.g., `<head>` and `<body>` tags are ignored).

It is currently working, with a few caveats worth nothing:

### The good

1. All the tests included in the blaze packages are passing
2. It has been tested using webpack for client side rendering, express for server side rendering, and in Meteor where it seems to exhibit the same behaviour as the default blaze.
3. There are example projects to get you started with usage.

### The bad

1. Outof date packages: This project makes use of several existing npm extractions of meteor packages, namely `meteor-standalone-*` - many of these packages are years (some of them 6!) out of date. I'm reluctant to publish duplicate packages (particularly given there is already a full set of duplicates at `meteor-*` which operate differently). The packages used are `diff-sequence, mongo-id, ordered-dict, reactive-var and tracker`. So, some features of current blaze may not work.
2. Mismatch between Meteor and npm versions of some globals: `Tracker` and `ReactiveVar` are the two biggies
3. Excessive use of global vars: I've tried to reduce this where possible, but in the runtime `_, Template, Blaze, HTML, Spacebars, Tracker, ReactiveVar` all need to be global :(
4. Dependency on `jquery` and `underscore` in the compiler and runtime packages and `jsdom` (or something else that provides window/document) if you want to render templates server side.  

### Still to come

I'd like to detect if Meteor is present and use the Meteor versions of some of these dependencies if it is. Of course, perhaps if you're using Meteor you should just use the Meteor Blaze package.
