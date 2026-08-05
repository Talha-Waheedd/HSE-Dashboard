module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 'warn',
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'consistent-return': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.js', 'tests/**'] }],
    'class-methods-use-this': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
  },
};
