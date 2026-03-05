"use client";

import Link from "next/link";
import { Clock, Star, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CATEGORIES,
  STATUS_LABELS,
  type CampaignData,
} from "@/lib/contracts";
import {
  formatStablecoin,
  getAverageRating,
  getProgress,
  timeRemaining,
} from "@/lib/utils";

interface CampaignCardProps {
  campaign: CampaignData;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = getProgress(campaign.raisedAmount, campaign.targetAmount);
  const avgRating = getAverageRating(campaign.ratingSum, campaign.ratingCount);
  const statusLabel = STATUS_LABELS[campaign.status];
  const category = CATEGORIES[campaign.categoryId] ?? "Other";

  return (
    <Link href={`/campaign/${campaign.id}`} className="block h-full group">
      <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-[#e8e4dd] bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,26,46,0.06)] hover:border-[#c2762e]/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fef3e2]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        <CardHeader className="pb-3 flex-none relative z-10 px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-[1.1rem] font-bold tracking-tight text-[#1a1a2e] group-hover:text-[#c2762e] transition-colors duration-200">
              {campaign.title || `Campaign #${campaign.id}`}
            </h3>
            <Badge
              variant={campaign.status === 0 ? "secondary" : "outline"}
              className={`shrink-0 font-semibold ${campaign.status === 0 ? "bg-[#2d6a4f]/10 text-[#2d6a4f] hover:bg-[#2d6a4f]/10" : ""}`}
            >
              {statusLabel}
            </Badge>
          </div>
          <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold tracking-wider text-[#6b6b7b] border-[#e8e4dd] mt-2">
            {category}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pb-4 flex-1 relative z-10 px-5">
          {campaign.description && (
            <p className="line-clamp-2 text-[0.9rem] text-[#6b6b7b] leading-relaxed font-medium">
              {campaign.description}
            </p>
          )}

          <div className="space-y-2 mt-auto">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-[#6b6b7b] uppercase tracking-widest">Raised</span>
              <div className="text-right">
                <span className="text-base font-bold text-[#1a1a2e]">
                  ${formatStablecoin(campaign.raisedAmount)}
                </span>
                <span className="text-sm font-medium text-[#6b6b7b]/60">
                  {" "}/ ${formatStablecoin(campaign.targetAmount)}
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 bg-[#f0ede8]" indicatorClassName="bg-gradient-to-r from-[#c2762e] to-[#e09f3e]" />
          </div>
        </CardContent>

        <CardFooter className="gap-4 border-t border-[#e8e4dd]/50 bg-[#f5f3ef]/50 px-5 py-3 relative z-10 text-xs font-semibold text-[#6b6b7b]">
          <span className="flex items-center gap-1.5 hover:text-[#1a1a2e] transition-colors">
            <Users className="h-4 w-4" />
            {campaign.donorCount}
          </span>
          {avgRating > 0 && (
            <span className="flex items-center gap-1.5 text-[#e09f3e]">
              <Star className="h-4 w-4 fill-[#e09f3e]" />
              {avgRating.toFixed(1)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-[#0077b6]">
            <Clock className="h-4 w-4" />
            {timeRemaining(campaign.deadline)}
          </span>
        </CardFooter>
      </div>
    </Link>
  );
}
