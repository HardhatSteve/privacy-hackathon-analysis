"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <p className="text-xl text-zinc-400 mb-8">Something went wrong</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-black font-medium hover:bg-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
