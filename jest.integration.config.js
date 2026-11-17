/**
 * Integration tests run against a real BURAK backend:
 *   EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration
 * They create real member accounts (nickname prefix "qa_mobile_").
 */
const base = require('./package.json').jest;

module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['<rootDir>/src/**/*.int.test.ts'],
  testTimeout: 30000,
};
