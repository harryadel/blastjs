import "./anotherTemplate.html";

Template.anotherTemplate.helpers({
  helper() {
    return "this came from a helper";
  }
});

Template.anotherTemplate.events({
  "click button"(e) {
    alert("clicked");
  }
});
