import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import type { UploadRecord } from "@/lib/types"
import { searchFiles, type FileIndex } from "@/lib/file-manager"
import { useEffect, useState } from "react"
import { HistoryTable } from "@/components/history-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  History,
  Lock,
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useFileSync } from "@/hooks/use-file-sync"
import { useExternalWallets } from "@/hooks/use-external-wallets"

// 将 FileIndex 转换为 UploadRecord 格式（用于兼容 HistoryTable）
function fileIndexToUploadRecord(file: FileIndex): UploadRecord {
  return {
    id: undefined,
    txId: file.tx_id,
    fileName: file.file_name,
    fileHash: file.file_hash,
    fileSize: file.file_size,
    mimeType: file.mime_type,
    storageType: file.storage_type as "arweave",
    ownerAddress: file.owner_address,
    encryptionAlgo: file.encryption_algo,
    encryptionParams: file.encryption_params,
    createdAt: file.created_at,
  }
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([])
  const { syncing, syncFromArweave } = useFileSync()

  // 加载上传历史
  const loadUploadHistory = async () => {
    // 收集所有可能的地址（内部钱包 + 外部钱包）
    const addresses: string[] = []

    if (walletManager.activeAddress) {
      addresses.push(walletManager.activeAddress)
    }

    if (externalWallets.arAddress) {
      addresses.push(externalWallets.arAddress)
    }

    if (addresses.length === 0) {
      setUploadHistory([])
      return
    }

    try {
      // 从 SQLite 加载所有地址的文件
      const allFiles: FileIndex[] = []

      for (const address of addresses) {
        const sqliteFiles = await searchFiles(address, {
          limit: 1000, // 加载足够多的记录
        })
        allFiles.push(...sqliteFiles)
      }

      // 去重（基于 tx_id，因为同一个交易可能被多个地址查询到）
      const uniqueFiles = Array.from(
        new Map(allFiles.map((file) => [file.tx_id, file])).values(),
      )

      const records = uniqueFiles
        .map(fileIndexToUploadRecord)
        .sort((a, b) => b.createdAt - a.createdAt)

      setUploadHistory(records)
    } catch (error) {
      console.error("Failed to load upload history:", error)
      setUploadHistory([])
    }
  }

  useEffect(() => {
    loadUploadHistory()
  }, [walletManager.activeAddress, externalWallets.arAddress])

  // 在页面加载后，空闲时间自动同步文件
  useEffect(() => {
    // 收集所有需要同步的地址
    const addresses: string[] = []

    if (walletManager.activeAddress) {
      addresses.push(walletManager.activeAddress)
    }

    if (externalWallets.arAddress) {
      addresses.push(externalWallets.arAddress)
    }

    if (addresses.length === 0) {
      return
    }

    // 使用 scheduleAutoSync 在浏览器空闲时间自动同步
    const scheduleAutoSyncPromises = addresses.map(async (address) => {
      try {
        const { scheduleAutoSync } = await import("@/lib/file-sync-direct")
        scheduleAutoSync(address, (result) => {
          // 同步完成后重新加载历史记录
          if (result.added > 0 || result.updated > 0) {
            loadUploadHistory()
          }
        })
      } catch (error) {
        console.warn(`Failed to schedule auto sync for ${address}:`, error)
      }
    })

    // 等待所有调度完成（不阻塞）
    Promise.all(scheduleAutoSyncPromises).catch((error) => {
      console.warn("Failed to schedule auto sync:", error)
    })
  }, [walletManager.activeAddress, externalWallets.arAddress])

  // 处理同步
  const handleSync = async () => {
    const success = await syncFromArweave()
    if (success) {
      // 同步成功后重新加载历史记录
      await loadUploadHistory()
    }
  }

  // 检查是否需要显示账户管理提示
  const needsAccountSetup =
    !walletManager.isUnlocked && !externalWallets.isArConnected

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <LayoutDashboard className="h-7 w-7 text-indigo-600 sm:h-8 sm:w-8" />
            {t("common.dashboard")}
          </h2>
          <p className="text-sm text-slate-500 sm:text-base">
            {t("history.desc")}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xs sm:px-4 sm:py-2">
          <div className="flex-1 sm:text-right">
            <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {t("common.activeAccountLabel")}
            </div>
            <div className="max-w-[180px] truncate text-sm font-bold text-slate-900">
              {walletManager.activeAddress
                ? walletManager.wallets.find(
                    (w) => w.address === walletManager.activeAddress,
                  )?.alias || "Unnamed"
                : t("common.noAccount")}
            </div>
          </div>
          <Link to="/account" className="sm:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Lock className="h-4 w-4 text-slate-400" />
            </Button>
          </Link>
        </div>
      </div>

      {needsAccountSetup && (
        <div className="glass-strong animate-fade-in-down flex items-start gap-4 rounded-2xl border-2 border-amber-300/60 bg-linear-to-br from-amber-50 to-orange-50/70 p-6 shadow-lg">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="mb-2 text-base leading-relaxed font-bold">
              {t("history.needAccountSetup")}
            </p>
            <p className="mb-3 text-sm leading-relaxed text-amber-800">
              {t("history.accountSetupHint")}
            </p>
            <Link to="/account">
              <Button
                variant="outline"
                className="rounded-lg border-amber-300 bg-white font-semibold text-amber-900 hover:border-amber-400 hover:bg-amber-50"
              >
                {t("upload.goToAccount")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        <Card className="overflow-hidden border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:pb-6">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <History className="h-5 w-5 text-indigo-600" />
                {t("history.title")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("history.desc")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {!walletManager.isUnlocked ? (
                <Link to="/account" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 sm:w-auto"
                  >
                    <Lock className="mr-2 h-3.5 w-3.5" />
                    {t("common.accountLocked")}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="group w-full sm:w-auto"
                >
                  <RefreshCw
                    className={`mr-2 h-3.5 w-3.5 transition-transform duration-200 ${syncing ? "animate-spin" : "group-hover:rotate-180"}`}
                  />
                  {syncing
                    ? t("history.syncing")
                    : t("history.syncFromArweave")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <HistoryTable
                records={uploadHistory || []}
                masterKey={walletManager.masterKey}
                activeAddress={walletManager.activeAddress}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
