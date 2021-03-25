/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */

const { Tracker } = require('../src/tracker');

test('tracker - run', (test) => {
  const d = new Tracker.Dependency();
  let x = 0;
  const handle = Tracker.autorun(() => {
    d.depend();
    ++x;
  });
  expect(x).toEqual(1);
  Tracker.flush();
  expect(x).toEqual(1);
  d.changed();
  expect(x).toEqual(1);
  Tracker.flush();
  expect(x).toEqual(2);
  d.changed();
  expect(x).toEqual(2);
  Tracker.flush();
  expect(x).toEqual(3);
  d.changed();
  // Prevent the function from running further.
  handle.stop();
  Tracker.flush();
  expect(x).toEqual(3);
  d.changed();
  Tracker.flush();
  expect(x).toEqual(3);

  Tracker.autorun((internalHandle) => {
    d.depend();
    ++x;
    if (x === 6) { internalHandle.stop(); }
  });
  expect(x).toEqual(4);
  d.changed();
  Tracker.flush();
  expect(x).toEqual(5);
  d.changed();
  // Increment to 6 and stop.
  Tracker.flush();
  expect(x).toEqual(6);
  d.changed();
  Tracker.flush();
  // Still 6!
  expect(x).toEqual(6);

  test.throws(() => {
    Tracker.autorun();
  });
  test.throws(() => {
    Tracker.autorun({});
  });
});

test('tracker - nested run', (test) => {
  const a = new Tracker.Dependency();
  const b = new Tracker.Dependency();
  const c = new Tracker.Dependency();
  const d = new Tracker.Dependency();
  const e = new Tracker.Dependency();
  const f = new Tracker.Dependency();

  let buf = '';

  const c1 = Tracker.autorun(() => {
    a.depend();
    buf += 'a';
    Tracker.autorun(() => {
      b.depend();
      buf += 'b';
      Tracker.autorun(() => {
        c.depend();
        buf += 'c';
        const c2 = Tracker.autorun(() => {
          d.depend();
          buf += 'd';
          Tracker.autorun(() => {
            e.depend();
            buf += 'e';
            Tracker.autorun(() => {
              f.depend();
              buf += 'f';
            });
          });
          Tracker.onInvalidate(() => {
            // only run once
            c2.stop();
          });
        });
      });
    });
    Tracker.onInvalidate((cI) => {
      cI.stop();
    });
  });

  expect(a.hasDependents()).toBeTruthy();
  expect(b.hasDependents()).toBeTruthy();
  expect(c.hasDependents()).toBeTruthy();
  expect(d.hasDependents()).toBeTruthy();
  expect(e.hasDependents()).toBeTruthy();
  expect(f.hasDependents()).toBeTruthy();

  b.changed();
  expect(''); // didn't flush yet
  Tracker.flush();
  expect('bcdef');

  c.changed();
  Tracker.flush();
  expect('cdef');

  const changeAndExpect = function (v, str) {
    v.changed();
    Tracker.flush();
    expect(str);
  };

  // should cause running
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');
  // invalidate inner context
  changeAndExpect(d, '');
  // no more running!
  changeAndExpect(e, '');
  changeAndExpect(f, '');

  expect(a.hasDependents()).toBeTruthy();
  expect(b.hasDependents()).toBeTruthy();
  expect(c.hasDependents()).toBeTruthy();
  expect(d.hasDependents()).toBeFalsy();
  expect(e.hasDependents()).toBeFalsy();
  expect(f.hasDependents()).toBeFalsy();

  // rerun C
  changeAndExpect(c, 'cdef');
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');
  // rerun B
  changeAndExpect(b, 'bcdef');
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');

  expect(a.hasDependents()).toBeTruthy();
  expect(b.hasDependents()).toBeTruthy();
  expect(c.hasDependents()).toBeTruthy();
  expect(d.hasDependents()).toBeTruthy();
  expect(e.hasDependents()).toBeTruthy();
  expect(f.hasDependents()).toBeTruthy();

  // kill A
  a.changed();
  changeAndExpect(f, '');
  changeAndExpect(e, '');
  changeAndExpect(d, '');
  changeAndExpect(c, '');
  changeAndExpect(b, '');
  changeAndExpect(a, '');

  expect(a.hasDependents()).toBeFalsy();
  expect(b.hasDependents()).toBeFalsy();
  expect(c.hasDependents()).toBeFalsy();
  expect(d.hasDependents()).toBeFalsy();
  expect(e.hasDependents()).toBeFalsy();
  expect(f.hasDependents()).toBeFalsy();
});

test('tracker - flush', (test) => {
  let buf = '';

  const c1 = Tracker.autorun((c) => {
    buf += 'a';
    // invalidate first time
    if (c.firstRun) { c.invalidate(); }
  });

  expect.toEqual(buf, 'a');
  Tracker.flush();
  expect.toEqual(buf, 'aa');
  Tracker.flush();
  expect.toEqual(buf, 'aa');
  c1.stop();
  Tracker.flush();
  expect.toEqual(buf, 'aa');

  /// ///

  buf = '';

  const c2 = Tracker.autorun((c) => {
    buf += 'a';
    // invalidate first time
    if (c.firstRun) { c.invalidate(); }

    Tracker.onInvalidate(() => {
      buf += '*';
    });
  });

  expect.toEqual(buf, 'a*');
  Tracker.flush();
  expect.toEqual(buf, 'a*a');
  c2.stop();
  expect.toEqual(buf, 'a*a*');
  Tracker.flush();
  expect.toEqual(buf, 'a*a*');

  /// //
  // Can flush a different run from a run;
  // no current computation in afterFlush

  buf = '';

  const c3 = Tracker.autorun((c) => {
    buf += 'a';
    // invalidate first time
    if (c.firstRun) { c.invalidate(); }
    Tracker.afterFlush(() => {
      buf += (Tracker.active ? '1' : '0');
    });
  });

  Tracker.afterFlush(() => {
    buf += 'c';
  });

  let c4 = Tracker.autorun((c) => {
    c4 = c;
    buf += 'b';
  });

  Tracker.flush();
  expect.toEqual(buf, 'aba0c0');
  c3.stop();
  c4.stop();
  Tracker.flush();

  // cases where flush throws

  let ran = false;
  Tracker.afterFlush((arg) => {
    ran = true;
    expect.toEqual(typeof arg, 'undefined');
    test.throws(() => {
      Tracker.flush(); // illegal nested flush
    });
  });

  Tracker.flush();
  expect(ran).toBeTruthy();

  test.throws(() => {
    Tracker.autorun(() => {
      Tracker.flush(); // illegal to flush from a computation
    });
  });

  test.throws(() => {
    Tracker.autorun(() => {
      Tracker.autorun(() => { });
      Tracker.flush();
    });
  });
});

test('tracker - lifecycle', (test) => {
  expect(Tracker.active).toBeFalsy();
  expect(Tracker.currentComputation).toEqual(null);

  let runCount = 0;
  let firstRun = true;
  const buf = [];
  let cbId = 1;
  const makeCb = function () {
    const id = cbId += 1;
    return function () {
      buf.push(id);
    };
  };

  let shouldStop = false;

  const c1 = Tracker.autorun((c) => {
    expect(Tracker.active).toBeTruthy();
    expect(c).toEqual(Tracker.currentComputation);
    expect(c.stopped).toEqual(false);
    expect(c.invalidated).toEqual(false);
    expect(c.firstRun).toEqual(firstRun);

    Tracker.onInvalidate(makeCb()); // 1, 6, ...
    Tracker.afterFlush(makeCb()); // 2, 7, ...

    Tracker.autorun((x) => {
      x.stop();
      c.onInvalidate(makeCb()); // 3, 8, ...

      Tracker.onInvalidate(makeCb()); // 4, 9, ...
      Tracker.afterFlush(makeCb()); // 5, 10, ...
    });
    runCount += 1;

    if (shouldStop) { c.stop(); }
  });

  firstRun = false;

  expect(runCount).toEqual(1);

  expect(buf).toEqual([4]);
  c1.invalidate();
  expect(runCount).toEqual(1);
  expect(c1.invalidated).toEqual(true);
  expect(c1.stopped).toEqual(false);
  expect(buf).toEqual([4, 1, 3]);

  Tracker.flush();

  expect(runCount).toEqual(2);
  expect(c1.invalidated).toEqual(false);
  expect(buf).toEqual([4, 1, 3, 9, 2, 5, 7, 10]);

  // test self-stop
  buf.length = 0;
  shouldStop = true;
  c1.invalidate();
  expect(buf).toEqual([6, 8]);
  Tracker.flush();
  expect(buf).toEqual([6, 8, 14, 11, 13, 12, 15]);
});

test('tracker - onInvalidate', (test) => {
  let buf = '';

  const c1 = Tracker.autorun(() => {
    buf += '*';
  });

  const append = function (x, expectedComputation) {
    return function (givenComputation) {
      expect(Tracker.active).toBeFalsy();
      expect(givenComputation).toEqual(expectedComputation || c1);
      buf += x;
    };
  };

  c1.onStop(append('s'));

  c1.onInvalidate(append('a'));
  c1.onInvalidate(append('b'));
  expect(buf).toEqual('*');
  Tracker.autorun((me) => {
    Tracker.onInvalidate(append('z', me));
    me.stop();
    expect(buf).toEqual('*z');
    c1.invalidate();
  });
  expect(buf).toEqual('*zab');
  c1.onInvalidate(append('c'));
  c1.onInvalidate(append('d'));
  expect(buf).toEqual('*zabcd');
  Tracker.flush();
  expect(buf).toEqual('*zabcd*');

  // afterFlush ordering
  buf = '';
  c1.onInvalidate(append('a'));
  c1.onInvalidate(append('b'));
  Tracker.afterFlush(() => {
    append('x')(c1);
    c1.onInvalidate(append('c'));
    c1.invalidate();
    Tracker.afterFlush(() => {
      append('y')(c1);
      c1.onInvalidate(append('d'));
      c1.invalidate();
    });
  });
  Tracker.afterFlush(() => {
    append('z')(c1);
    c1.onInvalidate(append('e'));
    c1.invalidate();
  });

  expect(buf).toEqual('');
  Tracker.flush();
  expect(buf).toEqual('xabc*ze*yd*');

  buf = '';
  c1.onInvalidate(append('m'));
  Tracker.flush();
  expect(buf).toEqual('');
  c1.stop();
  expect(buf).toEqual('ms'); // s is from onStop
  Tracker.flush();
  expect(buf).toEqual('ms');
  c1.onStop(append('S'));
  expect(buf).toEqual('msS');
});

test('tracker - invalidate at flush time', (test) => {
  // Test this sentence of the docs: Functions are guaranteed to be
  // called at a time when there are no invalidated computations that
  // need rerunning.

  const buf = [];

  Tracker.afterFlush(() => {
    buf.push('C');
  });

  // When c1 is invalidated, it invalidates c2, then stops.
  const c1 = Tracker.autorun((c) => {
    if (!c.firstRun) {
      buf.push('A');
      c2.invalidate();
      c.stop();
    }
  });

  let c2 = Tracker.autorun((c) => {
    if (!c.firstRun) {
      buf.push('B');
      c.stop();
    }
  });

  // Invalidate c1.  If all goes well, the re-running of
  // c2 should happen before the afterFlush.
  c1.invalidate();
  Tracker.flush();

  expect(buf.join('')).toEqual('ABC');
});

test('tracker - throwFirstError', (test) => {
  const d = new Tracker.Dependency();
  Tracker.autorun((c) => {
    d.depend();

    if (!c.firstRun) { throw new Error('foo'); }
  });

  d.changed();
  // doesn't throw; logs instead.
  // Meteor._suppress_log(1);
  Tracker.flush();

  d.changed();
  test.throws(() => {
    Tracker.flush({ _throwFirstError: true });
  }, /foo/);
});

test('tracker - no infinite recomputation', async (test) => {
  let reran = false;
  const c = Tracker.autorun((computation) => {
    if (!computation.firstRun) { reran = true; }
    computation.invalidate();
  });
  expect(reran).toBeFalsy();
  setTimeout(() => {
    c.stop();
    Tracker.afterFlush(() => {
      expect(reran).toBeTruthy();
      expect(c.stopped).toBeTruthy();
    });
  }, 100);
});

test('tracker - Tracker.flush finishes', (test) => {
  // Currently, _runFlush will "yield" every 1000 computations... unless run in
  // Tracker.flush. So this test validates that Tracker.flush is capable of
  // running 2000 computations. Which isn't quite the same as infinity, but it's
  // getting there.
  let n = 0;
  const c = Tracker.autorun((computation) => {
    if (++n < 2000) {
      computation.invalidate();
    }
  });
  expect(n).toEqual(1);
  Tracker.flush();
  expect(n).toEqual(2000);
});

test('tracker - Tracker.autorun, onError option', (test) => {
  // const errorFunction = jest.fn();
  const errorFunction = jest.fn((err) => {
    expect(err.message).toEqual('foo');
  });

  const d = new Tracker.Dependency();
  const c = Tracker.autorun((computation) => {
    d.depend();

    if (!computation.firstRun) { throw new Error('foo'); }
  }, {
    onError: errorFunction,
  });
  expect(errorFunction).toHaveBeenCalled();

  d.changed();
  Tracker.flush();
});

test('computation - #flush', (test) => {
  let i = 0;
  let j = 0;
  const d = new Tracker.Dependency();
  const c1 = Tracker.autorun(() => {
    d.depend();
    i += 1;
  });
  const c2 = Tracker.autorun(() => {
    d.depend();
    j += 1;
  });
  expect(i).toEqual(1);
  expect(j).toEqual(1);

  d.changed();
  c1.flush();
  expect(i).toEqual(2);
  expect(j).toEqual(1);

  Tracker.flush();
  expect(i).toEqual(2);
  expect(j).toEqual(2);
});

test('computation - #run', () => {
  let i = 0;
  const d = new Tracker.Dependency();
  const d2 = new Tracker.Dependency();
  const computation = Tracker.autorun(() => {
    d.depend();
    i += 1;
    // when #run() is called, this dependency should be picked up
    if (i >= 2 && i < 4) { d2.depend(); }
  });
  expect(i).toEqual(1);
  computation.run();
  expect(i).toEqual(2);

  d.changed(); Tracker.flush();
  expect(i).toEqual(3);

  // we expect to depend on d2 at this point
  d2.changed(); Tracker.flush();
  expect(i).toEqual(4);

  // we no longer depend on d2, only d
  d2.changed(); Tracker.flush();
  expect(i).toEqual(4);
  d.changed(); Tracker.flush();
  expect(i).toEqual(5);
});
