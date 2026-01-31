'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';
import {
  Shield,
  Menu,
  X,
  BarChart3,
  FileSearch,
  Trophy,
  Book,
  LayoutDashboard,
} from 'lucide-react';

const navigation = [
  { name: 'Analyze', href: '/analyze', icon: FileSearch },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, auth: true },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Docs', href: '/docs', icon: Book },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">PrivacyLens</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => {
            if (item.auth) {
              return (
                <SignedIn key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </SignedIn>
              );
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="hidden md:flex">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </SignedOut>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container space-y-1 py-4">
            {navigation.map((item) => {
              if (item.auth) {
                return (
                  <SignedIn key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </SignedIn>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            <SignedOut>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
