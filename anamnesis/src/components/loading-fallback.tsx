/**
 * HydrateFallback component for React Router
 * This component is rendered during client-side loading when loading JS modules
 * or running clientLoader functions.
 */
export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"></div>
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
