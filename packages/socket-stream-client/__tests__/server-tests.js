import { ClientStream } from '../src/server';
import { absoluteUrl } from '../src/urls';

test(
  'stream client - callbacks run in a fiber',
  () => {
    const stream = new ClientStream(absoluteUrl(undefined, { rootUrl: 'http://subdomain.meteor.com' }));

    let messageFired = false;
    let resetFired = false;

    stream.on(
      'message',
      () => {
        if (resetFired) stream.disconnect();
        messageFired = true;
      },
    );

    stream.on(
      'reset',
      () => {
        if (messageFired) stream.disconnect();
        resetFired = true;
      },
    );
  },
);
