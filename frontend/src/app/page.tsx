"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllCampaigns } from "@/hooks/useCampaigns";
import { CATEGORIES } from "@/lib/contracts";

export default function HomePage() {
  const { campaigns, isLoading } = useAllCampaigns();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let result = [...campaigns];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      const idx = CATEGORIES.indexOf(category as (typeof CATEGORIES)[number]);
      if (idx >= 0) result = result.filter((c) => c.categoryId === idx);
    }

    switch (sort) {
      case "newest":
        result.sort((a, b) => Number(b.id - a.id));
        break;
      case "ending":
        result.sort((a, b) => a.deadline - b.deadline);
        break;
      case "funded":
        result.sort((a, b) => Number(b.raisedAmount - a.raisedAmount));
        break;
      case "rating":
        result.sort((a, b) => {
          const aR =
            a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
          const bR =
            b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0;
          return bR - aR;
        });
        break;
    }

    return result;
  }, [campaigns, search, category, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-28 lg:py-32">
          {/* Subtle animated background elements */}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply transition-opacity duration-1000">
            <div className="absolute -left-[10%] -top-[10%] h-[50vh] w-[50vw] rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 blur-[100px]" />
            <div className="absolute -right-[10%] bottom-[10%] h-[40vh] w-[40vw] rounded-full bg-gradient-to-tl from-purple-100 to-transparent blur-[80px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm mb-6 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Now live on Mantle Sepolia
            </div>
            
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-7xl xl:text-[5rem] xl:leading-[1.1] max-w-5xl">
              Fund what matters,{" "}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600 pb-2">
                transparently.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl leading-relaxed font-medium">
              Decentralised fundraising built for trust. Every donation, rating, and
              report lives permanently on-chain — no middlemen, no hidden fees.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
                <SelectItem value="funded">Most Funded</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Campaign Grid */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-2/3 rounded-lg bg-gray-100" />
                    <Skeleton className="h-5 w-16 rounded-full bg-gray-100" />
                  </div>
                  <Skeleton className="h-4 w-1/4 rounded bg-gray-100" />
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-3 w-full rounded bg-gray-100 delay-75" />
                    <Skeleton className="h-3 w-5/6 rounded bg-gray-100 delay-150" />
                  </div>
                  <div className="pt-4">
                    <Skeleton className="h-2 w-full rounded-full bg-gray-100" />
                    <div className="mt-2 flex justify-between">
                      <Skeleton className="h-3 w-12 rounded bg-gray-100 delay-75" />
                      <Skeleton className="h-3 w-12 rounded bg-gray-100 delay-150" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 shadow-inner">
              <div className="mb-4 rounded-full bg-indigo-50 p-4">
                <Search className="h-10 w-10 text-indigo-300" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">No campaigns found</h3>
              <p className="max-w-sm text-base text-gray-500">
                {campaigns.length === 0
                  ? "Be the first to start a fundraising revolution."
                  : "We couldn't find anything matching your filters. Try adjusting them."}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((campaign, index) => (
                <div key={Number(campaign.id)} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}>
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
