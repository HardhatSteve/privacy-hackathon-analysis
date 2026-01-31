"use client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Github, ExternalLink, ScanSearch } from "lucide-react";
import React, { useRef, useState } from "react";


interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const { scrollY } = useScroll({
    // Remove target for fixed navbar - use window scroll instead
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      className={cn("fixed inset-x-0 top-0 z-[100] w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(0px)",
        width: visible ? "70%" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        minWidth: "800px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 sm:px-6 lg:px-8 py-2 lg:flex h-14",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "4px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
        visible && "bg-white/80 dark:bg-neutral-950/80",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-950",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return isOpen ? (
    <X className="w-5 h-5 text-foreground cursor-pointer" onClick={onClick} />
  ) : (
    <Menu className="w-5 h-5 text-foreground cursor-pointer" onClick={onClick} />
  );
};

export const NavbarLogo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center gap-2 px-2 py-1"
    >
      <ScanSearch className="w-5 h-5 text-cyan-500" />
      <span className="font-bold text-lg tracking-tight text-foreground">
        LeakLens
      </span>
    </Link>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "bg-white text-black shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Analysis", href: "/#analyze" },
  { name: "Learn", href: "/learn" },
] as const;

// Main Navbar component using LeakLens content
export function LeakLensNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ name, href }) => {
            const isHome = href === "/" && !href.includes("#");
            const isAnalysis = href === "/#analyze";
            const isLearn = href === "/learn";
            const active =
              (isHome && pathname === "/") ||
              (isAnalysis && pathname?.startsWith("/analysis")) ||
              (isLearn && pathname === "/learn");
            return (
              <Link
                key={name}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Source Button */}
          <a
            href="https://github.com/MatthewSullivn/LeakLens"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 hover:bg-muted/80 transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
          </a>

          {/* Encrypt Trade CTA */}
          <a
            href="https://encrypt.trade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="text-xs font-medium text-foreground uppercase tracking-wide">encrypt.trade</span>
            <ExternalLink className="w-3 h-3 text-foreground" />
          </a>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </MobileNavHeader>
        <MobileNavMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
              {NAV_LINKS.map(({ name, href }) => {
                const isHome = href === "/" && !href.includes("#");
                const isAnalysis = href === "/#analyze";
                const isLearn = href === "/learn";
                const active =
                  (isHome && pathname === "/") ||
                  (isAnalysis && pathname?.startsWith("/analysis")) ||
                  (isLearn && pathname === "/learn");
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors w-fit",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {name}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 w-fit">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Mainnet</span>
            </div>
            <a
              href="https://github.com/MatthewSullivn/LeakLens"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 hover:bg-muted/80 transition-colors w-fit"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
            </a>
            <a
              href="https://encrypt.trade"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 transition-colors w-fit"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">encrypt.trade</span>
              <ExternalLink className="w-3 h-3 text-violet-400" />
            </a>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
