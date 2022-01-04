import { ReactiveVar } from '@blastjs/reactive-var';

require('./header.js');
require('./sidenav.js');
require('./main.html');

Template.main.onCreated(function onCreated() {
  this.page = new ReactiveVar();
  this.autorun(() => {
    console.log(this.page.get());
  });
});

Template.main.helpers({
  pageVar() {
    return Template.instance().page;
  },
});
