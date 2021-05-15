if (typeof Meteor === "undefined") {
  const Meteor = {
    isClient: true,
    isServer: false,
    _noYieldsAllowed(f) {
      return f();
    },
    _setImmediate(f) {
      return window.setTimeout(f);
    },
    setTimeout(f, d) {
      return window.setTimeout(f, d);
    },
    setInterval(f, d) {
      return window.setInterval(f, d);
    },
    defer(f) {
      return Meteor._setImmediate(f);
    }
  };
  __meteor_runtime_config__ = {

  };
  module.exports = Meteor;
}
else {
  module.exports = Meteor;
}
