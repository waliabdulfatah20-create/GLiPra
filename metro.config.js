const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for date-fns v4 (ESM-first package)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
