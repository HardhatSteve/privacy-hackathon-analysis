import { useState, useCallback } from "react"
import { toast } from "sonner"
import { uploadFile } from "@/lib/file-manager"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import type { WalletKey } from "@/lib/types"

export function useUploadHandler() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current?: number
    total?: number
    currentFile?: string
    stage?: string
    progress?: number
  } | null>(null)

  const handleUpload = useCallback(
    async (file: File, encryptUpload: boolean, compressUpload: boolean) => {
      // 检查是否有外部 Arweave 钱包连接
      const hasExternalArweave =
        externalWallets.isArConnected && externalWallets.arAddress
      // 检查是否有内部 Arweave 钱包
      const hasInternalArweave =
        walletManager.activeWallet &&
        walletManager.wallets.some(
          (w) =>
            w.address === walletManager.activeAddress && w.chain === "arweave",
        )

      if (!hasExternalArweave && !hasInternalArweave) {
        toast.error(t("upload.arweaveSelectAccount"))
        return false
      }

      // 如果使用外部钱包，不需要解锁
      if (!hasExternalArweave && !walletManager.isUnlocked) {
        toast.error(t("history.errorLocked"))
        return false
      }

      if (!file) {
        toast.error(t("upload.arweaveSelectAccount"))
        return false
      }

      setUploading(true)
      setUploadProgress({
        currentFile: file.name,
        stage: "准备中",
        progress: 0,
      })
      try {
        let ownerAddress: string
        let key: WalletKey

        if (hasExternalArweave) {
          // 使用外部 Arweave 钱包（ArConnect）
          if (!externalWallets.arAddress) {
            toast.error(t("upload.arweaveSelectAccount"))
            return false
          }
          ownerAddress = externalWallets.arAddress
          key = null as unknown as WalletKey // 外部钱包不需要 key
        } else {
          // 使用内部钱包
          if (!walletManager.activeWallet || !walletManager.activeAddress) {
            toast.error(t("upload.arweaveSelectAccount"))
            return false
          }
          ownerAddress = walletManager.activeAddress
          key = walletManager.activeWallet
        }

        // 使用 uploadFile 函数，它会自动保存到数据库
        await uploadFile(file, ownerAddress, key, {
          encryptionKey:
            encryptUpload && walletManager.isUnlocked
              ? walletManager.masterKey!
              : undefined,
          useExternalWallet: !!hasExternalArweave,
          enableCompression: compressUpload,
          onProgress: (progress) => {
            setUploadProgress({
              currentFile: file.name,
              stage: progress.stage,
              progress: progress.progress,
            })
          },
        })

        toast.success(t("upload.successArweave"))
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        toast.error(
          t("upload.failed", { protocol: "Arweave", message: errorMessage }),
        )
        return false
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
    },
    [walletManager, externalWallets, t],
  )

  const handleBatchUpload = useCallback(
    async (files: File[], encryptUpload: boolean, compressUpload: boolean) => {
      if (files.length === 0) {
        return { success: 0, failed: 0 }
      }

      // 检查是否有可用的 Arweave 账户
      const hasExternalArweave =
        externalWallets.isArConnected && externalWallets.arAddress
      const hasInternalArweave =
        walletManager.activeWallet &&
        walletManager.wallets.some(
          (w) =>
            w.address === walletManager.activeAddress && w.chain === "arweave",
        )

      if (!hasExternalArweave && !hasInternalArweave) {
        toast.error(t("upload.arweaveSelectAccount"))
        return { success: 0, failed: 0 }
      }

      if (!hasExternalArweave && !walletManager.isUnlocked) {
        toast.error(t("history.errorLocked"))
        return { success: 0, failed: 0 }
      }

      let ownerAddress: string
      let key: WalletKey

      if (hasExternalArweave) {
        if (!externalWallets.arAddress) {
          toast.error(t("upload.arweaveSelectAccount"))
          return { success: 0, failed: 0 }
        }
        ownerAddress = externalWallets.arAddress
        key = null as unknown as WalletKey
      } else {
        if (!walletManager.activeWallet || !walletManager.activeAddress) {
          toast.error(t("upload.arweaveSelectAccount"))
          return { success: 0, failed: 0 }
        }
        ownerAddress = walletManager.activeAddress
        key = walletManager.activeWallet
      }

      setUploading(true)
      let successCount = 0
      let failedCount = 0

      try {
        // 批量上传文件（禁用单个文件的清单更新，批量完成后统一更新）
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          setUploadProgress({
            current: i + 1,
            total: files.length,
            currentFile: file.name,
          })

          try {
            await uploadFile(file, ownerAddress, key, {
              encryptionKey:
                encryptUpload && walletManager.isUnlocked
                  ? walletManager.masterKey!
                  : undefined,
              useExternalWallet: !!hasExternalArweave,
              enableCompression: compressUpload,
              updateManifest: false, // 批量上传时禁用单个文件的清单更新
            })
            successCount++
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error)
            failedCount++
          }
        }

        // 批量上传完成后，在浏览器空闲时间更新清单文件，避免阻塞页面
        if (successCount > 0) {
          try {
            const { scheduleManifestUpdate } = await import("@/lib/file-sync")
            scheduleManifestUpdate(ownerAddress, key, !!hasExternalArweave)
            console.log(
              `[BatchUpload] Manifest update scheduled after ${successCount} files uploaded`,
            )
          } catch (error) {
            console.error(
              "[BatchUpload] Failed to schedule manifest update after batch upload:",
              error,
            )
            // 清单更新失败不影响上传成功的提示
          }
        }

        if (successCount > 0) {
          toast.success(
            t("upload.batchSuccess", {
              success: successCount,
              total: files.length,
            }),
          )
        }

        if (failedCount > 0) {
          toast.error(
            t("upload.batchFailed", {
              failed: failedCount,
              total: files.length,
            }),
          )
        }

        return { success: successCount, failed: failedCount }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        toast.error(t("upload.batchError", { message: errorMessage }))
        return { success: successCount, failed: failedCount }
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
    },
    [walletManager, externalWallets, t],
  )

  return {
    uploading,
    uploadProgress,
    handleUpload,
    handleBatchUpload,
  }
}
