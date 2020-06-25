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
      extends: ['plugin:@magicspace/default'],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
