'use client'

import { LeakLensNavbar } from '@/components/ui/resizable-navbar'
import { Footer } from '@/components/footer'
import { PrivacyStory } from '@/components/learn'

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background">
      <LeakLensNavbar />
      <main className="pt-20">
        <PrivacyStory />
      </main>
      <Footer />
    </div>
  )
}
