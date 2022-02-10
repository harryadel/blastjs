import { Tracker } from '@blastjs/tracker';
import { MongoID } from '@blastjs/mongo-id';
import { LocalCollection } from '../src/local_collection';

test('minimongo - wrapTransform', () => {
  const wrap = LocalCollection.wrapTransform;

  // Transforming no function gives falsey.
  expect(wrap(undefined)).toBeFalsy();
  expect(wrap(null)).toBeFalsy();

  // It's OK if you don't change the ID.
  const validTransform = (doc) => {
    delete doc.x;
    doc.y = 42;
    doc.z = () => 43;
    return doc;
  };
  const transformed = wrap(validTransform)({ _id: 'asdf', x: 54 });
  expect(Object.keys(transformed)).toEqual(['_id', 'y', 'z']);
  expect(transformed.y).toEqual(42);
  expect(transformed.z()).toEqual(43);

  // Ensure that ObjectIDs work (even if the _ids in question are not ===-equal)
  const oid1 = new MongoID.ObjectID();
  const oid2 = new MongoID.ObjectID(oid1.toHexString());
  expect(
    wrap(() => ({
      _id: oid2,
    }))({ _id: oid1 }),
  ).toEqual(
    { _id: oid2 },
  );

  // transform functions must return objects
  const invalidObjects = [
    'asdf', new MongoID.ObjectID(), false, null, true,
    27, [123], /adsf/, new Date(), () => {}, undefined,
  ];
  invalidObjects.forEach((invalidObject) => {
    const wrapped = wrap(() => invalidObject);
    expect(() => {
      wrapped({ _id: 'asdf' });
    }).toThrow();
  }, /transform must return object/);

  // transform functions may not change _ids
  const wrapped = wrap((doc) => { doc._id = 'x'; return doc; });
  expect(() => {
    wrapped({ _id: 'y' });
  }).toThrowError(/can't have different _id/);

  // transform functions may remove _ids
  expect(
    { _id: 'a', x: 2 },
  ).toEqual(
    wrap((d) => { delete d._id; return d; })({ _id: 'a', x: 2 }),
  );

  // test that wrapped transform functions are nonreactive
  const unwrapped = (doc) => {
    expect(Tracker.active).toBeFalsy();
    return doc;
  };
  const handle = Tracker.autorun(() => {
    expect(Tracker.active).toBeTruthy();
    wrap(unwrapped)({ _id: 'xxx' });
  });
  handle.stop();
});
