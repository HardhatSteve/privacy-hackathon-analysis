// NOTE: This import must be first to ensure Node globals exist before Solana libraries load.
import "./polyfills";

import { createRoot } from "react-dom/client";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

const root = createRoot(rootEl);

// Render a lightweight loading state while the app (and its Solana deps) load.
root.render(
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="text-sm text-muted-foreground">Loading…</div>
  </div>,
);

// Dynamic import ensures polyfills are applied before evaluating App module dependencies.
import("./App")
  .then(({ default: App }) => {
    import("./components/AppErrorBoundary").then(({ AppErrorBoundary }) => {
      root.render(
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>,
      );
    });
  })
  .catch((err) => {
    console.error("Failed to load app:", err);
    root.render(
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Failed to load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh the page. If this persists, there may be a compatibility issue in the
            production build.
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
            {String(err?.stack || err)}
          </pre>
        </div>
      </div>,
    );
  });
