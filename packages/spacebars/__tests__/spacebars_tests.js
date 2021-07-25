import { Spacebars } from '../src/spacebars-runtime'; 

test("spacebars - Spacebars.dot", function () {
  expect(Spacebars.dot(null, 'foo')).toEqual(null);
  expect(Spacebars.dot('foo', 'foo')).toEqual(undefined);
  expect(Spacebars.dot({x:1}, 'x')).toEqual(1);
  expect(Spacebars.dot(
    {x:1, y: function () { return this.x+1; }}, 'y')()).toEqual(2);
  expect(Spacebars.dot(
    function () {
      return {x:1, y: function () { return this.x+1; }};
    }, 'y')()).toEqual(2);

  var m = 1;
  var mget = function () {
    return {
      answer: m,
      getAnswer: function () {
        return this.answer;
      }
    };
  };
  var mgetDotAnswer = Spacebars.dot(mget, 'answer');
  expect(mgetDotAnswer).toEqual(1);

  m = 3;
  var mgetDotGetAnswer = Spacebars.dot(mget, 'getAnswer');
  expect(mgetDotGetAnswer()).toEqual(3);
  m = 4;
  expect(mgetDotGetAnswer()).toEqual(3);

  var closet = {
    mget: mget,
    mget2: function () {
      return this.mget();
    }
  };

  m = 5;
  var f1 = Spacebars.dot(closet, 'mget', 'answer');
  m = 6;
  var f2 = Spacebars.dot(closet, 'mget2', 'answer');
  expect(f2).toEqual(6);
  m = 8;
  var f3 = Spacebars.dot(closet, 'mget2', 'getAnswer');
  m = 9;
  expect(f3()).toEqual(8);

  expect(Spacebars.dot(0, 'abc', 'def')).toEqual(0);
  expect(Spacebars.dot(function () { return null; }, 'abc', 'def')).toEqual(null);
  expect(Spacebars.dot(function () { return 0; }, 'abc', 'def')).toEqual(0);

  // test that in `foo.bar`, `bar` may be a function that takes arguments.
  expect(Spacebars.dot(
    { one: 1, inc: function (x) { return this.one + x; } }, 'inc')(6)).toEqual(7);
  expect(Spacebars.dot(
    function () {
      return { one: 1, inc: function (x) { return this.one + x; } };
    }, 'inc')(8)).toEqual(9);

});