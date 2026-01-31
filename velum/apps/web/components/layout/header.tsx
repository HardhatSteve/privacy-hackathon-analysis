"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { WalletButton } from "@/components/features";
import { cn } from "@/lib/utils/cn";

export function Header() {
  const pathname = usePathname();
  const isDocsPage = pathname.startsWith("/docs");

  const navItems = [
    { name: "Receive", href: "/receive" },
    { name: "Withdraw", href: "/withdraw" },
    { name: "Docs", href: "/docs" },
  ];

  const logoHref = "/dashboard";

  // Simplified header for docs pages - no wallet button, just mobile menu
  if (isDocsPage) {
    return (
      <div className="fixed z-50 pt-8 md:pt-14 top-0 right-0">
        <header className="px-6">
          <MobileMenu />
        </header>
      </div>
    );
  }

  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container mx-auto px-6">
        <Link href={logoHref} className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "uppercase inline-block font-mono duration-150 transition-colors ease-out",
                pathname === item.href
                  ? "text-primary"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="max-lg:hidden">
          <WalletButton />
        </div>

        <MobileMenu />
      </header>
    </div>
  );
}
