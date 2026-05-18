const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const ASYNC_REQUIRE_DIR = `${path.sep}expo${path.sep}src${path.sep}async-require${path.sep}`;
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isAsyncRequireHmr =
    moduleName === './hmr' && context.originModulePath?.includes(ASYNC_REQUIRE_DIR);

  if (isAsyncRequireHmr && platform !== 'web') {
    return context.resolveRequest(context, './hmr.native', platform);
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
