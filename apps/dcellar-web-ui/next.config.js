const { withSentryConfig } = require('@sentry/nextjs');

let commitHash = 'no-git-commit';

try {
  commitHash = process.env.COMMIT_SHA || 'no-git-commit';
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`Get git commit hash failed.`);
}

const withTranspileModules = require('next-transpile-modules')(['echarts']);

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

const assetPrefix = process.env.NEXT_PUBLIC_STATIC_HOST || '';

/**
 * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
 */
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  org: 'nodereal-sentry',
  project: 'dcellar-ui',
  authToken: '9e42bc70fd9f45e7a3aaac568e0204a60e734f6ce56d4384af57bedf72e0fcc8',
};

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  headers: async () => [
    {
      // cache public folder assets (default max-age: 0).
      source: `${assetPrefix}/:public(fonts|images|wasm|zk-crypto|js)/:path*`,
      locale: false,
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000',
        },
      ],
    },
  ],
  // https://github.com/vercel/next.js/issues/35822
  // render twice & the memory usage of the wasm instance will also be impacted.
  reactStrictMode: false,
  distDir: '.next',
  webpack,
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static/dcellar-web-ui' : '',
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
  experimental: {
    instrumentationHook: true,
  },
  compiler: {
    emotion: true,
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
};

module.exports = withSentryConfig(
  withBundleAnalyzer(withTranspileModules(nextConfig)),
  sentryWebpackPluginOptions,
);
