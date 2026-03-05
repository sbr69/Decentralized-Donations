"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
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
    <>
        {/* Hero */}
        <section className="relative overflow-hidden w-full border-b border-[#e8e4dd] bg-[#faf9f7] py-24 sm:py-32">
          {/* Warm grain texture */}
          <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noise)%27/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}></div>
          
          {/* Warm ambient orbs */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-15%] left-[15%] w-[35rem] h-[35rem] bg-[#c2762e]/[0.06] rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[10%] w-[25rem] h-[25rem] bg-[#7b2cbf]/[0.04] rounded-full blur-[100px]" />
            <div className="absolute top-[30%] right-[25%] w-[18rem] h-[18rem] bg-[#0077b6]/[0.03] rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c2762e]/20 bg-[#fef3e2]/60 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-[#92400e] shadow-sm mb-8 animate-fade-in-up hover:scale-105 transition-transform duration-300 cursor-default tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c2762e] opacity-60"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c2762e]"></span>
              </span>
              Live on Mantle
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[1.05] mx-auto max-w-4xl [text-wrap:balance]">
              Where giving meets{" "}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#c2762e] via-[#e09f3e] to-[#a0522d]">
                 accountability
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-[#6b6b7b] font-medium leading-relaxed">
              A decentralized engine for charitable giving. No middlemen. Every dollar tracked. Backed entirely by code.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
               <Link href="/create" className="rounded-full bg-gradient-to-r from-[#c2762e] to-[#a0522d] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(194,118,46,0.3)] hover:shadow-[0_12px_28px_rgba(194,118,46,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                 Start a Campaign
               </Link>
               <Link href="#explore" className="rounded-full border-2 border-[#1a1a2e] bg-transparent px-8 py-3.5 text-sm font-semibold text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                 Explore Causes
               </Link>
            </div>
          </div>
        </section>

        {/* Filters Area - Minimalist */}
        <section id="explore" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-[#e8e4dd]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#1a1a2e]">Active Campaigns</h2>
            <div className="h-6 w-[1px] bg-[#e8e4dd] hidden sm:block"></div>
            <p className="text-sm font-medium text-[#6b6b7b] hidden sm:block">Explore transparent funds</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b7b] group-focus-within:text-[#c2762e] transition-colors" />
              <Input
                placeholder="Search..."
                className="pl-9 h-10 w-full sm:w-64 rounded-full border-[#e8e4dd] bg-white focus-visible:ring-[#c2762e]/20 shadow-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44 rounded-full border-[#e8e4dd] bg-white h-10 font-medium">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-[#6b6b7b]" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e8e4dd] shadow-xl bg-white">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44 rounded-full border-[#e8e4dd] bg-white h-10 font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e8e4dd] shadow-xl bg-white">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
                <SelectItem value="funded">Most Funded</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Campaign Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-4 rounded-2xl border border-[#e8e4dd] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-2/3 rounded-lg bg-[#f0ede8]" />
                    <Skeleton className="h-5 w-16 rounded-full bg-[#f0ede8]" />
                  </div>
                  <Skeleton className="h-4 w-1/4 rounded bg-[#f0ede8]" />
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-3 w-full rounded bg-[#f0ede8] delay-75" />
                    <Skeleton className="h-3 w-5/6 rounded bg-[#f0ede8] delay-150" />
                  </div>
                  <div className="pt-4">
                    <Skeleton className="h-2 w-full rounded-full bg-[#f0ede8]" />
                    <div className="mt-2 flex justify-between">
                      <Skeleton className="h-3 w-12 rounded bg-[#f0ede8] delay-75" />
                      <Skeleton className="h-3 w-12 rounded bg-[#f0ede8] delay-150" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#fef3e2]/30 rounded-3xl border border-dashed border-[#e8e4dd]">
              <div className="mb-4 rounded-2xl bg-[#fef3e2] p-4">
                <Search className="h-10 w-10 text-[#c2762e]/40" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1a1a2e]">No campaigns found</h3>
              <p className="max-w-sm text-base text-[#6b6b7b]">
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
    </>
  );
}
