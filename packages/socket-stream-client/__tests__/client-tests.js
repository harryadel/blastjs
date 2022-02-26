import { Tracker } from '@blastjs/tracker';
import isEqual from 'lodash.isequal';
import fetch from 'node-fetch';
import { toSockjsUrl } from '../src/urls';
import { ClientStream } from '../src/browser';

// test('stream - status', () => {
//   // Very basic test. Just see that it runs and returns something. Not a
//   // lot of coverage, but enough that it would have caught a recent bug.
//   const status = Meteor.status();
//   expect(typeof status).toEqual('object');
//   expect(status.status).toBeTruthy();
// });

// test('stream - reconnect', () => {
//   const callback = once(
//     expect(() => {
//       let status;
//       status = Meteor.status();
//       expect(status.status).toEqual('connected');

//       Meteor.reconnect();
//       status = Meteor.status();
//       expect(status.status).toEqual('connected');

//       Meteor.reconnect({ _force: true });
//       status = Meteor.status();
//       expect(status.status).toEqual('waiting');
//     }),
//   );

//   if (Meteor.status().status !== 'connected') { Meteor.connection._stream.on('reset', callback); } else callback();
// });

// Disconnecting and reconnecting transitions through the correct statuses.
test(
  'stream - basic disconnect',
  () => {
    const history = [];
    const stream = new ClientStream('/');
    const onTestComplete = (unexpectedHistory) => {
      stream.disconnect();
      if (unexpectedHistory) {
        console.error(
          `Unexpected status history: ${JSON.stringify(unexpectedHistory)}`,
        );
      }
    };

    Tracker.autorun(() => {
      const status = stream.status();

      if (history[history.length - 1] !== status.status) {
        history.push(status.status);

        if (isEqual(history, ['connecting'])) {
          // do nothing; wait for the next state
        } else if (isEqual(history, ['connecting', 'connected'])) {
          stream.disconnect();
        } else if (isEqual(history, ['connecting', 'connected', 'offline'])) {
          stream.reconnect();
        } else if (
          isEqual(history, [
            'connecting',
            'connected',
            'offline',
            'connecting',
          ])
        ) {
          // do nothing; wait for the next state
        } else if (
          isEqual(history, [
            'connecting',
            'connected',
            'offline',
            'connecting',
            'connected',
          ])
        ) {
          onTestComplete();
        } else {
          onTestComplete(history);
        }
      }
    });
  },
);

// Remain offline if the online event is received while offline.
test(
  'stream - disconnect remains offline',
  () => {
    const history = [];
    const stream = new ClientStream('/');
    const onTestComplete = (unexpectedHistory) => {
      stream.disconnect();
      if (unexpectedHistory) {
        console.error(
          `Unexpected status history: ${JSON.stringify(unexpectedHistory)}`,
        );
      }
    };

    Tracker.autorun(() => {
      const status = stream.status();

      if (history[history.length - 1] !== status.status) {
        history.push(status.status);

        if (isEqual(history, ['connecting'])) {
          // do nothing; wait for the next status
        } else if (isEqual(history, ['connecting', 'connected'])) {
          stream.disconnect();
        } else if (isEqual(history, ['connecting', 'connected', 'offline'])) {
          stream._online();
          expect(status.status === 'offline').toBeTruthy();
          onTestComplete();
        } else {
          onTestComplete(history);
        }
      }
    });
  },
);

test('stream - sockjs urls are computed correctly', () => {
  const testHasSockjsUrl = function (raw, expectedSockjsUrl) {
    const actual = toSockjsUrl(raw);
    if (expectedSockjsUrl instanceof RegExp) { expect(actual.match(expectedSockjsUrl)).toBeTruthy(); } else expect(actual).toEqual(expectedSockjsUrl);
  };

  testHasSockjsUrl(
    'http://subdomain.meteor.com/',
    'http://subdomain.meteor.com/sockjs',
  );
  testHasSockjsUrl(
    'http://subdomain.meteor.com',
    'http://subdomain.meteor.com/sockjs',
  );
  testHasSockjsUrl(
    'subdomain.meteor.com/',
    'http://subdomain.meteor.com/sockjs',
  );
  testHasSockjsUrl(
    'subdomain.meteor.com',
    'http://subdomain.meteor.com/sockjs',
  );
  testHasSockjsUrl('/', '/sockjs');

  testHasSockjsUrl('http://localhost:3000/', 'http://localhost:3000/sockjs');
  testHasSockjsUrl('http://localhost:3000', 'http://localhost:3000/sockjs');
  testHasSockjsUrl('localhost:3000', 'http://localhost:3000/sockjs');

  testHasSockjsUrl(
    'https://subdomain.meteor.com/',
    'https://subdomain.meteor.com/sockjs',
  );
  testHasSockjsUrl(
    'https://subdomain.meteor.com',
    'https://subdomain.meteor.com/sockjs',
  );

  testHasSockjsUrl(
    'ddp+sockjs://ddp--****-foo.meteor.com/sockjs',
    /^https:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/,
  );
  testHasSockjsUrl(
    'ddpi+sockjs://ddp--****-foo.meteor.com/sockjs',
    /^http:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/,
  );
});

test(
  'stream - /websocket is a websocket endpoint',
  async () => {
    //
    // Verify that /websocket and /websocket/ don't return the main page
    //
    for (const path of ['/websocket', '/websocket/']) {
      try {
        const result = await fetch(
          `https://cloud.meteor.com//${path}`,
        );
        expect('Not a valid websocket request').toEqual(result.content);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    }
    //
    // For sanity, also verify that /websockets and /websockets/ return
    // the main page
    //

    // Somewhat contorted but we can't call nested expects (XXX why?)
    // let pageContent;
    // const wrappedCallback = expect((error, result) => {
    //   test.isNull(error);
    //   expect(pageContent).toEqual(result.content);
    // });

    // fetch(
    //   '/',
    //   (error, result) => {
    //     test.isNull(error);
    //     pageContent = result.content;

    //     for (const path of ['/websockets', '/websockets/']) {
    //       fetch(path, wrappedCallback);
    //     }
    //   },
    // );
  },
);
