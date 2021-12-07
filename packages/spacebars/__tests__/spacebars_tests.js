import { Spacebars } from '../src/spacebars-runtime';

test('spacebars - Spacebars.dot', () => {
  expect(Spacebars.dot(null, 'foo')).toEqual(null);
  expect(Spacebars.dot('foo', 'foo')).toEqual(undefined);
  expect(Spacebars.dot({ x: 1 }, 'x')).toEqual(1);
  expect(Spacebars.dot(
    { x: 1, y() { return this.x + 1; } }, 'y',
  )()).toEqual(2);
  expect(Spacebars.dot(
    () => ({ x: 1, y() { return this.x + 1; } }), 'y',
  )()).toEqual(2);

  let m = 1;
  const mget = function () {
    return {
      answer: m,
      getAnswer() {
        return this.answer;
      },
    };
  };
  const mgetDotAnswer = Spacebars.dot(mget, 'answer');
  expect(mgetDotAnswer).toEqual(1);

  m = 3;
  const mgetDotGetAnswer = Spacebars.dot(mget, 'getAnswer');
  expect(mgetDotGetAnswer()).toEqual(3);
  m = 4;
  expect(mgetDotGetAnswer()).toEqual(3);

  const closet = {
    mget,
    mget2() {
      return this.mget();
    },
  };

  m = 5;
  const f1 = Spacebars.dot(closet, 'mget', 'answer');
  m = 6;
  const f2 = Spacebars.dot(closet, 'mget2', 'answer');
  expect(f2).toEqual(6);
  m = 8;
  const f3 = Spacebars.dot(closet, 'mget2', 'getAnswer');
  m = 9;
  expect(f3()).toEqual(8);

  expect(Spacebars.dot(0, 'abc', 'def')).toEqual(0);
  expect(Spacebars.dot(() => null, 'abc', 'def')).toEqual(null);
  expect(Spacebars.dot(() => 0, 'abc', 'def')).toEqual(0);

  // test that in `foo.bar`, `bar` may be a function that takes arguments.
  expect(Spacebars.dot(
    { one: 1, inc(x) { return this.one + x; } }, 'inc',
  )(6)).toEqual(7);
  expect(Spacebars.dot(
    () => ({ one: 1, inc(x) { return this.one + x; } }), 'inc',
  )(8)).toEqual(9);
});
