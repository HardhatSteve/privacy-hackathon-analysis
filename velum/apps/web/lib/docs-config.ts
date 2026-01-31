export interface NavItem {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const docsConfig: { nav: NavGroup[] } = {
  nav: [
    {
      title: "Getting Started",
      items: [
        { title: "Overview", href: "/docs" },
        { title: "How It Works", href: "/docs/how-it-works" },
        { title: "FAQ", href: "/docs/faq" },
      ],
    },
    {
      title: "Guides",
      items: [
        { title: "Receive Payments", href: "/docs/receive" },
        { title: "Pay", href: "/docs/pay" },
        { title: "Withdraw", href: "/docs/withdraw" },
      ],
    },
    {
      title: "Privacy & Technology",
      items: [
        { title: "Privacy Model", href: "/docs/privacy-model" },
        { title: "Cryptography", href: "/docs/cryptography" },
        { title: "UTXO System", href: "/docs/utxo-system" },
        { title: "Zero-Knowledge Proofs", href: "/docs/zero-knowledge" },
        { title: "SDK Modifications", href: "/docs/sdk-modifications" },
        { title: "Developer Guide", href: "/docs/developer-guide" },
        { title: "API Reference", href: "/docs/api" },
      ],
    },
  ],
};
