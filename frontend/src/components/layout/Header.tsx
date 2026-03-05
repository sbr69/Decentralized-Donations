"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X, Wallet, ChevronDown, Power } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Explore" },
  { href: "/create", label: "Start Campaign" },
  { href: "/my-campaigns", label: "My Campaigns" },
  { href: "/my-donations", label: "My Donations" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e8e4dd]/80 bg-[#faf9f7]/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_3px_rgb(0,0,0,0.03)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#e8e4dd] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-[#c2762e]/30 overflow-hidden p-1">
            <Image
              src="/logo.png"
              alt="DecentDonate logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1a1a2e] hidden sm:block">
            DecentDonate
          </span>
        </Link>

        <nav className="hidden items-center md:flex bg-[#f0ede8]/60 p-1 rounded-full border border-[#e8e4dd]/60 gap-0.5">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-white text-[#1a1a2e] shadow-sm border border-[#e8e4dd]/60"
                    : "text-[#6b6b7b] hover:text-[#1a1a2e] hover:bg-[#e8e4dd]/30"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <div
                  {...(!mounted && {
                    'aria-hidden': true,
                    style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                  })}
                >
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c2762e] to-[#a0522d] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#c2762e]/20 transition-all hover:shadow-lg hover:shadow-[#c2762e]/30 hover:-translate-y-0.5 active:scale-[0.97]"
                    >
                      <Wallet className="h-4 w-4" />
                      Connect
                    </button>
                  ) : chain.unsupported ? (
                    <button
                      onClick={openChainModal}
                      className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-all hover:bg-red-100"
                    >
                      Wrong network
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={openChainModal}
                        className="flex items-center gap-1.5 rounded-full border border-[#e8e4dd] bg-white px-3 py-2 text-sm font-medium text-[#1a1a2e] transition-all hover:border-[#c2762e]/30 hover:bg-[#fef3e2]/50"
                      >
                        {chain.hasIcon && chain.iconUrl && (
                          <img src={chain.iconUrl} alt={chain.name ?? ''} className="h-4 w-4 rounded-full" />
                        )}
                        <ChevronDown className="h-3 w-3 text-[#6b6b7b]" />
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="flex items-center gap-2 rounded-full border border-[#e8e4dd] bg-white pl-3 pr-2 py-1.5 text-sm font-semibold text-[#1a1a2e] transition-all hover:border-[#c2762e]/30 hover:bg-[#fef3e2]/50"
                      >
                        {account.displayName}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#c2762e] to-[#e09f3e]">
                          <Power className="h-3.5 w-3.5 text-white" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-8 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                      pathname === link.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
