/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  coverageReporters: ['text', 'lcov'],
  coverageProvider: 'babel',
  cache: false,
  forceExit: true,
  moduleNameMapper: {
    '^@alps-asd/app-state-diagram/(.*)$': '<rootDir>/../app-state-diagram/dist/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true } }],
  },
};
