module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: 'test/tsconfig.json',
    },
  },
  testEnvironment: 'node',
  clearMocks: true,
};
