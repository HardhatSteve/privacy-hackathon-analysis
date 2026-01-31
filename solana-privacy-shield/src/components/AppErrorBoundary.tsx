import * as React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep details in console for debugging; show friendly message to users.
    console.error("App crashed:", error);
    console.error("Component stack:", info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const showDetails = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh the page. If this keeps happening, the app may be missing a required
            browser polyfill.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh
            </button>
          </div>

          {showDetails && this.state.error && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
