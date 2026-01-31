import { type ReactNode } from "react"
import { Navbar } from "./Navbar"
import { useTranslation } from "@/i18n/config"
import { Toaster } from "sonner"

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-20 font-sans text-slate-900 md:pb-0">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-100 bg-white/50 py-8 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm font-medium text-slate-400 lg:px-8">
          <p>{t("common.footer")}</p>
        </div>
      </footer>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
