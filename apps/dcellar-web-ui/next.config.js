const { withSentryConfig } = require('@sentry/nextjs');

let commitHash = 'no-git-commit';

try {
  commitHash = process.env.COMMIT_SHA || 'no-git-commit';
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`Get git commit hash failed.`);
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const webpack = (config, options) => {
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack'],
  });

  return config;
};

const _getPublicEnv = (prefix) => {
  const envs = process.env;
  const res = {};

  Object.keys(envs).forEach((k) => {
    if (k.startsWith(prefix)) {
      res[k] = envs[k];
    }
  });

  return res;
};

/**
 * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
 */
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  org: 'nodereal-sentry',
  project: 'dcellar-ui',
  authToken: '9e42bc70fd9f45e7a3aaac568e0204a60e734f6ce56d4384af57bedf72e0fcc8',
};

const nextConfig = {
  // https://github.com/vercel/next.js/issues/35822
  // render twice & the memory usage of the wasm instance will also be impacted.
  reactStrictMode: false,
  distDir: '.next',
  webpack,
  assetPrefix: process.env.NEXT_PUBLIC_STATIC_HOST,
  pageExtensions: ['mdx', 'jsx', 'js', 'ts', 'tsx'],
  generateBuildId: async () => {
    return commitHash;
  },
  publicRuntimeConfig: {
    ..._getPublicEnv('NEXT_PUBLIC_'),
  },
  serverRuntimeConfig: {
    ..._getPublicEnv('NEXT_PRIVATE_'),
  },
  sentry: {
    hideSourceMaps: true,
  },
};

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
