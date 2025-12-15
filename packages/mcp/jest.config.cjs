/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  coverageReporters: ['text', 'lcov'],
  forceExit: true,
  moduleNameMapper: {
    '^@alps-asd/app-state-diagram/(.*)$': '<rootDir>/../cli/dist/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
      },
    },
  },
};
