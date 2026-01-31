import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ShieldCheck } from "lucide-react"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import { shouldCompressFile } from "@/lib/compression"
import { useFeeCalculation } from "@/hooks/use-fee-calculation"
import { useUploadHandler } from "@/hooks/use-upload-handler"
import { UploadWarning } from "@/components/upload/UploadWarning"
import { FileUploadSection } from "@/components/upload/FileUploadSection"
import { UploadOptions } from "@/components/upload/UploadOptions"
import { FeeEstimate } from "@/components/upload/FeeEstimate"
import { AccountSelector } from "@/components/upload/AccountSelector"
import { UploadButton } from "@/components/upload/UploadButton"
import { ArweaveFeeInfo } from "@/components/upload/ArweaveFeeInfo"

export default function UploadPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()

  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [encryptUpload, setEncryptUpload] = useState(false)
  const [compressUpload, setCompressUpload] = useState(false)
  const [multipleMode, setMultipleMode] = useState(false)

  const {
    estimatedFee,
    calculatingFee,
    feeError,
    calculateFee,
    calculateBatchFee,
  } = useFeeCalculation()
  const { uploading, uploadProgress, handleUpload, handleBatchUpload } =
    useUploadHandler()

  // 获取当前账户地址（用于清单文件费用计算）
  const getOwnerAddress = (): string | undefined => {
    if (externalWallets.isArConnected && externalWallets.arAddress) {
      return externalWallets.arAddress
    }
    if (walletManager.activeAddress) {
      return walletManager.activeAddress
    }
    return undefined
  }

  // 文件选择处理（单个文件）
  const handleFileSelect = async (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile)
      setFiles([])
      setMultipleMode(false)
      // 根据文件类型自动设置压缩选项
      const shouldCompress = shouldCompressFile(selectedFile)
      setCompressUpload(shouldCompress)
      await calculateFee(
        selectedFile,
        encryptUpload,
        shouldCompress,
        getOwnerAddress(),
      )
    } else {
      setFile(null)
      setFiles([])
    }
  }

  // 文件选择处理（多个文件）- 增量添加
  const handleFilesSelect = async (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      setFile(selectedFiles[0])
      setMultipleMode(true)
      // 根据第一个文件类型自动设置压缩选项
      const shouldCompress = shouldCompressFile(selectedFiles[0])
      setCompressUpload(shouldCompress)
      // 计算所有文件的总费用（包括清单文件费用）
      await calculateBatchFee(
        selectedFiles,
        encryptUpload,
        shouldCompress,
        getOwnerAddress(),
      )
    } else {
      // 只有当列表为空时才清除
      setFiles([])
      setFile(null)
      setMultipleMode(false)
    }
  }

  // 加密选项改变时重新计算费用
  const handleEncryptChange = async (checked: boolean) => {
    setEncryptUpload(checked)
    const ownerAddress = getOwnerAddress()
    if (multipleMode && files.length > 0) {
      await calculateBatchFee(files, checked, compressUpload, ownerAddress)
    } else if (file) {
      await calculateFee(file, checked, compressUpload, ownerAddress)
    }
  }

  // 压缩选项改变时重新计算费用
  const handleCompressChange = async (checked: boolean) => {
    setCompressUpload(checked)
    const ownerAddress = getOwnerAddress()
    if (multipleMode && files.length > 0) {
      await calculateBatchFee(files, encryptUpload, checked, ownerAddress)
    } else if (file) {
      await calculateFee(file, encryptUpload, checked, ownerAddress)
    }
  }

  // 上传处理
  const onUploadArweave = async () => {
    if (multipleMode && files.length > 0) {
      // 批量上传
      const result = await handleBatchUpload(
        files,
        encryptUpload,
        compressUpload,
      )
      if (result.success > 0) {
        setFiles([])
        setFile(null)
        setMultipleMode(false)
      }
    } else if (file) {
      // 单个文件上传
      const success = await handleUpload(file, encryptUpload, compressUpload)
      if (success) {
        setFile(null)
        setFiles([])
      }
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
  const canUpload = Boolean((file || files.length > 0) && hasAnyArweave)
  const isDisabled = !walletManager.isUnlocked && !externalWallets.isArConnected

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4 sm:space-y-8 sm:py-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("common.upload")}
        </h2>
        <p className="text-sm text-slate-500 sm:text-base">
          {t("upload.arweaveDesc")}
        </p>
      </div>

      <UploadWarning
        isLocked={!walletManager.isUnlocked}
        hasExternalWallet={externalWallets.isArConnected}
      />

      <Card
        className={`overflow-hidden rounded-2xl border-slate-200/60 shadow-lg transition-all duration-300 hover:shadow-xl ${
          isDisabled ? "border-amber-200/60 opacity-75" : ""
        }`}
      >
        <CardHeader className="border-b border-slate-100 pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Upload className="h-4 w-4 text-indigo-600" />
            </div>
            {t("upload.arweaveTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploadSection
            file={file}
            files={files}
            onFileSelect={handleFileSelect}
            onFilesSelect={handleFilesSelect}
            disabled={isDisabled}
            multiple={true}
          />

          <UploadOptions
            encryptUpload={encryptUpload}
            compressUpload={compressUpload}
            file={file}
            files={files}
            isUnlocked={walletManager.isUnlocked}
            onEncryptChange={handleEncryptChange}
            onCompressChange={handleCompressChange}
          />

          <FeeEstimate
            file={file}
            files={files}
            estimatedFee={estimatedFee}
            calculatingFee={calculatingFee}
            feeError={feeError}
            encryptUpload={encryptUpload}
            compressUpload={compressUpload}
            shouldCompressFile={shouldCompressFile}
          />

          <AccountSelector file={file} />

          {hasAnyArweave && (
            <>
              <UploadButton
                uploading={uploading}
                file={file}
                canUpload={canUpload}
                encryptUpload={encryptUpload}
                onClick={onUploadArweave}
              />
              {uploadProgress && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {uploadProgress.currentFile || t("upload.uploading")}
                    </span>
                    {uploadProgress.current !== undefined &&
                    uploadProgress.total !== undefined ? (
                      <span className="text-slate-500">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    ) : uploadProgress.stage ? (
                      <span className="text-slate-500">
                        {uploadProgress.stage}
                      </span>
                    ) : null}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="relative h-full overflow-hidden bg-linear-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          uploadProgress.progress !== undefined
                            ? uploadProgress.progress
                            : uploadProgress.current !== undefined &&
                                uploadProgress.total !== undefined
                              ? (uploadProgress.current /
                                  uploadProgress.total) *
                                100
                              : 0
                        }%`,
                      }}
                    >
                      <div className="animate-shimmer absolute inset-0" />
                    </div>
                  </div>
                  {uploadProgress.stage && (
                    <div className="mt-2 text-xs text-slate-500">
                      {uploadProgress.stage}
                      {uploadProgress.progress !== undefined &&
                        ` - ${Math.round(uploadProgress.progress)}%`}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ArweaveFeeInfo />

      <div className="glass shadow-primary-glow flex items-start gap-4 rounded-2xl border-2 border-indigo-200/60 bg-linear-to-br from-indigo-50/80 to-blue-50/50 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 text-sm leading-relaxed text-indigo-900">
          <p className="mb-2 text-base font-bold text-indigo-950 sm:text-lg">
            {t("common.securityNotice")}
          </p>
          <p className="text-sm opacity-90">{t("common.securityNoticeDesc")}</p>
        </div>
      </div>
    </div>
  )
}
