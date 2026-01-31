import Link from 'next/link';
import { Shield, Github, Twitter } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Analyze', href: '/analyze' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Pricing', href: '/pricing' },
  ],
  developers: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'CLI Guide', href: '/docs/cli' },
    { name: 'GitHub', href: 'https://github.com/privacylens' },
  ],
  resources: [
    { name: 'Best Practices', href: '/docs/best-practices' },
    { name: 'Vulnerability Database', href: '/docs/vulnerabilities' },
    { name: 'Blog', href: '/blog' },
    { name: 'Changelog', href: '/changelog' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">PrivacyLens</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Privacy analysis and scoring for Solana programs. Lighthouse for Privacy.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com/privacylens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com/privacylens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Developers</h3>
            <ul className="space-y-2">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PrivacyLens. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
