import { useState } from "react"
import { useTranslation, SUPPORTED_LANGUAGES } from "@/i18n/config"
import { ChevronDown } from "lucide-react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"

const languages = [
  { code: SUPPORTED_LANGUAGES.EN, label: "English", display: "EN" },
  { code: SUPPORTED_LANGUAGES.ZH, label: "简体中文", display: "中文" },
  { code: SUPPORTED_LANGUAGES.ZH_HK, label: "繁體中文", display: "繁中" },
] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  // Normalize language code to match our resources (en, zh, or zh-HK)
  const getNormalizedLang = (lang: string | undefined) => {
    if (!lang) return SUPPORTED_LANGUAGES.EN
    const lowerLang = lang.toLowerCase()
    // Check for zh-HK first (more specific)
    if (lowerLang === "zh-hk" || lowerLang === "zh-hant") {
      return SUPPORTED_LANGUAGES.ZH_HK
    }
    const normalized = lowerLang.split("-")[0]
    if (normalized === SUPPORTED_LANGUAGES.ZH) {
      // Default to simplified Chinese if not specifically zh-HK
      return SUPPORTED_LANGUAGES.ZH
    }
    return SUPPORTED_LANGUAGES.EN
  }

  const currentLang = getNormalizedLang(i18n.language)
  const currentLanguage =
    languages.find((lang) => lang.code === currentLang) || languages[0]

  const handleLanguageChange = (value: string) => {
    try {
      // Ensure we use the normalized language code
      if (
        value === SUPPORTED_LANGUAGES.EN ||
        value === SUPPORTED_LANGUAGES.ZH ||
        value === SUPPORTED_LANGUAGES.ZH_HK
      ) {
        i18n.changeLanguage(value).catch((error) => {
          console.error("Failed to change language:", error)
        })
      }
      setOpen(false)
    } catch (error) {
      console.error("Error changing language:", error)
    }
  }

  return (
    <SelectPrimitive.Root
      value={currentLang}
      onValueChange={handleLanguageChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium",
          "text-slate-600 transition-all duration-150",
          "hover:bg-slate-100/80 hover:text-slate-900",
          "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
          "data-[state=open]:bg-slate-100",
          "h-7 min-w-12 border-0 bg-transparent",
        )}
        aria-label="Select language"
      >
        <SelectPrimitive.Value placeholder={currentLanguage.display}>
          {currentLanguage.display}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-150 data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "duration-150",
          )}
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport className="p-1">
            {languages.map((lang) => (
              <SelectPrimitive.Item
                key={lang.code}
                value={lang.code}
                className={cn(
                  "relative flex w-full cursor-pointer items-center rounded-md px-3 py-1.5 text-sm outline-none select-none",
                  "text-slate-700 transition-colors duration-150",
                  "focus:bg-slate-100 focus:text-slate-900",
                  "data-disabled:pointer-events-none data-disabled:opacity-50",
                  currentLang === lang.code &&
                    "bg-slate-50/50 font-medium text-slate-900",
                )}
              >
                <SelectPrimitive.ItemText>
                  {lang.label}
                </SelectPrimitive.ItemText>
                {currentLang === lang.code && (
                  <span className="ml-auto text-xs font-medium text-slate-600">
                    ✓
                  </span>
                )}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
