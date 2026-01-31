import { useTranslation } from "@/i18n/config"
import { Calculator, Loader2, Zap } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import type { FeeEstimate } from "@/hooks/use-fee-calculation"

interface FeeEstimateProps {
  file: File | null
  files?: File[]
  estimatedFee: FeeEstimate | null
  calculatingFee: boolean
  feeError: string | null
  encryptUpload: boolean
  compressUpload: boolean
  shouldCompressFile: (file: File) => boolean
}

export function FeeEstimate({
  file,
  files = [],
  estimatedFee,
  calculatingFee,
  feeError,
  encryptUpload,
  compressUpload,
  shouldCompressFile,
}: FeeEstimateProps) {
  const { t } = useTranslation()

  const displayFiles = files.length > 0 ? files : file ? [file] : []
  if (displayFiles.length === 0) return null

  const totalSize = displayFiles.reduce((sum, f) => sum + f.size, 0)
  const isMultiple = files.length > 0

  return (
    <div className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <div className="border-b border-blue-200/50 bg-blue-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            {t("upload.estimatedFee")}
          </span>
          {calculatingFee && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          )}
        </div>
      </div>
      <div className="p-4">
        {feeError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="text-xs font-medium text-amber-800">{feeError}</div>
            <div className="mt-1 text-xs text-amber-700">
              {t("upload.feeErrorHint")}
            </div>
          </div>
        ) : estimatedFee ? (
          <div className="space-y-3">
            {/* AR 费用显示 */}
            <div className="rounded-lg bg-white/60 p-4">
              <div className="mb-2 text-xs font-medium text-slate-600">
                {t("upload.feeInAR")}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {estimatedFee.ar.toFixed(6)} AR
              </div>
              {estimatedFee.manifestFeeAR !== undefined &&
                estimatedFee.manifestFeeAR > 0 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/50 pt-2 text-xs">
                    <span className="text-slate-500">
                      {t("upload.fileFee") || "文件费用"}:
                    </span>
                    <span className="font-medium text-slate-700">
                      {(estimatedFee.ar - estimatedFee.manifestFeeAR).toFixed(
                        6,
                      )}{" "}
                      AR
                    </span>
                  </div>
                )}
              {estimatedFee.manifestFeeAR !== undefined &&
                estimatedFee.manifestFeeAR > 0 && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {t("upload.manifestFee") || "清单文件费用"}:
                    </span>
                    <span className="font-medium text-slate-700">
                      {estimatedFee.manifestFeeAR.toFixed(6)} AR
                    </span>
                  </div>
                )}
            </div>

            {/* 压缩信息显示 */}
            {estimatedFee.originalSize !== undefined &&
              estimatedFee.compressedSize !== undefined &&
              estimatedFee.savedFeeAR !== undefined &&
              estimatedFee.savedFeeAR > 0 && (
                <div className="space-y-2 rounded-lg border border-green-200 bg-green-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-900">
                      {t("upload.compressionSavings")}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {t("upload.originalSize")}:
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatFileSize(estimatedFee.originalSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {t("upload.compressedSize")}:
                      </span>
                      <span className="font-medium text-green-700">
                        {formatFileSize(estimatedFee.compressedSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-green-200/50 pt-1.5 text-xs">
                      <span className="font-semibold text-green-900">
                        {t("upload.savedFee")}:
                      </span>
                      <span className="font-bold text-green-700">
                        {estimatedFee.savedFeeAR.toFixed(6)} AR
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* 文件信息 */}
            <div className="space-y-2 rounded-lg bg-white/40 px-3 py-2">
              {isMultiple ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {t("upload.filesSelected")}: {files.length}
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatFileSize(totalSize)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {t("upload.feeEstimatedNote")}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-500">
                    {t("upload.fileSize")}:
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    {formatFileSize(file!.size)}
                  </div>
                  {encryptUpload && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div className="text-[10px] text-slate-500">
                        {t("upload.encrypted")}
                      </div>
                    </>
                  )}
                  {compressUpload && file && shouldCompressFile(file) && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div className="text-[10px] text-slate-500">
                        {t("upload.compressed")}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("upload.calculatingFee")}
          </div>
        )}
      </div>
    </div>
  )
}
