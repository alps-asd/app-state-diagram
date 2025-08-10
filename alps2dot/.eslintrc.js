module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // Allow console.log in CLI tool
    'no-console': 'off',
    // Allow unused variables
    'no-unused-vars': 'off',
    // Basic TypeScript checks
    'no-undef': 'off', // TypeScript handles this
  },
  env: {
    node: true,
    jest: true,
    es6: true,
  },
};