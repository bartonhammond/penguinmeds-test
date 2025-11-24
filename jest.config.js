module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['tests/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/helpers/'],
  testTimeout: 90000,
  verbose: true,
  bail: false,
  maxWorkers: 1,
  testSequencer: './jest.sequencer.js'
};
