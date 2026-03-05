import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#e8e4dd] bg-[#1a1a2e]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 overflow-hidden p-0.5">
            <Image src="/logo.png" alt="DecentDonate" width={24} height={24} className="object-contain" />
          </div>
          <span className="font-semibold text-white/90">DecentDonate</span>
        </div>

        <div className="flex gap-8 text-sm text-white/50">
          <Link href="/" className="hover:text-[#e09f3e] transition-colors">
            Explore
          </Link>
          <Link
            href="/create"
            className="hover:text-[#e09f3e] transition-colors"
          >
            Start Campaign
          </Link>
          <a
            href="https://sepolia.mantlescan.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e09f3e] transition-colors"
          >
            Mantlescan
          </a>
        </div>

        <p className="text-xs text-white/30">
          Built on Mantle &middot; Fully on-chain
        </p>
      </div>
    </footer>
  );
}
