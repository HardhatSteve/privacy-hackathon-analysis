"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Leva } from "leva";

const GL = dynamic(() => import("@/components/gl").then((mod) => mod.GL), {
  ssr: false,
});

// Pages that should show the animated 3D background
const PAGES_WITH_BACKGROUND = ["/", "/receive", "/withdraw", "/pay", "/dashboard"];

export function GLBackground() {
  const pathname = usePathname();

  // Check if current page should show the background
  // Use startsWith for /pay/[id] routes
  const shouldShowBackground = PAGES_WITH_BACKGROUND.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  // Don't render Three.js on docs pages for better performance
  if (!shouldShowBackground) {
    return null;
  }

  return (
    <>
      <Leva hidden />
      <GL hovering={false} />
    </>
  );
}
