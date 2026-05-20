const path = require('path')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, '.env.development') }))

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '@scalar/express-api-reference': '<rootDir>/tests/__mocks__/scalar.js',
  },
  testTimeout: 10000,
}
