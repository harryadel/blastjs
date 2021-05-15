const $ = require("jquery");
const _ = require("underscore");
require("./sidenav.html");
require("./page1.html");
require("./page2.html");

const pages = {
  1: {
    title: "This is page 1",
    content: "some content from page 1",
    templateName: "page1"
  },
  2: {
    title: "This is another page",
    content: "some more content",
    templateName: "page2"
  }
}
Template.sidenav.helpers({
  pages() {
    return _.map(pages, (page, id) => {
      page.id = id;
      return page;
    });
  }
})
Template.sidenav.events({
  "click li"(e) {
    const target = $(e.currentTarget);
    const pageId = target.data("pageid");
    Template.instance().data.pageVar.set(pages[pageId]);
  }
});
