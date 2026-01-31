'use client'

import { cn } from '@/lib/utils'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { Network, Clock, Fingerprint, Link } from 'lucide-react'
import { Meteors } from '@/components/ui/meteors'

function Skeleton({ icon, thumbnailCopy }: { icon: React.ReactNode; thumbnailCopy?: string }) {
  return (
    <div
      className={cn(
        'relative flex flex-1 w-full h-full min-h-[6rem] rounded-xl',
        'overflow-hidden'
      )}
    >
      {/* Meteors effect */}
      <Meteors number={15} />

      {/* Icon and text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
        {icon}
        {thumbnailCopy && (
          <p className="text-xs text-muted-foreground/60 font-medium text-center px-4">
            {thumbnailCopy}
          </p>
        )}
      </div>
    </div>
  )
}

const items = [
  {
    title: 'Your wallet is not alone',
    body: "Your transactions don't exist in isolation. Funding sources, repeated counterparties, and shared behavior allow wallets to be grouped together — even if you never interact directly.",
    subline: 'Clusters form faster than most users realize.',
    header: (
      <Skeleton
        icon={
          <Network
            className="w-16 h-16 text-cyan-400/20"
            strokeWidth={1.25}
            fill="none"
          />
        }
        thumbnailCopy="Transactions don't exist in isolation."
      />
    ),
    className: 'md:col-span-2',
  },
  {
    title: 'When you transact matters',
    body: 'Transaction timestamps expose routines, timezones, and inactivity windows. Over time, simple timing patterns can narrow down where and how a wallet is operated.',
    subline: "Privacy loss doesn't require amounts — timing is enough.",
    header: (
      <Skeleton
        icon={
          <Clock
            className="w-16 h-16 text-cyan-400/20"
            strokeWidth={1.25}
            fill="none"
          />
        }
        thumbnailCopy="Timing reveals routines."
      />
    ),
    className: 'md:col-span-1',
  },
  {
    title: 'Behavior creates a fingerprint',
    body: 'Reaction speed, execution consistency, and transaction structure reveal whether a wallet is human, automated, or professionally operated.',
    subline: 'Bots and humans leave very different traces.',
    header: (
      <Skeleton
        icon={
          <Fingerprint
            className="w-16 h-16 text-cyan-400/20"
            strokeWidth={1.25}
            fill="none"
          />
        }
        thumbnailCopy="Consistency becomes identity."
      />
    ),
    className: 'md:col-span-1',
  },
  {
    title: 'One transaction can last forever',
    body: 'A single interaction with the wrong wallet, protocol, or bridge can permanently link your address to known entities or clusters.',
    subline: "Blockchains don't forget.",
    header: (
      <Skeleton
        icon={
          <Link
            className="w-16 h-16 text-cyan-400/20"
            strokeWidth={1.25}
            fill="none"
          />
        }
        thumbnailCopy="The ledger never forgets."
      />
    ),
    className: 'md:col-span-2',
  },
]

export function FeatureBento() {
  return (
    <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-center text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        What can your wallet reveal?
      </h1>
      <div className="flex items-center justify-center mb-12">
        <span className="block h-px w-12 bg-cyan-600/40 mr-3" />
        <span className="text-base sm:text-lg text-muted-foreground font-medium">
          Why on-chain activity gives away more than you realize.
        </span>
        <span className="block h-px w-12 bg-cyan-500/40 ml-3" />
      </div>
      <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[22rem] gap-4">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={
              <>
                <p className="mb-3 text-base">{item.body}</p>
                <p className="text-sm opacity-80">{item.subline}</p>
              </>
            }
            header={item.header}
            className={item.className}
          />
        ))}
      </BentoGrid>
    </section>
  )
}
