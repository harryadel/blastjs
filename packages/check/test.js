describe('check', () => {
  const assume = require('assume');
  const { check } = require('.');

  it('is working', () => {
    assume(() => {
    	check(5, Boolean);
    }).to.throw('Match error: Expected boolean, got number');
  });
});

describe('Match', () => {
  const assume = require('assume');
  const { Match } = require('.');

  it('is working', () => {
    assume(Match.test({}, Object)).to.equal(true);

    assume(Match.test({
    	name: 'foo',
    	age: 12,
    	child: true,
    }, {
    	name: String,
    	age: Number,
    	child: Boolean,
    })).to.equal(true);
  });
});
