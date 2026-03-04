import { Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 fill-primary text-primary" />
          <span>Decentralised Donations</span>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Explore
          </Link>
          <Link
            href="/create"
            className="hover:text-foreground transition-colors"
          >
            Start Campaign
          </Link>
          <a
            href="https://sepolia.mantlescan.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Mantlescan
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Built on Mantle &middot; Fully on-chain
        </p>
      </div>
    </footer>
  );
}
