const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for date-fns v4 (ESM-first package)
config.resolver.unstable_enablePackageExports = true;

// On Windows, Hermes bytecode generation can segfault (0xC0000142 / exit
// 3221225794) when many `hermesc.exe` child processes spawn simultaneously.
// Capping workers to 2 on Windows eliminates the init race while keeping
// full concurrency on the Linux EAS cloud builders. See ARCHITECTURE.md →
// "Windows Hermes runbook".
if (process.platform === 'win32') {
  config.maxWorkers = 2;
}

module.exports = config;
