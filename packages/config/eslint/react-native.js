/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./react.js'],
  env: {
    'react-native/react-native': true,
  },
  plugins: ['react-native'],
  rules: {
    // React Native specific
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',
  },
};
