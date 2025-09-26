/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    // Completely exclude MongoDB and related modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js modules that shouldn't be in client bundle
        child_process: false,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        querystring: false,
        'timers/promises': false,
        timers: false,
        buffer: false,
        events: false,
        'mongodb': false,
      };

      // Exclude MongoDB entirely from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'mongodb': 'commonjs mongodb',
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
      });
      
      // Ignore MongoDB imports in client code
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^mongodb$/,
        })
      );
    }

    return config;
  },
  // Improve build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Handle static files
  trailingSlash: false,
  // Optimize for development
  swcMinify: true,
};

module.exports = nextConfig;