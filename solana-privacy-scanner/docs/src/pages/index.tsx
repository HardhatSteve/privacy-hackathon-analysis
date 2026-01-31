import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import PrivacyScanner from '@site/src/components/PrivacyScanner';
import styles from './index.module.css';

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroMain}>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Open Source</span>
            <span className={styles.badge}>Zero Config</span>
            <span className={styles.badgeHighlight}>Powered by QuickNode</span>
          </div>
          <h1 className={styles.heroTitle}>
            Solana Privacy Scanner
          </h1>
          <p className={styles.heroSubtitle}>
            Detect privacy leaks in wallets, transactions, and programs with 13 Solana-native heuristics.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} to="/docs/sps/what-is-this">
              Get Started
            </Link>
            <Link className={styles.secondaryButton} to="https://github.com/taylorferran/solana-privacy-scanner">
              GitHub
            </Link>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>13</span>
            <span className={styles.statLabel}>Heuristics</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>78+</span>
            <span className={styles.statLabel}>Known Entities</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>3</span>
            <span className={styles.statLabel}>Scan Modes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type ProductCard = {
  title: string;
  description: string;
  link: string;
  tag: string;
};

const products: ProductCard[] = [
  {
    title: 'Core',
    tag: 'Library',
    description: 'Programmatic API for on-chain scanning, static analysis, transaction simulation, and testing.',
    link: '/docs/core/usage',
  },
  {
    title: 'Toolkit',
    tag: 'Command Line',
    description: 'CLI for scanning wallets/transactions/programs and analyzing source code. Zero configuration.',
    link: '/docs/toolkit/overview',
  },
  {
    title: 'Claude Plugin',
    tag: 'AI Assistant',
    description: 'Privacy analysis directly in Claude Code. Real-time recommendations during development.',
    link: '/docs/claude-plugin/overview',
  },
];

function ProductCard({title, description, link, tag}: ProductCard) {
  return (
    <Link to={link} className={styles.productCard}>
      <div className={styles.productTag}>{tag}</div>
      <h3 className={styles.productTitle}>{title}</h3>
      <p className={styles.productDescription}>{description}</p>
      <div className={styles.productArrow}>→</div>
    </Link>
  );
}

function ProductsSection() {
  return (
    <section className={styles.products}>
      <div className={styles.productsContainer}>
        <h2 className={styles.productsTitle}>Three ways to scan</h2>
        <div className={styles.productsGrid}>
          {products.map((props, idx) => (
            <ProductCard key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScannerSection() {
  return (
    <section className={styles.scanner}>
      <div className={styles.scannerContainer}>
        <div className={styles.scannerHeader}>
          <h2 className={styles.scannerTitle}>Try the scanner</h2>
          <p className={styles.scannerSubtitle}>Enter any Solana wallet address for instant privacy analysis</p>
        </div>
        <PrivacyScanner />
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}
      noFooter={false}
      wrapperClassName="homepage-wrapper">
      <div className={styles.homeContainer}>
        <HeroSection />
        <ProductsSection />
        <ScannerSection />
      </div>
    </Layout>
  );
}
