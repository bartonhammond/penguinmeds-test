module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['tests/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/helpers/'],
  testTimeout: 60000,
  verbose: true,
  bail: false,
  maxWorkers: 1
};
