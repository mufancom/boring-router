module.exports = {
  title: 'Boring Router',
  base: '/boring-router/',
  files: 'doc/**/*.mdx',
  menu: ['Introduction', 'Get Started', 'Examples', 'References'],
  themeConfig: {
    initialColorMode: 'dark',
    styles: {
      inlineCode: {
        my: -1,
        px: 2,
        py: 1,
        borderRadius: 2,
        bg: 'prism.plain.backgroundColor',
      },
    },
  },
};
