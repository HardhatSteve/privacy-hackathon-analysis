import { Link, useLocation } from "react-router-dom"
import { type LucideIcon } from "lucide-react"
import { useWalletManager } from "@/hooks/use-wallet-manager"

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

interface MobileNavProps {
  items: NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const location = useLocation()
  const walletManager = useWalletManager()

  return (
    <nav className="pb-safe glass-strong fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200/50 shadow-2xl md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          const isAccount = item.path === "/account"

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`touch-feedback flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-2 transition-all duration-200 ${
                isActive
                  ? "scale-105 bg-indigo-50 text-indigo-600"
                  : "text-slate-500 active:scale-95"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${isActive ? "scale-110" : "scale-100"}`}
                />
                {isAccount && walletManager.isUnlocked && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
