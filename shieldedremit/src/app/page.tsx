"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  Send,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const features = [
  {
    icon: Shield,
    title: "Privacy by Default",
    description:
      "Every transaction is protected with state-of-the-art privacy technology. Choose your level of anonymity.",
  },
  {
    icon: Zap,
    title: "Instant Settlements",
    description:
      "Powered by Solana's high-speed blockchain. Transactions settle in seconds, not days.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Send money anywhere in the world. No borders, no limits, no intermediaries.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security with optional compliance features. Your funds, your control.",
  },
];

const stats = [
  { value: "<$0.01", label: "Average Fee" },
  { value: "~5s", label: "Transfer Time" },
  { value: "100+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

export default function HomePage() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Privacy-Preserving Remittances
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Send Money Across Borders{" "}
              <span className="bg-gradient-solana bg-clip-text text-transparent">
                Privately
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              ShieldedRemit combines the speed of Solana with advanced privacy
              technology. Transfer funds instantly with fees under $0.01 while
              keeping your transactions private.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {connected ? (
                <Link href="/send">
                  <Button size="xl" variant="gradient">
                    <Send className="mr-2 h-5 w-5" />
                    Send Money Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <WalletMultiButton className="!bg-gradient-solana !text-white hover:!opacity-90 !rounded-xl !h-14 !px-10 !text-base !shadow-lg !shadow-primary/25" />
              )}
              <Link href="/docs">
                <Button size="xl" variant="outline">
                  Learn More
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose ShieldedRemit?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine the best of blockchain technology with privacy-first
              design to give you the ultimate remittance experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Privacy Levels Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Privacy Level
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From transparent to fully anonymous, you control how private your
              transactions are.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                level: "Standard",
                description: "Fast and cheap transfers with full transparency",
                features: [
                  "Lowest fees",
                  "Fastest transfers",
                  "Full on-chain visibility",
                ],
                fee: "~$0.001",
              },
              {
                level: "Medium Privacy",
                description: "Hide your transaction amounts from observers",
                features: [
                  "Hidden amounts",
                  "Zero-knowledge proofs",
                  "Moderate fees",
                ],
                fee: "~$0.01",
                recommended: true,
              },
              {
                level: "Full Anonymity",
                description: "Complete transaction obfuscation",
                features: [
                  "Hidden amounts",
                  "Anonymous sender/recipient",
                  "Multi-hop routing",
                ],
                fee: "~0.5%",
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card
                  className={`h-full ${
                    plan.recommended
                      ? "border-primary shadow-lg shadow-primary/10"
                      : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    {plan.recommended && (
                      <div className="text-xs font-semibold text-primary mb-2">
                        RECOMMENDED
                      </div>
                    )}
                    <h3 className="font-semibold text-xl mb-2">{plan.level}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <div className="text-2xl font-bold text-primary mb-4">
                      {plan.fee}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        fee
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Send Money Privately?
            </h2>
            <p className="text-muted-foreground mb-8">
              Connect your wallet and start sending money across borders in
              seconds. No KYC required for small amounts.
            </p>
            {connected ? (
              <Link href="/send">
                <Button size="xl" variant="gradient">
                  <Send className="mr-2 h-5 w-5" />
                  Start Sending
                </Button>
              </Link>
            ) : (
              <WalletMultiButton className="!bg-gradient-solana !text-white hover:!opacity-90 !rounded-xl !h-14 !px-10 !text-base !shadow-lg !shadow-primary/25" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
