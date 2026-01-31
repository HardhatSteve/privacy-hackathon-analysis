import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-zinc-400 mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-black font-medium hover:bg-accent/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
