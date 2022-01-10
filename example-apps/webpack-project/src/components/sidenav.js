import $ from 'jquery';

require('./sidenav.html');
require('./page1.html');
require('./page2.html');

const pages = {
  1: {
    title: 'This is page 1',
    content: 'some content from page 1',
    templateName: 'page1',
  },
  2: {
    title: 'This is another page',
    content: 'some more content',
    templateName: 'page2',
  },
};

Template.sidenav.helpers({
  pages() {
    const res = Object.keys(pages).map((key) => ({
      id: key,
      title: pages[key].title,
    }));
    return res;
  },
});
Template.sidenav.events({
  'click li': function (e) {
    const target = $(e.currentTarget);
    const pageId = target.data('pageid');
    Template.instance().data.pageVar.set(pages[pageId]);
  },
});
