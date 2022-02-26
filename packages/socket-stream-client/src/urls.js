export const absoluteUrl = function (path, options) {
  // path is optional
  if (!options && typeof path === 'object') {
    options = path;
    path = undefined;
  }
  // merge options with defaults
  options = { ...options || {} };

  let url = options.rootUrl;
  if (!url) { throw new Error('Must pass options.rootUrl or set ROOT_URL in the server environment'); }

  if (!/^http[s]?:\/\//i.test(url)) // url starts with 'http://' or 'https://'
  { url = `http://${url}`; } // we will later fix to https if options.secure is set

  if (!url.endsWith('/')) {
    url += '/';
  }

  if (path) {
    // join url and path with a / separator
    while (path.startsWith('/')) {
      path = path.slice(1);
    }
    url += path;
  }

  // turn http to https if secure option is set, and we're not talking
  // to localhost.
  if (options.secure
      && /^http:/.test(url) // url starts with 'http:'
      && !/http:\/\/localhost[:\/]/.test(url) // doesn't match localhost
      && !/http:\/\/127\.0\.0\.1[:\/]/.test(url)) // or 127.0.0.1
  { url = url.replace(/^http:/, 'https:'); }

  if (options.replaceLocalhost) { url = url.replace(/^http:\/\/localhost([:\/].*)/, 'http://127.0.0.1$1'); }

  return url;
};

// @param url {String} URL to Meteor app, eg:
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.
// for scheme "http" and subPath "sockjs"
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"
//   or "https://ddp--1234-foo.meteor.com/sockjs"
function translateUrl(url, newSchemeBase, subPath) {
  if (!newSchemeBase) {
    newSchemeBase = 'http';
  }

  if (subPath !== 'sockjs' && url.startsWith('/')) {
    url = absoluteUrl(url.substr(1));
  }

  const ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
  const httpUrlMatch = url.match(/^http(s?):\/\//);
  let newScheme;
  if (ddpUrlMatch) {
    // Remove scheme and split off the host.
    const urlAfterDDP = url.substr(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === 'i' ? newSchemeBase : `${newSchemeBase}s`;
    const slashPos = urlAfterDDP.indexOf('/');
    let host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
    const rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos);

    // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames
    // and avoid browser per-hostname connection limits.
    host = host.replace(/\*/g, () => Math.floor(Math.random() * 10));

    return `${newScheme}://${host}${rest}`;
  } if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : `${newSchemeBase}s`;
    const urlAfterHttp = url.substr(httpUrlMatch[0].length);
    url = `${newScheme}://${urlAfterHttp}`;
  }

  // Prefix FQDNs but not relative URLs
  if (url.indexOf('://') === -1 && !url.startsWith('/')) {
    url = `${newSchemeBase}://${url}`;
  }

  // XXX This is not what we should be doing: if I have a site
  // deployed at "/foo", then DDP.connect("/") should actually connect
  // to "/", not to "/foo". "/" is an absolute path. (Contrast: if
  // deployed at "/foo", it would be reasonable for DDP.connect("bar")
  // to connect to "/foo/bar").
  //
  // We should make this properly honor absolute paths rather than
  // forcing the path to be relative to the site root. Simultaneously,
  // we should set DDP_DEFAULT_CONNECTION_URL to include the site
  // root. See also client_convenience.js #RationalizingRelativeDDPURLs
  // url = _relativeToSiteRootUrl(url);

  if (url.endsWith('/')) return url + subPath;
  return `${url}/${subPath}`;
}

export function toSockjsUrl(url) {
  return translateUrl(url, 'http', 'sockjs');
}

export function toWebsocketUrl(url) {
  return translateUrl(url, 'ws', 'websocket');
}
