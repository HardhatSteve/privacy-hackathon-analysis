"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { ProblemSection } from "@/components/problem-section"
import { HowItWorks } from "@/components/how-it-works"
import { FeaturesSection } from "@/components/features-section"
import { ComparisonSection } from "@/components/comparison-section"
import { DevSection } from "@/components/dev-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { Footer } from "@/components/footer"
import { LoadingScreen } from "@/components/loading-screen"

export default function SynelarLanding() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <LoadingScreen isLoading={isLoading} />

      <div className="fixed inset-0 -z-20">
        <iframe
          src="https://my.spline.design/glowingplanetparticles-oNju9tQxB1nyaHSc0bBhpEAE"
          className="w-full h-full border-0"
          title="Spline 3D Background"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <main className="min-h-screen overflow-hidden relative">
        <Header />
        <HeroSection />
        <div id="dashboard" className="bg-background relative z-10">
          <DashboardPreview />
          <ProblemSection />
          <HowItWorks />
          <FeaturesSection />
          <ComparisonSection />
          <DevSection />
          <div id="testimonials">
            <SocialProofSection />
          </div>
          <Footer />
        </div>
      </main>
    </>
  )
}
