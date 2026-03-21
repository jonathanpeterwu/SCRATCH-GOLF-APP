const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Polyfill Node.js 'crypto' module for web (needed by expo-modules-core)
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
  };

  return config;
};
