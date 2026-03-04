"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllCampaigns } from "@/hooks/useCampaigns";

export default function MyCampaignsPage() {
  const { address, isConnected } = useAccount();
  const { campaigns, isLoading } = useAllCampaigns();

  const mine = useMemo(() => {
    if (!address) return [];
    return campaigns.filter(
      (c) => c.creator.toLowerCase() === address.toLowerCase()
    );
  }, [campaigns, address]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Campaigns</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Campaigns you&apos;ve created
              </p>
            </div>
            <Link href="/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </div>

          {!isConnected ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                Connect your wallet to see your campaigns.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                You haven&apos;t created any campaigns yet.
              </p>
              <Link href="/create">
                <Button className="mt-4" variant="outline">
                  Create your first campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((c) => (
                <CampaignCard key={c.id.toString()} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
