import { useState, useCallback, useRef, useEffect } from "react"
import { Search, X, ExternalLink, Loader2, Lock, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  searchArweaveTransactions,
  type ArweaveSearchResult,
} from "@/lib/arweave-search"
import {
  useTranslation,
  isSimplifiedChinese,
  isTraditionalChinese,
} from "@/i18n/config"
import i18n from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"

export function ArweaveSearch() {
  const { t } = useTranslation()
  const { activeAddress } = useWalletManager()
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<ArweaveSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      const searchResults = await searchArweaveTransactions({
        query: query.trim(),
        limit: 20,
        ownerAddress: activeAddress || undefined,
        preferLocal: true, // 优先本地搜索
      })
      setResults(searchResults)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, activeAddress])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSearch()
      } else if (e.key === "Escape") {
        setShowResults(false)
        inputRef.current?.blur()
      }
    },
    [handleSearch],
  )

  const handleClear = useCallback(() => {
    setQuery("")
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }, [])

  const formatDate = (timestamp: number) => {
    const currentLang = i18n.language
    let locale = "en-US"
    if (isSimplifiedChinese(currentLang)) {
      locale = "zh-CN"
    } else if (isTraditionalChinese(currentLang)) {
      locale = "zh-HK"
    }
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes, 10)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getTagValue = (
    tags: Array<{ name: string; value: string }>,
    name: string,
  ) => {
    return tags.find((tag) => tag.name === name)?.value || ""
  }

  const shortenedTxId = (txId: string) => {
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`
  }

  return (
    <div ref={searchRef} className="relative w-full lg:max-w-md lg:flex-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={t("common.searchArweave")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) {
                setShowResults(true)
              }
            }}
            className="w-full border-slate-200 bg-white pr-20 pl-10 text-sm focus-visible:border-indigo-500 focus-visible:ring-indigo-500 sm:pr-24 sm:text-base"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute top-1/2 right-10 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 sm:right-14"
              aria-label={t("common.clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="absolute top-1/2 right-1 h-8 -translate-y-1/2 rounded-md bg-indigo-600 px-2 text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600 sm:px-3"
            aria-label={t("common.searchButton")}
          >
            {isSearching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </button>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="flex h-8 shrink-0 items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 sm:h-9 sm:p-2"
              aria-label={t("common.searchCapabilities")}
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-lg font-semibold">
              {t("common.searchCapabilities")}
            </DialogTitle>
            <div className="space-y-2 text-sm text-slate-600">
              <pre className="font-sans whitespace-pre-wrap">
                {t("common.searchCapabilitiesDesc")}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <Card className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] w-full overflow-y-auto border border-slate-200 bg-white shadow-xl sm:max-h-96">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">
                {t("common.searching")}
              </span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {query.trim()
                ? t("common.noResults")
                : t("common.enterSearchQuery")}
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result) => {
                const fileName = getTagValue(result.tags, "File-Name")
                const contentType = getTagValue(result.tags, "Content-Type")
                const appName = getTagValue(result.tags, "App-Name")
                const description = getTagValue(result.tags, "Description")
                const encryptionAlgo = getTagValue(
                  result.tags,
                  "Encryption-Algo",
                )
                const isEncrypted = encryptionAlgo && encryptionAlgo !== "none"

                return (
                  <a
                    key={result.id}
                    href={`https://arweave.net/${result.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 transition-colors hover:bg-indigo-50/50 active:bg-indigo-100/50 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {fileName && (
                          <div className="flex items-center gap-2 truncate text-sm font-medium text-slate-900 sm:text-base">
                            <span className="truncate">{fileName}</span>
                            {isEncrypted && (
                              <span
                                className="flex shrink-0 items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700"
                                title={t("common.encrypted")}
                              >
                                <Lock className="h-3 w-3" />
                                <span className="hidden sm:inline">
                                  {t("common.encrypted")}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        {description && (
                          <div className="mt-1 truncate text-xs text-slate-600 sm:text-sm">
                            {description}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:gap-2">
                          {appName && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs sm:px-2">
                              {appName}
                            </span>
                          )}
                          {contentType && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs sm:px-2">
                              {contentType}
                            </span>
                          )}
                          <span className="whitespace-nowrap">
                            {formatFileSize(result.data.size)}
                          </span>
                          {result.block?.timestamp && (
                            <span className="whitespace-nowrap">
                              {formatDate(result.block.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-mono text-xs break-all text-slate-400 sm:break-normal">
                          {shortenedTxId(result.id)}
                        </div>
                      </div>
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
