module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  globals: {
    'ts-jest': {
      tsConfig: 'test/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/test/*.test.(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
