module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'test/tsconfig.json',
    },
  },
  testEnvironment: 'node',
  testMatch: ['**/test/*.test.ts'],
  clearMocks: true,
};
