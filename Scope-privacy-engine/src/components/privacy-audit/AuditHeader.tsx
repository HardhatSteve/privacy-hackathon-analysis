'use client';

/**
 * AuditHeader
 */

export function AuditHeader() {
  return (
    <header className="text-center mb-12">
      {/* Logo/Title */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Privacy Scanner
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Solana Wallet Privacy Analysis
        </p>
      </div>
      
      {/* Subtle version badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-gray-600">v1.0 • Live</span>
      </div>
    </header>
  );
}
