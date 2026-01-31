import { Link } from "react-router-dom"
import { useTranslation } from "@/i18n/config"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight } from "lucide-react"

interface UploadWarningProps {
  isLocked: boolean
  hasExternalWallet: boolean
}

export function UploadWarning({
  isLocked,
  hasExternalWallet,
}: UploadWarningProps) {
  const { t } = useTranslation()

  if (isLocked && !hasExternalWallet) {
    return (
      <div className="flex items-start gap-4 rounded-xl border-2 border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/70 p-5 text-sm text-amber-900 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="mb-2 text-base leading-relaxed font-bold">
            {t("upload.needUnlockToUpload")}
          </p>
          <p className="mb-3 text-sm leading-relaxed text-amber-800">
            {t("upload.unlockHint")}
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
    )
  }

  return null
}
