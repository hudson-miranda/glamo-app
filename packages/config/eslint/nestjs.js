/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  rules: {
    // NestJS specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow decorators without issues
    '@typescript-eslint/no-empty-function': 'off',

    // Allow empty constructors for DI
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
  },
};
