import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Solana Privacy Scanner',
  tagline: 'Analyze Solana wallets, transactions, and programs for privacy risks. Get transparent risk assessments and actionable guidance.',
  favicon: 'img/detective-logo.svg',

  // Future flags
  future: {
    v4: true,
  },

  url: 'https://sps.guide',
  baseUrl: '/',

  organizationName: 'taylorferran',
  projectName: 'solana-privacy-scanner',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    // Fonts
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/taylorferran/solana-privacy-scanner/edit/main/docs-new/',
          showLastUpdateTime: true,
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    './plugins/webpack-config.js',
  ],

  themeConfig: {
    image: 'img/og-image.png',
    metadata: [
      // Primary Meta Tags
      {name: 'title', content: 'Solana Privacy Scanner - Analyze On-Chain Privacy Risks'},
      {name: 'description', content: 'Free tool to scan Solana wallets, transactions, and programs for privacy risks. Get transparent risk assessments with actionable guidance. Open source and privacy-focused.'},
      {name: 'keywords', content: 'solana, privacy, blockchain, scanner, cryptocurrency, on-chain analysis, wallet privacy, transaction privacy, solana privacy, blockchain privacy, crypto privacy'},
      {name: 'author', content: 'Solana Privacy Scanner'},
      {name: 'theme-color', content: '#0d9488'},
      
      // Open Graph / Facebook
      {property: 'og:type', content: 'website'},
      {property: 'og:url', content: 'https://sps.guide/'},
      {property: 'og:title', content: 'Solana Privacy Scanner - Analyze On-Chain Privacy Risks'},
      {property: 'og:description', content: 'Free tool to scan Solana wallets, transactions, and programs for privacy risks. Get transparent risk assessments with actionable guidance.'},
      {property: 'og:image', content: 'https://sps.guide/img/og-image.png'},
      {property: 'og:image:width', content: '1200'},
      {property: 'og:image:height', content: '630'},
      {property: 'og:site_name', content: 'Solana Privacy Scanner'},
      {property: 'og:locale', content: 'en_US'},
      
      // Twitter Card
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:url', content: 'https://sps.guide/'},
      {name: 'twitter:title', content: 'Solana Privacy Scanner - Analyze On-Chain Privacy Risks'},
      {name: 'twitter:description', content: 'Free tool to scan Solana wallets, transactions, and programs for privacy risks. Get transparent risk assessments with actionable guidance.'},
      {name: 'twitter:image', content: 'https://sps.guide/img/twitter-image.png'},
      {name: 'twitter:creator', content: '@solana'},
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Solana Privacy Scanner',
      logo: {
        alt: 'Solana Privacy Scanner',
        src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🕵🏻‍♂️</text></svg>',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'spsSidebar',
          position: 'left',
          label: 'SPS',
        },
        {
          type: 'docSidebar',
          sidebarId: 'coreSidebar',
          position: 'left',
          label: 'Core',
        },
        {
          type: 'docSidebar',
          sidebarId: 'toolkitSidebar',
          position: 'left',
          label: 'Toolkit',
        },
        {
          type: 'docSidebar',
          sidebarId: 'claudePluginSidebar',
          position: 'left',
          label: 'Claude Plugin',
        },
        {
          href: 'https://github.com/taylorferran/solana-privacy-scanner',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Packages',
          items: [
            {
              label: 'Core (npm)',
              href: 'https://www.npmjs.com/package/solana-privacy-scanner-core',
            },
            {
              label: 'Toolkit (npm)',
              href: 'https://www.npmjs.com/package/solana-privacy-scanner',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/taylorferran/solana-privacy-scanner',
            },
            {
              label: 'Issues',
              href: 'https://github.com/taylorferran/solana-privacy-scanner/issues',
            },
          ],
        },
        {
          title: 'Powered By',
          items: [
            {
              label: 'QuickNode',
              href: 'https://www.quicknode.com/',
            },
            {
              label: 'Vercel',
              href: 'https://vercel.com',
            },
          ],
        },
      ],
      copyright: 'Built for privacy awareness. Not surveillance. | MIT Licensed | Made for the Solana ecosystem',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,

  headTags: [
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Solana Privacy Scanner',
        url: 'https://sps.guide',
        description: 'Free tool to scan Solana wallets, transactions, and programs for privacy risks',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        creator: {
          '@type': 'Organization',
          name: 'Solana Privacy Scanner',
          url: 'https://sps.guide'
        }
      }),
    },
  ],
};

export default config;
