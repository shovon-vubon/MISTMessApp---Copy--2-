const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase SDK v9+ ESM modules have internal circular dependencies that cause
// "Cannot access before initialization" TDZ errors when bundled with Metro's
// package-exports resolution. Falling back to CJS builds fixes this.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
