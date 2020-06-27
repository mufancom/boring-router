module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2020: true,
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        'plugin:@magicspace/default',
        'plugin:@magicspace/override-dev',
      ],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      settings: {
        'import/core-modules': ['boring-router-react'],
      },
    },
  ],
};
