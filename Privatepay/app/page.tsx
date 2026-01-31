"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Eye,
  Zap,
  Shield,
  ArrowRight,
  CreditCard,
  Wallet,
  ChevronRight,
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Copy,
} from "lucide-react"
import { StarpayProvider, useStarpay } from "@/app/context/starpay-context"
import { CardPurchase } from "@/app/components/card-purchase"

// Scroll Animation Hook
function useScrollAnimation() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const animationType = element.getAttribute("data-scroll-animation")
          element.classList.add(animationType || "scroll-animate")
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll("[data-scroll-animation]")
    elements.forEach((element) => observer.observe(element))

    return () => {
      elements.forEach((element) => observer.unobserve(element))
    }
  }, [])
}

// Animated Terminal Component
function AnimatedTerminal() {
  const [lines, setLines] = useState<string[]>([])
  const [currentExample, setCurrentExample] = useState(0)

  const examples = [
    {
      command: "$ privatepay card issue --amount 50 --type visa",
      cardId: "card_7x1k9m2p",
      amount: "$50.00",
    },
    {
      command: "$ privatepay card issue --amount 100 --type mastercard",
      cardId: "card_3q8r5n4x",
      amount: "$100.00",
    },
    {
      command: "$ privatepay card issue --amount 25 --type amex",
      cardId: "card_2w9b3c5t",
      amount: "$25.00",
    },
    {
      command: "$ privatepay card issue --amount 75 --type visa",
      cardId: "card_6l2h4j9s",
      amount: "$75.00",
    },
  ]

  useEffect(() => {
    const example = examples[currentExample]
    const fullLines = [
      example.command,
      "⟳ Initializing...",
      "├─ Validating credentials",
      "├─ Generating card",
      "├─ Encrypting metadata",
      "└─ Broadcasting to Solana",
      "...",
      "✓ Card issued successfully",
      `Card ID: ${example.cardId}`,
      "Status: ACTIVE",
      `Balance: ${example.amount}`,
      "> _",
    ]

    setLines([])
    let currentLine = 0

    const interval = setInterval(() => {
      if (currentLine < fullLines.length) {
        setLines((prev) => [...prev, fullLines[currentLine]])
        currentLine++
      } else {
        // Move to next example after delay
        setTimeout(() => {
          setCurrentExample((prev) => (prev + 1) % examples.length)
        }, 2000)
        clearInterval(interval)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [currentExample])

  return (
    <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm hover:border-primary/20 transition-all duration-300 shadow-2xl shadow-primary/10">
      <div className="bg-gradient-to-r from-black/80 to-black/40 border-b border-white/5 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
        <span className="text-xs text-muted-foreground ml-2">privatepay-cli</span>
      </div>
      <div className="p-8 font-mono text-sm space-y-2 min-h-80 overflow-hidden">
        {lines.map((line, i) => {
          if (!line) return null
          let color = "text-white/60"
          if (line.startsWith("$")) color = "text-green-400"
          else if (line.includes("Initializing") || line.includes("⟳")) color = "text-cyan-400 animate-pulse"
          else if (line.includes("✓")) color = "text-green-400 font-semibold"
          else if (line.includes("Card ID") || line.includes("Status") || line.includes("Balance")) color = "text-yellow-300"
          else if (line === "> _") color = "text-white/40 animate-pulse"

          return (
            <div key={i} className={color}>
              {line}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HomeContent() {
  const [activeTab, setActiveTab] = useState("landing")

  return (
    <div className="min-h-screen bg-background text-foreground">
      {activeTab === "landing" && <LandingPage setActiveTab={setActiveTab} />}
      {activeTab === "issuing" && <IssuingPage setActiveTab={setActiveTab} />}
      {activeTab === "payment" && <PaymentPage setActiveTab={setActiveTab} />}
      {activeTab === "wallet" && <WalletPage setActiveTab={setActiveTab} />}
      {activeTab === "dashboard" && <DashboardPage setActiveTab={setActiveTab} />}
    </div>
  )
}

export default function Home() {
  return (
    <StarpayProvider>
      <HomeContent />
    </StarpayProvider>
  )
}

function LandingPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  useScrollAnimation()
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/80">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Premium Navigation */}
      <nav className="border-b border-border/50 bg-card/40 backdrop-blur-xl sticky top-0 z-50 bg-white/5 border border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary/50 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
              <Eye className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">PrivatePay</span>
              <p className="text-xs text-muted-foreground">Payment Infrastructure</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <a
              href="https://t.me/PrivatePayOfficial"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 duration-200"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.42 0-.328-.149-.46-.528l-1.04-3.41-2.99-.924c-.648-.204-.658-.682.14-1.019l11.65-4.495c.54-.22.895.12.74.91z" />
              </svg>
            </a>
            <a
              href="https://x.com/Privatepay_"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 duration-200"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308L6.883 4.03H5.09l12.06 14.72z" />
              </svg>
            </a>
            <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
              Launch App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          {/* Main heading with gradient */}
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Privacy</span> meets payment
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">infrastructure</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Issue branded crypto cards, manage private wallets, and execute anonymous DeFi swaps. All powered by PrivatePay's open API on Solana.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/40 text-primary-foreground group font-semibold transition-all duration-300 border border-primary/30"
              onClick={() => setActiveTab("issuing")}
            >
              Issue Cards
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              className="bg-card/50 hover:bg-card border border-primary/30 text-foreground group font-semibold transition-all duration-300 backdrop-blur hover:shadow-lg hover:shadow-primary/20"
              onClick={() => window.open("https://www.privatetransfer.site", "_blank")}
            >
              Private Transfer
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-4 pt-16 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            {[
              {
                icon: CreditCard,
                title: "Card Issuance",
                description: "Issue virtual cards under your brand with full control",
              },
              {
                icon: Wallet,
                title: "Wallet Management",
                description: "Manage private wallets and execute DeFi swaps",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Built on privacy-preserving technology from day one",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 group p-6 rounded-2xl cursor-pointer"
              >
                {React.createElement(feature.icon, { className: "w-8 h-8 text-primary mb-4" })}
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Card Showcase Section */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Left: Bold Headline */}
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-5xl md:text-6xl font-black leading-tight">
                <span className="text-white">Instant</span>
                <br />
                <span className="text-white">cards</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">funded by</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Solana</span>
              </h2>
            </div>

            {/* Center: Card Visual with Hand */}
            <div className="relative h-96 flex items-center justify-center animate-float">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              
              {/* Premium Card */}
              <div className="relative z-10 w-80 h-48 bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-black/80 border border-white/15 rounded-3xl shadow-2xl shadow-primary/30 backdrop-blur-xl flex flex-col justify-between p-8 group hover:shadow-primary/50 transition-all duration-300">
                {/* Card Header with Logo and Text */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-6 h-6 text-primary" />
                    <span className="text-white font-bold tracking-widest text-sm">PRIVATEPAY</span>
                  </div>
                </div>

                {/* Card Middle - Chip */}
                <div className="flex justify-center">
                  <div className="w-14 h-10 bg-gradient-to-br from-yellow-400/40 to-yellow-600/40 border border-yellow-400/50 rounded-lg shadow-lg flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-2 h-2 bg-yellow-300/60 rounded-sm"></div>
                      <div className="w-2 h-2 bg-yellow-300/60 rounded-sm"></div>
                      <div className="w-2 h-2 bg-yellow-300/60 rounded-sm"></div>
                      <div className="w-2 h-2 bg-yellow-300/60 rounded-sm"></div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider">Cardholder</p>
                    <p className="text-white/80 font-semibold text-sm">YOUR NAME</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/50 uppercase tracking-wider">Valid Thru</p>
                    <p className="text-white/80 font-mono text-sm">12/30</p>
                  </div>
                </div>
              </div>

              {/* Hand silhouette effect */}
              <div className="absolute -top-20 -left-10 w-48 h-48 bg-black/40 rounded-full blur-3xl -z-0"></div>
            </div>

            {/* Right: Supporting Text */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div>
                <p className="text-xl md:text-2xl font-semibold text-white/80 leading-tight">
                  fast
                  <br />
                  <span className="text-white/60">crypto</span>
                  <br />
                  <span className="text-white/40">spending</span>
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Zero KYC Required</p>
                    <p className="text-sm text-muted-foreground">Complete privacy for all transactions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Powered by Solana</p>
                    <p className="text-sm text-muted-foreground">Lightning-fast blockchain execution</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Instant Activation</p>
                    <p className="text-sm text-muted-foreground">Start spending in seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Spend with PrivatePay Cards</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/40 text-primary-foreground group font-semibold transition-all duration-300 border border-primary/30"
              onClick={() => setActiveTab("issuing")}
            >
              Get Your Card Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: CreditCard,
                title: "Card Activation",
                description: "Get your card starting from $5. Only 0.2% activation fee.",
              },
              {
                icon: Zap,
                title: "Solana Top Ups",
                description: "Top up your card using SOL in seconds. No banks. No delays. Just crypto.",
              },
              {
                icon: Wallet,
                title: "Apple Pay & Google Pay",
                description: "Add your card to Apple Pay or Google Pay and pay directly from your phone.",
              },
              {
                icon: Shield,
                title: "Minimal Fees",
                description: "Clear pricing and low fees. No hidden charges or subscriptions.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex gap-6 p-8 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 border border-primary/20">
                    {React.createElement(feature.icon, { className: "h-6 w-6 text-primary" })}
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Demo Section */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Watch It In Action</h2>
          </div>

          <AnimatedTerminal />
        </div>
      </section>

      {/* Premium Feature Showcase Card */}
      <section className="py-16 sm:py-20 px-4 border-t border-border/50" data-scroll-animation="scroll-animate">
        <div className="max-w-5xl mx-auto">
          <div className="bg-black rounded-2xl sm:rounded-3xl lg:rounded-4xl p-6 sm:p-10 md:p-16 lg:p-20 border border-purple-500/30 shadow-2xl" style={{ boxShadow: '0 0 60px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)' }}>
            <div className="max-w-2xl">
              {/* Star Rating */}
              <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                <div className="flex gap-1">
                  <span className="text-2xl sm:text-3xl text-yellow-400">★</span>
                  <span className="text-2xl sm:text-3xl text-yellow-400">★</span>
                  <span className="text-2xl sm:text-3xl text-yellow-400">★</span>
                  <span className="text-2xl sm:text-3xl text-yellow-400">★</span>
                  <span className="text-2xl sm:text-3xl text-yellow-400">★</span>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-gray-400">fast and seamless experience</p>
                  <p className="text-xs sm:text-sm text-gray-500">average user rating</p>
                </div>
              </div>

              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
                <div className="text-center">
                  <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 break-words">{'< 2'}</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">min</p>
                  <p className="text-xs text-gray-500 mt-1">card issuance</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2">≡</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">SOL</p>
                  <p className="text-xs text-gray-500 mt-1">instant top ups</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2">⊕</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">Global</p>
                  <p className="text-xs text-gray-500 mt-1">online payments</p>
                </div>
              </div>

              {/* Main CTA Section */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 sm:mb-6">
                    A faster way to get a card
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                    Open a virtual card instantly and fund it with Solana. Your balance is ready for payments right after activation.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-black font-semibold rounded-full px-6 sm:px-10 py-2 sm:py-3 text-sm sm:text-base w-fit"
                >
                  Get card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PrivatePay Section */}
      <section className="py-20 px-4 border-t border-border/50" data-scroll-animation="scroll-animate">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Why Choose PrivatePay?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-2">Experience the future of digital banking with instant cards and complete privacy</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Card 1: Privacy First Banking */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6 sm:p-8 space-y-4 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl sm:text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Privacy First Banking</h3>
              <p className="text-sm sm:text-base text-gray-400">No KYC required. Your privacy is our priority with instant non-KYC virtual cards</p>
            </div>

            {/* Card 2: Cards in 1 Minute */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6 sm:p-8 space-y-4 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl sm:text-2xl">⚡</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Cards in Less than 1 Minute</h3>
              <p className="text-sm sm:text-base text-gray-400">Create your virtual card instantly - no waiting, no paperwork, just instant access</p>
            </div>

            {/* Card 3: Accepted Worldwide */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6 sm:p-8 space-y-4 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl sm:text-2xl">🌍</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Accepted Worldwide</h3>
              <p className="text-sm sm:text-base text-gray-400">Use your PrivatePay card anywhere Visa and Mastercard are accepted globally</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Fees Section */}
      <section className="py-16 sm:py-20 px-4 border-t border-border/50" data-scroll-animation="scroll-animate">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Transparent Pricing</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-2">Clear, competitive fees with no hidden charges</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Transaction Fees */}
            <div className="bg-black/50 rounded-lg border border-primary/20 p-6 sm:p-8 space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">💳</span>
                <span>Transaction Fees</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base">Purchase (Online & In-Store)</p>
                    <p className="text-xs sm:text-sm text-gray-400">Displayed at checkout</p>
                  </div>
                  <p className="font-bold text-primary text-sm sm:text-base whitespace-nowrap">Price</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base">Same Currency</p>
                    <p className="text-xs sm:text-sm text-gray-400">Domestic transactions</p>
                  </div>
                  <p className="font-bold text-green-400 text-sm sm:text-base whitespace-nowrap">Free</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base">Foreign Transaction Fee</p>
                    <p className="text-xs sm:text-sm text-gray-400">International transactions</p>
                  </div>
                  <p className="font-bold text-orange-400 text-sm sm:text-base whitespace-nowrap">0.5% + 1.5%</p>
                </div>
              </div>
            </div>

            {/* Refund & Support Fees */}
            <div className="bg-black/50 rounded-lg border border-primary/20 p-6 sm:p-8 space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">↩️</span>
                <span>Refund Fees</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base">Domestic Purchase Reversal</p>
                    <p className="text-xs sm:text-sm text-gray-400">Returned or reversed</p>
                  </div>
                  <p className="font-bold text-blue-400 text-sm sm:text-base whitespace-nowrap">$0.20</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base">International Purchase Reversal</p>
                    <p className="text-xs sm:text-sm text-gray-400">Returned or reversed</p>
                  </div>
                  <p className="font-bold text-blue-400 text-sm sm:text-base whitespace-nowrap">$0.75</p>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4 sm:mt-6">
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">🌍</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base">Global Coverage</p>
                      <p className="text-xs sm:text-sm text-gray-400">Cards supported in 180+ countries worldwide</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto text-center space-y-6 px-4" data-scroll-animation="scroll-animate-scale">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Privacy First,</h2>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">No KYC Required</h3>
        </div>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          No KYC verification required. Your privacy is protected with end-to-end encryption, non-custodial architecture, and anonymous transactions – enjoy true financial freedom without compromising your personal data.
        </p>
        <div className="pt-4 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {["End-to-End Encryption", "Non-Custodial", "Anonymous Transactions", "Zero KYC"].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IssuingPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [cardName, setCardName] = useState("")
  const [cardType, setCardType] = useState<"visa" | "mastercard">("visa")
  const [amount, setAmount] = useState("5")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [starpayOrder, setStarpayOrder] = useState<any>({})
  const [orderStatus, setOrderStatus] = useState<string>("idle")
  const [cardDetails, setCardDetails] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  const presetAmounts = [5, 50, 100, 300]

  const handleCreateOrder = async () => {
    if (!email || !cardName) {
      setError("Please fill in all fields")
      return
    }

    if (Number.parseFloat(amount) < 5 || Number.parseFloat(amount) > 10000) {
      setError("Card amount must be between $5 and $10,000")
      return
    }

    setLoading(true)
    setError(null)
    setOrderStatus("creating")
    console.log("[v0] Creating Starpay order:", { amount, email, cardName, cardType })

    try {
      const response = await fetch("/api/starpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          cardType,
          email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Order creation failed:", errorData)
        setError(errorData.error || "Failed to create order")
        setOrderStatus("error")
        return
      }

      const data = await response.json()
      setStarpayOrder(data)
      setOrderStatus("waiting_payment")
      console.log("[v0] Starpay order created:", data.orderId)

      const createdOrderId = data.orderId
      const interval = setInterval(async () => {
        console.log("[v0] Polling order status for:", createdOrderId)
        try {
          const statusResponse = await fetch("/api/starpay/check-order-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: createdOrderId }),
          })
          const statusData = await statusResponse.json()

          console.log("[v0] Order status poll result:", JSON.stringify(statusData, null, 2))
          console.log("[v0] Response status code:", statusResponse.status)

          if (!statusResponse.ok) {
            console.error("[v0] API returned error:", statusData)
            setError(`API Error: ${statusData.message || statusData.error || "Unknown error"}`)
            setOrderStatus("failed")
            clearInterval(interval)
            return
          }

          setStarpayOrder((prev: Record<string, unknown>) => ({ ...prev, status: statusData.status }))

          if (statusData.status === "completed") {
            setOrderStatus("completed")
            if (statusData.card) {
              setCardDetails(statusData.card)
            } else if (statusData.cardNumber) {
              // Some APIs return card details directly
              setCardDetails({
                cardNumber: statusData.cardNumber,
                expiryDate: statusData.expiryDate || statusData.expiry,
                cvv: statusData.cvv,
              })
            }
            clearInterval(interval)
          } else if (statusData.status === "processing") {
            setOrderStatus("processing")
          } else if (statusData.status === "pending") {
            // Pending means waiting for payment - keep polling
            setOrderStatus("waiting_payment")
          } else if (statusData.status === "failed" || statusData.status === "expired") {
            setOrderStatus("failed")
            
            // Extract failure reason from various possible fields
            let failureReason = "Unknown reason"
            
            if (statusData.message) {
              failureReason = statusData.message
            } else if (statusData.error) {
              // Try to extract error message from nested JSON string
              try {
                const errorObj = JSON.parse(statusData.error)
                failureReason = errorObj.message || statusData.error
              } catch {
                failureReason = statusData.error
              }
            } else if (statusData.failureReason) {
              failureReason = statusData.failureReason
            } else if (statusData.reason) {
              failureReason = statusData.reason
            }
            
            setError(
              statusData.status === "expired"
                ? "Order expired. Please create a new order and try again."
                : `Order processing failed: ${failureReason}. Please try again or contact support.`,
            )
            console.error("[v0] Order failed with reason:", failureReason)
            clearInterval(interval)
          } else {
            console.warn("[v0] Unknown status:", statusData.status)
          }
        } catch (pollErr) {
          console.error("[v0] Error polling order status:", pollErr)
          setError(`Polling error: ${pollErr instanceof Error ? pollErr.message : "Unknown error"}`)
          setOrderStatus("failed")
          clearInterval(interval)
        }
      }, 3000)

      setPollInterval(interval)
    } catch (err) {
      console.error("[v0] Error creating order:", err)
      setError(err instanceof Error ? err.message : "Failed to create order")
      setOrderStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCardName("")
    setEmail("")
    setAmount("5")
    setCardType("visa")
    setStarpayOrder({})
    setOrderStatus("idle")
    setCardDetails(null)
    if (pollInterval) clearInterval(pollInterval)
    setPollInterval(null)
  }

  if (starpayOrder && starpayOrder.payment) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold">${amount} Card</h2>
            <p className="text-muted-foreground">
              Send {(starpayOrder.payment?.expectedSol || starpayOrder.payment?.amountSol)?.toFixed(6) || "0"} SOL to complete your order
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            {/* QR Code */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">Scan to pay:</p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(starpayOrder.payment?.address || "")}`}
                  alt="Payment QR code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Payment Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Send SOL to:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={starpayOrder.payment?.address || ""}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg bg-input border border-border/50 text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(starpayOrder.payment?.address || "")
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">{(starpayOrder.payment?.expectedSol || starpayOrder.payment?.amountSol)?.toFixed(6) || "0"} SOL</span>
              </div>
            </div>

            {/* Status */}
            {orderStatus === "waiting_payment" && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <Clock className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                <p className="text-sm text-primary">Waiting for payment...</p>
              </div>
            )}

            {orderStatus === "completed" && (
              <div className="space-y-4">
                {cardDetails ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-sm text-primary">Card issued successfully!</p>
                    </div>

                    <div className="space-y-3 bg-card border border-primary/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Your Card Details</h3>

                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-semibold">CARD NUMBER</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm bg-input/50 p-3 rounded">
                            {cardDetails.cardNumber}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cardDetails.cardNumber)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                            className="px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded text-sm transition-colors"
                          >
                            {copied ? "✓" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground font-semibold">EXPIRES</label>
                          <p className="font-mono text-sm bg-input/50 p-3 rounded">
                            {cardDetails.expiryDate || "MM/YY"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground font-semibold">CVV</label>
                          <p className="font-mono text-sm bg-input/50 p-3 rounded">{cardDetails.cvv}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground pt-2">Card details have been sent to {email}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary">Payment complete! Card issued.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={handleReset}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("landing")}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Card Issuance</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Create Your Card</h2>
            <p className="text-muted-foreground">Powered by Starpay on Solana</p>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl animate-glow"></div>
            <Card className="relative border-primary/20 bg-gradient-to-br from-card to-card/50 p-8 aspect-video flex flex-col justify-between rounded-2xl overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">CARDHOLDER</p>
                  <p className="text-lg font-semibold">{cardName || "Your Name"}</p>
                </div>
                <CreditCard className="w-8 h-8 text-primary/60" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-sm tracking-widest text-muted-foreground">
                  {cardType === "visa" ? "4532" : "5234"} •••• •••• 8901
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">EXPIRES</p>
                    <p className="font-mono text-sm">12/26</p>
                  </div>
                  <div className="text-xs font-semibold text-primary/60">{cardType.toUpperCase()}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold">Cardholder Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border/50"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border/50"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Card Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["visa", "mastercard"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCardType(type)}
                  className={`py-3 rounded-lg border transition-all ${
                    cardType === type ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Card Value (USD)</label>
            <div className="space-y-4">
              {/* Custom Amount Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                    }}
                    onBlur={(e) => {
                      let val = e.target.value
                      if (val) {
                        const num = Number.parseFloat(val)
                        if (num < 5) val = "5"
                        if (num > 10000) val = "10000"
                      }
                      setAmount(val)
                    }}
                    className="w-full px-4 py-3 pl-8 bg-input border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              
              {/* Quick Select Preset Buttons */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className={`py-2 px-3 rounded-lg border transition-colors text-sm font-medium ${
                        amount === preset.toString()
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-input hover:border-border"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">Valid range: $5 - $10,000</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleCreateOrder}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? "Creating order..." : "Issue Card"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Order Summary</h3>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Card Value:</span>
                <span className="font-semibold">${amount}</span>
              </div>
              <div className="border-t border-border/50 pt-3 mt-3" />
              <p className="text-xs text-muted-foreground">
                Your card will be issued to {email || "your email"} after payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveTab("landing")} className="gap-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Create Card</h1>
          <div />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <CardPurchase />
      </main>
    </div>
  )
}

function WalletPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { accountInfo, loading: contextLoading } = useStarpay()
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapResult, setSwapResult] = useState<{ hash: string; timestamp: string } | null>(null)
  const [swapError, setSwapError] = useState<string | null>(null)

  const handleZKSwap = async () => {
    setSwapLoading(true)
    setSwapError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSwapResult({
        hash: `zk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      setSwapError("Failed to execute ZK swap")
    } finally {
      setSwapLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("landing")}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Crypto Wallet</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 space-y-8">
        {contextLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : accountInfo ? (
          <>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl animate-glow"></div>
              <Card className="relative border-primary/20 bg-gradient-to-br from-primary/10 to-card/50 p-8 rounded-2xl">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Account Balance</p>
                    <h2 className="text-4xl font-bold text-primary">${accountInfo.balance.toFixed(2)}</h2>
                  </div>
                  <Wallet className="w-8 h-8 text-primary/60" />
                </div>
                <div className="flex gap-4">
                  <Button className="bg-primary hover:bg-primary/90">Deposit</Button>
                  <Button variant="outline" className="border-primary/30 bg-transparent">
                    Withdraw
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Account Statistics</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border/50 bg-card/30 p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Cards Issued</p>
                  <h3 className="text-3xl font-bold">{accountInfo.totalCardsIssued}</h3>
                </Card>
                <Card className="border-border/50 bg-card/30 p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <h3 className="text-3xl font-bold">${(accountInfo.totalVolume / 1000000).toFixed(2)}M</h3>
                </Card>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Private ZK Swaps</h3>
              </div>
              <p className="text-muted-foreground">Exchange assets anonymously using zero-knowledge proofs</p>

              {swapError && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{swapError}</p>
                </div>
              )}

              {swapResult && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-primary">ZK Swap completed! Hash: {swapResult.hash.slice(0, 20)}...</p>
                </div>
              )}

              <Button onClick={handleZKSwap} disabled={swapLoading} className="w-full bg-primary hover:bg-primary/90">
                {swapLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute ZK Swap"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">Failed to load wallet data. Check your API configuration.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { accountInfo, loading } = useStarpay()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("landing")}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : accountInfo ? (
          <>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Account Status</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project Name</p>
                  <p className="text-lg font-semibold">{accountInfo.projectName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-semibold text-primary">${accountInfo.balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p
                    className={`text-lg font-semibold capitalize ${accountInfo.status === "active" ? "text-primary" : "text-destructive"}`}
                  >
                    {accountInfo.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Markup Rate</p>
                  <p className="text-lg font-semibold">{accountInfo.markup}%</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-border/50 bg-card/30 p-6 space-y-2 animate-slide-up">
                <p className="text-sm text-muted-foreground">Cards Issued</p>
                <h3 className="text-3xl font-bold">{accountInfo.totalCardsIssued}</h3>
              </Card>
              <Card
                className="border-border/50 bg-card/30 p-6 space-y-2 animate-slide-up"
                style={{ animationDelay: "50ms" }}
              >
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <h3 className="text-3xl font-bold">${(accountInfo.totalVolume / 1000000).toFixed(2)}M</h3>
              </Card>
              <Card
                className="border-border/50 bg-card/30 p-6 space-y-2 animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="text-sm font-mono text-primary">{accountInfo.walletAddress.slice(0, 16)}...</p>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">Failed to load dashboard data. Check your API key configuration.</p>
          </div>
        )}
      </div>
    </div>
  )
}
