export default {
  logo: <span style={{ fontWeight: 600 }}>Veil</span>,
  project: {
    link: 'https://github.com/PascalThePundit/Veil-SDK'
  },
  docsRepositoryBase: 'https://github.com/PascalThePundit/Veil-SDK/blob/main/packages/docs-site',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Veil'
    }
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} © Veil Labs. Built for privacy.
      </span>
    )
  },
  primaryHue: { light: 0, dark: 0 },
  primarySaturation: { light: 0, dark: 0 }, // Monochrome for a calm, technical look
  feedback: {
    content: null // Remove "Question? Give us feedback" link for minimalism
  },
  editLink: {
    text: 'Edit this page on GitHub'
  },
  navigation: {
    prev: true,
    next: true
  }
}