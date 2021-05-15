require("./header.js");
require("./sidenav.js");
require("./main.html");
const { Meteor } = require("meteor-blaze-common");
//const { ReactiveVar } = require("meteor-blaze-runtime");

Template.main.onCreated(function onCreated() {
  this.page = new ReactiveVar();
  this.autorun(() => {
    console.log(this.page.get());
  })
});

Template.main.helpers({
  pageVar() {
    return Template.instance().page;
  }
});
