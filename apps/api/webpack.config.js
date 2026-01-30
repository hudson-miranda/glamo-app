const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => {
  return {
    ...options,
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
        allowlist: [
          /^@glamo\/.*/,
        ],
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@glamo/database': path.resolve(__dirname, '../../packages/database/src'),
        '@glamo/shared': path.resolve(__dirname, '../../packages/shared/src'),
        '@glamo/validators': path.resolve(__dirname, '../../packages/validators/src'),
      },
    },
  };
};
