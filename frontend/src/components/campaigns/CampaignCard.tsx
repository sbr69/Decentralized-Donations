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
    <Link href={`/campaign/${campaign.id}`}>
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/30 bg-card/95 backdrop-blur">
        <CardHeader className="pb-3 flex-none">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-bold tracking-tight leading-snug group-hover:text-primary transition-colors duration-200">
              {campaign.title || `Campaign #${campaign.id}`}
            </h3>
            <Badge
              variant={campaign.status === 0 ? "default" : "secondary"}
              className="shrink-0"
            >
              {statusLabel}
            </Badge>
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            {category}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {campaign.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {campaign.description}
            </p>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raised</span>
              <span className="font-medium">
                {formatStablecoin(campaign.raisedAmount)} /{" "}
                {formatStablecoin(campaign.targetAmount)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>

        <CardFooter className="gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {campaign.donorCount}
          </span>
          {avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeRemaining(campaign.deadline)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
