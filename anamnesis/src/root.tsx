import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { useEffect, useState } from "react"
import { Providers } from "./providers"
import "./index.css"
import "./i18n/config"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" type="image/x-icon" href="/anamnesis/favicon.ico" />
        <Meta />
        <Links />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ScrollRestoration />
        <Scripts />
        {/* coi-serviceworker for Cross-Origin Isolation (required for SQLite OPFS persistence) */}
        {/* Load after Scripts to avoid hydration conflicts */}
        <script
          src="/anamnesis/coi-serviceworker.min.js"
          suppressHydrationWarning
        />
      </body>
    </html>
  )
}

/**
 * HydrateFallback component for React Router
 * This component is rendered during client-side loading when loading JS modules
 * or running clientLoader functions.
 */
export function HydrateFallback(_props?: {
  params?: Record<string, string>
  loaderData?: unknown
  actionData?: unknown
}) {
  // Ensure this renders the same on both server and client
  // No browser-specific APIs, no dynamic content, no conditional rendering
  // Props are accepted but not used to match React Router's expected signature
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-500"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">Loading...</p>
          <p className="mt-1 text-xs text-slate-500">Preparing your vault</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // 仅在客户端初始化 SQLite 数据库
        if (typeof window !== "undefined") {
          const { initDatabase } = await import("./lib/sqlite-db")
          await initDatabase()
        }
        setMounted(true)
      } catch (error) {
        console.error("Failed to initialize database:", error)
        setMounted(true)
      }
    }

    initialize()
  }, [])

  // 在数据库初始化完成前，显示 loading 而不是返回 null
  // 这样可以避免页面闪烁（先显示 HTML 中的 loading，然后清空，再显示 React 的 loading）
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-500"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">Loading...</p>
            <p className="mt-1 text-xs text-slate-500">Preparing your vault</p>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
