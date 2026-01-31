'use client'

import { memo } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ARKHAM_BASE = 'https://intel.arkm.com/explorer/address'
const X_SEARCH_BASE = 'https://x.com/search'

interface SearchWalletElsewhereProps {
  wallet: string
}

export const SearchWalletElsewhere = memo(function SearchWalletElsewhere({
  wallet,
}: SearchWalletElsewhereProps) {
  const arkhamUrl = `${ARKHAM_BASE}/${wallet}`
  const xSearchUrl = `${X_SEARCH_BASE}?q=${encodeURIComponent(wallet)}`

  return (
    <Card className="border-border/40 bg-card overflow-hidden relative">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, oklch(0.75 0.15 195 / 0.5), transparent)',
        }}
      />
      <CardContent className="py-6 px-6">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Identity Leakage: Look Up Address on External Platforms</h3>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={arkhamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'border border-border/60 bg-muted/20',
                'hover:border-primary/40 hover:bg-primary/5 transition-colors',
                'font-medium text-sm'
              )}
            >
              Search on Arkham
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
            <a
              href={xSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'border border-border/60 bg-muted/20',
                'hover:border-primary/40 hover:bg-primary/5 transition-colors',
                'font-medium text-sm'
              )}
            >
              Search on X
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
          </div>

          <div className="rounded-lg bg-muted/20 border border-border/40 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Platforms like <span className="text-foreground font-medium">Arkham</span> label
              wallets and link them to entities (exchanges, funds, known addresses). Searching
              this address on <span className="text-foreground font-medium">X</span> can surface
              posts that mention it—including links from Arkham, blockscanners, or users—which
              may reveal identity links or public discussion about the wallet. Use these links
              to see how surveillance tools and social media already expose this address.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
