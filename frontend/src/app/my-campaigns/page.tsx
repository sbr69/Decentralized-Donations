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
            <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <span className="text-2xl">👛</span>
              </div>
              <p className="text-lg font-medium text-slate-600">
                Connect your wallet to see your campaigns.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-2/3 rounded-lg bg-slate-100" />
                    <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
                  </div>
                  <Skeleton className="h-4 w-1/4 rounded bg-slate-100" />
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-3 w-full rounded bg-slate-100 delay-75" />
                    <Skeleton className="h-3 w-5/6 rounded bg-slate-100 delay-150" />
                  </div>
                </div>
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-fade-in-up">
              <div className="mb-4 rounded-full bg-indigo-50 p-4">
                <Plus className="h-10 w-10 text-indigo-300" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">No campaigns created</h3>
              <p className="mb-6 max-w-sm text-base text-slate-500">
                You haven&apos;t started any fundraising campaigns yet.
              </p>
              <Link href="/create">
                <Button className="shadow-md">
                  Start your first campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((c, index) => (
                <div key={c.id.toString()} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}>
                  <CampaignCard campaign={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
