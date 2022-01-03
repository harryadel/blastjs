// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by blaze.js.
import { name as packageName } from 'meteor/harry97:blaze';

// Write your tests here!
// Here is an example.
Tinytest.add('blast - example', (test) => {
  test.equal(packageName, 'blaze');
});
