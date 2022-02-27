import { Heartbeat } from './heartbeat';
import { MethodInvocation } from './method_invocation';
import { RandomStream } from './random_stream';
import { parseDDP, stringifyDDP, SUPPORTED_DDP_VERSIONS } from './utils';

/**
 * @namespace DDPCommon
 * @summary Namespace for DDPCommon-related methods/classes. Shared between
 * `ddp-client` and `ddp-server`, where the ddp-client is the implementation
 * of a ddp client for both client AND server; and the ddp server is the
 * implementation of the livedata server and stream server. Common
 * functionality shared between both can be shared under this namespace
 */
export const DDPCommon = {
  Heartbeat,
  MethodInvocation,
  RandomStream,
  parseDDP,
  stringifyDDP,
  SUPPORTED_DDP_VERSIONS,
};
