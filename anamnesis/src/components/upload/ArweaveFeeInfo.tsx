import { ExternalLink, Calculator } from "lucide-react"
import { useTranslation } from "@/i18n/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ArweaveFeeInfo() {
  const { t } = useTranslation()

  return (
    <Card className="border-blue-200/60 bg-blue-50/30 shadow-sm">
      <CardHeader className="sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
            <Calculator className="h-4 w-4" />
          </div>
          <CardTitle className="text-base sm:text-lg">
            {t("upload.feeInfoTitle")}
          </CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          {t("upload.feeInfoDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-white/50 p-4">
          <p className="mb-3 text-sm font-semibold text-blue-900">
            {t("upload.feeInfoNote")}
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              <span>{t("upload.feeInfoItem1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              <span>{t("upload.feeInfoItem2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              <span>{t("upload.feeInfoItem3")}</span>
            </li>
          </ul>
        </div>
        <a
          href="https://ar-fees.arweave.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
        >
          <span>{t("upload.viewFeeCalculator")}</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  )
}
