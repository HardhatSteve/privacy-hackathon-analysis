import { Link } from "react-router-dom"
import { useTranslation } from "@/i18n/config"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
} from "lucide-react"
import { generateArweaveWallet } from "@/lib/storage"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import { toast } from "sonner"

interface AccountSelectorProps {
  file: File | null
}

export function AccountSelector({ file }: AccountSelectorProps) {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()

  const handleCreateArWallet = async () => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    try {
      const { key, address } = await generateArweaveWallet()
      const alias = prompt(
        t("identities.aliasPrompt"),
        `Wallet-${address.slice(0, 4)}`,
      )
      if (!alias) return
      // Convert JWKInterface to ArweaveJWK
      const arweaveKey = key as unknown as import("@/lib/types").ArweaveJWK
      await walletManager.addWallet(arweaveKey, alias)
      toast.success(t("identities.successGenerated"))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      toast.error(t("identities.errorGenerate", { message: errorMessage }))
    }
  }

  const handleImportWallet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const key = JSON.parse(reader.result as string)
          const alias = prompt(
            t("identities.aliasPrompt"),
            file.name.replace(".json", ""),
          )
          if (!alias) return
          await walletManager.addWallet(key, alias)
          toast.success(t("identities.successAdded", { alias }))
        } catch {
          toast.error("Invalid Arweave key file")
        }
      }
      reader.readAsText(file)
    }
  }

  // 检查是否有可用的 Arweave 账户
  const hasExternalArweave =
    externalWallets.isArConnected && externalWallets.arAddress
  const hasInternalArweave =
    walletManager.activeWallet &&
    walletManager.wallets.some(
      (w) => w.address === walletManager.activeAddress && w.chain === "arweave",
    )
  const hasAnyArweave = hasExternalArweave || hasInternalArweave

  // 显示当前使用的账户信息
  const currentAccount = hasExternalArweave
    ? {
        address: externalWallets.arAddress!,
        alias: t("identities.arconnectWallet"),
        isExternal: true,
      }
    : walletManager.wallets.find(
        (w) =>
          w.address === walletManager.activeAddress && w.chain === "arweave",
      )

  // 检查是否可以上传
  const canUpload = file && hasAnyArweave

  if (!walletManager.isUnlocked && !hasExternalArweave) {
    return (
      <div className="space-y-4 rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50/50 to-purple-50/30 px-6 py-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <Lock className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="px-2 text-sm leading-relaxed font-semibold text-indigo-900">
          {t("upload.arweaveLockedHint")}
        </p>
        <Link to="/account">
          <Button
            variant="outline"
            className="mt-2 rounded-xl border-indigo-300 bg-white hover:border-indigo-400 hover:bg-indigo-50"
          >
            {t("common.account")}
          </Button>
        </Link>
      </div>
    )
  }

  if (!hasAnyArweave) {
    return (
      <div className="space-y-6 rounded-xl border border-slate-200 bg-linear-to-br from-slate-50/50 to-slate-100/30 px-6 py-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Wallet className="h-6 w-6 text-slate-600" />
        </div>
        <div className="text-sm font-bold text-slate-700">
          {walletManager.wallets.length === 0
            ? t("upload.arweaveNoAccount")
            : t("upload.arweaveSelectAccount")}
        </div>

        {walletManager.wallets.filter((w) => w.chain === "arweave").length >
        0 ? (
          <div className="mx-auto grid max-w-md grid-cols-1 gap-3">
            {walletManager.wallets
              .filter((w) => w.chain === "arweave")
              .map((w) => (
                <Button
                  key={w.id}
                  variant="outline"
                  className="group h-auto justify-start rounded-xl border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md"
                  onClick={() => walletManager.selectWallet(w.address)}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200">
                      <Wallet className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1 truncate text-left">
                      <div className="text-sm font-bold text-slate-900">
                        {w.alias}
                      </div>
                      <div className="mt-0.5 max-w-full truncate font-mono text-[10px] text-slate-500">
                        {w.address}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={handleCreateArWallet}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> {t("identities.new")}
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50 sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" /> {t("identities.import")}
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportWallet}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {currentAccount && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-linear-to-r from-green-50/50 to-emerald-50/30 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-900">
                {currentAccount.alias}
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="mt-1 truncate font-mono text-xs text-green-700">
              {currentAccount.address}
            </div>
          </div>
        </div>
      )}

      {/* 文件已选择但无法上传的提示 */}
      {file && !canUpload && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/70 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {t("upload.fileSelectedButCannotUpload")}
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {!hasAnyArweave
                ? t("upload.needAccountToUpload")
                : t("upload.needUnlockToUpload")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
