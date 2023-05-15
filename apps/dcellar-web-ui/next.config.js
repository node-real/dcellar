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

const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = withBundleAnalyzer(nextConfig);
