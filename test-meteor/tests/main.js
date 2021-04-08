/* eslint-env mocha */
import { expect } from 'chai';
import { Tracker as _Tracker } from 'meteor/tracker';
import { Tracker } from 'standalone-tracker';
import { suppressLog } from 'standalone-tracker/src/debug';

it('is not equal Meteor Tracker', () => {
  expect(_Tracker).to.not.equal(Tracker);
});

it('computation - #flush', () => {
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

  expect(i).to.equal(1);
  expect(j).to.equal(1);

  d.changed();
  c1.flush();
  expect(i).to.equal(2);
  expect(j).to.equal(1);

  Tracker.flush();
  expect(i).to.equal(2);
  expect(j).to.equal(2);
});

it('computation - #run', () => {
  let i = 0;
  const d = new Tracker.Dependency();
  const d2 = new Tracker.Dependency();
  const computation = Tracker.autorun(() => {
    d.depend();
    i += 1;
    // when #run() is called, this dependency should be picked up
    if (i >= 2 && i < 4) { d2.depend(); }
  });
  expect(i).to.equal(1);
  computation.run();
  expect(i).to.equal(2);

  d.changed(); Tracker.flush();
  expect(i).to.equal(3);

  // we expect to depend on d2 at this point
  d2.changed(); Tracker.flush();
  expect(i).to.equal(4);

  // we no longer depend on d2, only d
  d2.changed(); Tracker.flush();
  expect(i).to.equal(4);
  d.changed(); Tracker.flush();
  expect(i).to.equal(5);
});

it('tracker - run', () => {
  const d = new Tracker.Dependency();
  let x = 0;
  const handle = Tracker.autorun(() => {
    d.depend();
    ++x;
  });
  expect(x).to.equal(1);
  Tracker.flush();
  expect(x).to.equal(1);
  d.changed();
  expect(x).to.equal(1);
  Tracker.flush();
  expect(x).to.equal(2);
  d.changed();
  expect(x).to.equal(2);
  Tracker.flush();
  expect(x).to.equal(3);
  d.changed();
  // Prevent the function from running further.
  handle.stop();
  Tracker.flush();
  expect(x).to.equal(3);
  d.changed();
  Tracker.flush();
  expect(x).to.equal(3);

  Tracker.autorun((internalHandle) => {
    d.depend();
    ++x;
    if (x === 6) { internalHandle.stop(); }
  });

  expect(x).to.equal(4);
  d.changed();
  Tracker.flush();
  expect(x).to.equal(5);
  d.changed();
  // Increment to 6 and stop.
  Tracker.flush();
  expect(x).to.equal(6);
  d.changed();
  Tracker.flush();
  // Still 6!
  expect(x).to.equal(6);

  expect(() => {
    Tracker.autorun();
  }).to.throw();

  expect(() => {
    Tracker.autorun({});
  }).to.throw();
});

it('tracker - nested run', () => {
  const a = new Tracker.Dependency();
  const b = new Tracker.Dependency();
  const c = new Tracker.Dependency();
  const d = new Tracker.Dependency();
  const e = new Tracker.Dependency();
  const f = new Tracker.Dependency();

  let buf = '';

  const computation = Tracker.autorun(() => {
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
    Tracker.onInvalidate((c1) => {
      c1.stop();
    });
  });

  expect(a.hasDependents()).to.be.ok;
  expect(b.hasDependents()).to.be.ok;
  expect(c.hasDependents()).to.be.ok;
  expect(d.hasDependents()).to.be.ok;
  expect(e.hasDependents()).to.be.ok;
  expect(f.hasDependents()).to.be.ok;

  b.changed();
  expect(buf).to.equal(''); // didn't flush yet
  Tracker.flush();
  expect(buf).to.equal('bcdef');

  c.changed();
  Tracker.flush();
  expect(buf).to.equal('cdef');

  const changeAndExpect = function (v, str) {
    v.changed();
    Tracker.flush();
    expect(v).to.equal(str);
  };

  // should cause running
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');
  // invalidate inner context
  changeAndExpect(d, '');
  // no more running!
  changeAndExpect(e, '');
  changeAndExpect(f, '');

  expect(a.hasDependents()).to.be.ok;
  expect(b.hasDependents()).to.be.ok;
  expect(c.hasDependents()).to.be.ok;
  expect(d.hasDependents()).to.be.not.ok;
  expect(e.hasDependents()).to.be.not.ok;
  expect(f.hasDependents()).to.be.not.ok;

  // rerun C
  changeAndExpect(c, 'cdef');
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');
  // rerun B
  changeAndExpect(b, 'bcdef');
  changeAndExpect(e, 'ef');
  changeAndExpect(f, 'f');

  expect(a.hasDependents()).to.be.ok;
  expect(b.hasDependents()).to.be.ok;
  expect(c.hasDependents()).to.be.ok;
  expect(d.hasDependents()).to.be.ok;
  expect(e.hasDependents()).to.be.ok;
  expect(f.hasDependents()).to.be.ok;

  // kill A
  a.changed();
  changeAndExpect(f, '');
  changeAndExpect(e, '');
  changeAndExpect(d, '');
  changeAndExpect(c, '');
  changeAndExpect(b, '');
  changeAndExpect(a, '');

  expect(a.hasDependents()).to.be.not.ok;
  expect(b.hasDependents()).to.be.not.ok;
  expect(c.hasDependents()).to.be.not.ok;
  expect(d.hasDependents()).to.be.not.ok;
  expect(e.hasDependents()).to.be.not.ok;
  expect(f.hasDependents()).to.be.not.ok;
});

it('tracker - flush', () => {
  let buf = '';

  const c1 = Tracker.autorun((c) => {
    buf += 'a';
    // invalidate first time
    if (c.firstRun) { c.invalidate(); }
  });

  expect(buf).to.equal('a');
  Tracker.flush();
  expect(buf).to.equal('aa');
  Tracker.flush();
  expect(buf).to.equal('aa');
  c1.stop();
  Tracker.flush();
  expect(buf).to.equal('aa');

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

  expect(buf).to.equal('a*');
  Tracker.flush();
  expect(buf).to.equal('a*a');
  c2.stop();
  expect(buf).to.equal('a*a*');
  Tracker.flush();
  expect(buf).to.equal('a*a*');

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

  const c4 = Tracker.autorun((c) => {
    buf += 'b';
  });

  Tracker.flush();
  expect(buf).to.equal('aba0c0');
  c3.stop();
  c4.stop();
  Tracker.flush();

  // cases where flush throws

  let ran = false;
  Tracker.afterFlush((arg) => {
    ran = true;
    expect(typeof arg).to.equal('undefined');
    expect(() => {
      Tracker.flush(); // illegal nested flush
    }).to.throw();
  });

  Tracker.flush();
  expect(ran).to.be.ok;

  expect(() => {
    Tracker.autorun(() => {
      Tracker.flush(); // illegal to flush from a computation
    });
  }).to.throw();

  expect(() => {
    Tracker.autorun(() => {
      Tracker.autorun(() => { });
      Tracker.flush();
    });
  }).to.throw();
});

it('tracker - lifecycle', () => {
  expect(Tracker.active).to.be.not.ok;
  expect(Tracker.currentComputation).to.equal(null);

  let runCount = 0;
  let firstRun = true;
  const buf = [];
  let cbId = 1;
  const makeCb = function () {
    const id = cbId++;
    return function () {
      buf.push(id);
    };
  };

  let shouldStop = false;

  const c1 = Tracker.autorun((c) => {
    expect(Tracker.active).to.be.ok;
    expect(c).to.equal(Tracker.currentComputation);
    expect(c.stopped).to.equal(false);
    expect(c.invalidated).to.equal(false);
    expect(c.firstRun).to.equal(firstRun);

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

  expect(runCount).to.equal(1);

  expect(buf).to.deep.equal([4]);
  c1.invalidate();
  expect(runCount).to.equal(1);
  expect(c1.invalidated).to.equal(true);
  expect(c1.stopped).to.equal(false);
  expect(buf).to.deep.equal([4, 1, 3]);

  Tracker.flush();

  expect(runCount).to.equal(2);
  expect(c1.invalidated).to.equal(false);
  expect(buf).to.deep.equal([4, 1, 3, 9, 2, 5, 7, 10]);

  // test self-stop
  buf.length = 0;
  shouldStop = true;
  c1.invalidate();
  expect(buf).to.deep.equal([6, 8]);
  Tracker.flush();
  expect(buf).to.deep.equal([6, 8, 14, 11, 13, 12, 15]);
});

it('tracker - onInvalidate', () => {
  let buf = '';

  const c1 = Tracker.autorun(() => {
    buf += '*';
  });

  const append = function (x, expectedComputation) {
    return function (givenComputation) {
      expect(Tracker.active).to.be.not.ok;
      expect(givenComputation).to.equal(expectedComputation || c1);
      buf += x;
    };
  };

  c1.onStop(append('s'));

  c1.onInvalidate(append('a'));
  c1.onInvalidate(append('b'));
  expect(buf).to.equal('*');
  Tracker.autorun((me) => {
    Tracker.onInvalidate(append('z', me));
    me.stop();
    expect(buf).to.equal('*z');
    c1.invalidate();
  });
  expect(buf).to.equal('*zab');
  c1.onInvalidate(append('c'));
  c1.onInvalidate(append('d'));
  expect(buf).to.equal('*zabcd');
  Tracker.flush();
  expect(buf).to.equal('*zabcd*');

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

  expect(buf).to.equal('');
  Tracker.flush();
  expect(buf).to.equal('xabc*ze*yd*');

  buf = '';
  c1.onInvalidate(append('m'));
  Tracker.flush();
  expect(buf).to.equal('');
  c1.stop();
  expect(buf).to.equal('ms'); // s is from onStop
  Tracker.flush();
  expect(buf).to.equal('ms');
  c1.onStop(append('S'));
  expect(buf).to.equal('msS');
});

it('tracker - invalidate at flush time', () => {
  // Test this sentence of the docs: Functions are guaranteed to be
  // called at a time when there are no invalidated computations that
  // need rerunning.

  const buf = [];

  Tracker.afterFlush(() => {
    buf.push('C');
  });

  const c2 = Tracker.autorun((c) => {
    if (!c.firstRun) {
      buf.push('B');
      c.stop();
    }
  });

  // When c1 is invalidated, it invalidates c2, then stops.
  const c1 = Tracker.autorun((c) => {
    if (!c.firstRun) {
      buf.push('A');
      c2.invalidate();
      c.stop();
    }
  });

  // Invalidate c1.  If all goes well, the re-running of
  // c2 should happen before the afterFlush.
  c1.invalidate();
  Tracker.flush();

  expect(buf.join('')).to.equal('ABC');
});

it('tracker - throwFirstError', () => {
  const d = new Tracker.Dependency();
  Tracker.autorun((c) => {
    d.depend();

    if (!c.firstRun) { throw new Error('foo'); }
  });

  d.changed();
  // doesn't throw; logs instead.
  suppressLog(1);
  Tracker.flush();

  d.changed();
  expect(() => {
    Tracker.flush({ _throwFirstError: true });
  }).to.throw();
});

it('tracker - Tracker.flush finishes', () => {
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
  expect(n).to.equal(1);
  Tracker.flush();
  expect(n).to.equal(2000);
});

it('tracker - Tracker.autorun, onError option', () => {
  const d = new Tracker.Dependency();
  const c = Tracker.autorun((computation) => {
    d.depend();

    if (!computation.firstRun) { throw new Error('foo'); }
  }, {
    onError: (err) => {
      expect(err.message).to.equal('foo');
    },
  });
  d.changed();
  Tracker.flush();
});

it('tracker - no infinite recomputation', () => {
  let reran = false;
  const c = Tracker.autorun((computation) => {
    if (!computation.firstRun) { reran = true; }
    computation.invalidate();
  });
  expect(reran).to.equal(false);
  setTimeout(() => {
    c.stop();
    Tracker.afterFlush(() => {
      expect(reran).to.equal(true);
      expect(c.stopped).to.equal(true);
    });
  }, 100);
});
