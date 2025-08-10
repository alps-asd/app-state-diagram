module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  rules: {
    // Allow console.log in CLI tool
    'no-console': 'off',
    // Allow any type for flexibility
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow unused variables starting with _
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
  },
  env: {
    node: true,
    jest: true,
  },
};