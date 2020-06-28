module.exports = {
  title: 'Boring Router',
  base: '/boring-router/',
  files: 'doc/**/*.mdx',
  menu: [
    'Introduction',
    'Get Started',
    'Examples',
    {
      name: 'References',
      menu: ['Route Schema', 'Lifecycle Hooks'],
    },
  ],
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
