import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  spsSidebar: [
    {
      type: 'category',
      label: 'SPS',
      items: [
        'sps/what-is-this',
        'sps/concepts',
        'sps/quicknode',
      ],
    },
    {
      type: 'category',
      label: 'Understanding Reports',
      items: [
        'reports/risk-levels',
        'reports/heuristics',
        'reports/heuristic-internals',
        'reports/known-entities',
        'reports/narrative',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/custom-heuristics',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/addresses',
        'contributing/development',
      ],
    },
  ],

  coreSidebar: [
    'core/usage',
    'core/api-reference',
    'core/for-llms',
  ],

  toolkitSidebar: [
    'toolkit/overview',
    'toolkit/commands',
    'toolkit/init',
    'toolkit/for-llms',
  ],

  claudePluginSidebar: [
    'claude-plugin/overview',
    'claude-plugin/skills',
  ],
};

export default sidebars;
