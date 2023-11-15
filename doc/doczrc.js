module.exports = {
  title: '🥱 Boring Router',
  base: '/boring-router/',
  files: '**/*.{md,mdx}',
  menu: [
    'Introduction',
    'Get Started',
    'Examples',
    {
      name: 'References',
      menu: [
        'Route Schema',
        'Parallel Routes',
        'Route Builder',
        'Ref & HRef',
        'Lifecycle Hooks',
        'Service',
      ],
    },
    {
      name: '中文文档',
      route: 'https://www.yuque.com/makeflow/boring-router/introduction',
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
