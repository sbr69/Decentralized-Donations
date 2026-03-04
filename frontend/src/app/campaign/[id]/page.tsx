"use client";

import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Star,
  ThumbsUp,
  MessageSquare,
  FileText,
  Users,
  Clock,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DonateModal } from "@/components/campaigns/DonateModal";
import { StarRating } from "@/components/campaigns/StarRating";
import { CountdownTimer } from "@/components/campaigns/CountdownTimer";
import { CategoryBadge } from "@/components/campaigns/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  useCampaign,
  useCampaignUpdates,
  useCampaignDonations,
} from "@/hooks/useCampaigns";
import {
  useRateCampaign,
  useReportFraud,
  useWithdrawFunds,
  useClaimRefund,
  useRequestEarlyWithdraw,
  useApproveEarlyWithdraw,
  useExecuteEarlyWithdraw,
  usePostUpdate,
} from "@/hooks/useContractActions";
import {
  PLATFORM_ABI,
  PLATFORM_ADDRESS,
  STATUS_LABELS,
  USDC_ADDRESS,
  USDT_ADDRESS,
} from "@/lib/contracts";
import {
  formatStablecoin,
  getAverageRating,
  getIpfsUrl,
  getProgress,
  isDeadlinePassed,
  truncateAddress,
} from "@/lib/utils";
import { uploadToPinata } from "@/lib/pinata";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = BigInt(params.id as string);
  const { address } = useAccount();

  const { campaign, isLoading, refetch } = useCampaign(campaignId);
  const updates = useCampaignUpdates(campaignId);
  const donations = useCampaignDonations(campaignId);

  const { data: isDonor } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "isDonor",
    args: [campaignId, address!],
    query: { enabled: !!address },
  });

  const { data: hasRated } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "hasRated",
    args: [campaignId, address!],
    query: { enabled: !!address },
  });

  const { data: hasReported } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "hasReported",
    args: [campaignId, address!],
    query: { enabled: !!address },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <Header />
        <main className="mx-auto max-w-5xl flex-1 px-4 py-12 sm:px-6 w-full animate-pulse">
          <Skeleton className="mb-4 h-10 w-2/3 max-w-lg rounded-xl bg-slate-200" />
          <Skeleton className="mb-10 h-6 w-1/3 max-w-md rounded-lg bg-slate-200" />
          <Skeleton className="h-96 w-full rounded-2xl bg-slate-200" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full">
            <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Campaign not found</h2>
            <p className="text-slate-500 mb-6">This campaign might have been removed or doesn&apos;t exist.</p>
            <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-95">Go back home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const progress = getProgress(campaign.raisedAmount, campaign.targetAmount);
  const avgRating = getAverageRating(campaign.ratingSum, campaign.ratingCount);
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const isActive = campaign.status === 0;
  const expired = isDeadlinePassed(campaign.deadline);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header />

      <main className="mx-auto max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8 w-full animate-fade-in-up">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All campaigns
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {campaign.title || `Campaign #${campaign.id}`}
            </h1>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="mt-1"
            >
              {STATUS_LABELS[campaign.status]}
            </Badge>
            <CategoryBadge categoryId={campaign.categoryId} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            by{" "}
            <a
              href={`https://sepolia.mantlescan.xyz/address/${campaign.creator}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary"
            >
              {truncateAddress(campaign.creator)}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {campaign.description || "No description provided."}
                </p>
                {campaign.proofCID && (
                  <a
                    href={getIpfsUrl(campaign.proofCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View supporting document
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Updates, Donations, Report */}
            <Tabs defaultValue="updates">
              <TabsList>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="donations">
                  Donors ({campaign.donorCount})
                </TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
              </TabsList>

              <TabsContent value="updates" className="space-y-4">
                {isCreator && isActive && (
                  <PostUpdateForm
                    campaignId={campaignId}
                    onSuccess={refetch}
                  />
                )}
                {updates.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No updates yet.
                  </p>
                ) : (
                  updates.map((u, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <p className="text-sm">{u.message}</p>
                        {u.updateCID && (
                          <a
                            href={getIpfsUrl(u.updateCID)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            Attachment
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="donations">
                {donations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No donations yet. Be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {donations.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`https://sepolia.mantlescan.xyz/address/${d.donor}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary"
                          >
                            {truncateAddress(d.donor)}
                          </a>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-medium">
                            {formatStablecoin(d.amount)}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {d.token.toLowerCase() ===
                            USDC_ADDRESS?.toLowerCase()
                              ? "USDC"
                              : "USDT"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="report">
                <ReportFraudForm
                  campaignId={campaignId}
                  disabled={!isDonor || !!hasReported || !isActive}
                  onSuccess={refetch}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Funding progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formatStablecoin(campaign.raisedAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        raised of {formatStablecoin(campaign.targetAmount)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2.5" />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {campaign.donorCount} donors
                    </span>
                    <CountdownTimer deadline={campaign.deadline} />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Rating display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1.5">
                    <StarRating value={Math.round(avgRating)} readonly />
                    <span className="text-sm font-medium">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({campaign.ratingCount})
                    </span>
                  </div>
                </div>

                {campaign.fraudReportCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    {campaign.fraudReportCount} fraud report
                    {campaign.fraudReportCount > 1 ? "s" : ""}
                  </div>
                )}

                <Separator className="my-4" />

                {/* Actions */}
                <div className="space-y-2">
                  {isActive && !isCreator && (
                    <DonateModal
                      campaignId={campaignId}
                      onSuccess={refetch}
                    >
                      <Button className="w-full">Donate</Button>
                    </DonateModal>
                  )}

                  {isDonor && !hasRated && isActive && (
                    <RateSection
                      campaignId={campaignId}
                      onSuccess={refetch}
                    />
                  )}

                  {isCreator && <CreatorActions campaign={campaign} onRefresh={refetch} />}

                  {campaign.status === 2 && isDonor && (
                    <ClaimRefundButton
                      campaignId={campaignId}
                      onSuccess={refetch}
                    />
                  )}

                  {isDonor &&
                    campaign.earlyWithdrawRequested && (
                      <ApproveEarlyWithdrawButton
                        campaignId={campaignId}
                        onSuccess={refetch}
                      />
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function RateSection({
  campaignId,
  onSuccess,
}: {
  campaignId: bigint;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const { rate, isPending, confirming, isSuccess } = useRateCampaign();

  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Rate this campaign</p>
      <p className="text-xs text-muted-foreground">
        How necessary is this cause?
      </p>
      <StarRating value={rating} onChange={setRating} />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={rating === 0 || isPending || confirming}
        onClick={() => rate(campaignId, rating)}
      >
        {isPending || confirming ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Star className="mr-2 h-4 w-4" />
        )}
        Submit Rating
      </Button>
    </div>
  );
}

function CreatorActions({
  campaign,
  onRefresh,
}: {
  campaign: {
    id: bigint;
    status: number;
    earlyWithdrawRequested: boolean;
    raisedAmount: bigint;
    targetAmount: bigint;
    deadline: number;
  };
  onRefresh: () => void;
}) {
  const { withdraw, isPending: wPending, confirming: wConf, isSuccess: wDone } =
    useWithdrawFunds();
  const {
    request,
    isPending: rPending,
    confirming: rConf,
    isSuccess: rDone,
  } = useRequestEarlyWithdraw();
  const {
    execute,
    isPending: ePending,
    confirming: eConf,
    isSuccess: eDone,
  } = useExecuteEarlyWithdraw();

  useEffect(() => {
    if (wDone || rDone || eDone) onRefresh();
  }, [wDone, rDone, eDone, onRefresh]);

  const expired = isDeadlinePassed(campaign.deadline);
  const metTarget = campaign.raisedAmount >= campaign.targetAmount;
  const canWithdraw = campaign.status === 0 && expired && metTarget;
  const canRequestEarly =
    campaign.status === 0 && !expired && !campaign.earlyWithdrawRequested;

  return (
    <div className="space-y-2">
      {canWithdraw && (
        <Button
          className="w-full"
          onClick={() => withdraw(campaign.id)}
          disabled={wPending || wConf}
        >
          {wPending || wConf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Withdraw Funds
        </Button>
      )}

      {canRequestEarly && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => request(campaign.id)}
          disabled={rPending || rConf}
        >
          {rPending || rConf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Request Early Withdraw
        </Button>
      )}

      {campaign.earlyWithdrawRequested && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => execute(campaign.id)}
          disabled={ePending || eConf}
        >
          {ePending || eConf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Execute Early Withdraw
        </Button>
      )}
    </div>
  );
}

function ClaimRefundButton({
  campaignId,
  onSuccess,
}: {
  campaignId: bigint;
  onSuccess: () => void;
}) {
  const { claim, isPending, confirming, isSuccess } = useClaimRefund();

  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={() => claim(campaignId)}
      disabled={isPending || confirming}
    >
      {isPending || confirming ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Claim Refund
    </Button>
  );
}

function ApproveEarlyWithdrawButton({
  campaignId,
  onSuccess,
}: {
  campaignId: bigint;
  onSuccess: () => void;
}) {
  const { approve, isPending, confirming, isSuccess } =
    useApproveEarlyWithdraw();

  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => approve(campaignId)}
      disabled={isPending || confirming}
    >
      {isPending || confirming ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className="mr-2 h-4 w-4" />
      )}
      Approve Early Withdraw
    </Button>
  );
}

function PostUpdateForm({
  campaignId,
  onSuccess,
}: {
  campaignId: bigint;
  onSuccess: () => void;
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { post, isPending, confirming, isSuccess } = usePostUpdate();

  useEffect(() => {
    if (isSuccess) {
      setMessage("");
      setFile(null);
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const handlePost = async () => {
    let cid = "";
    if (file) {
      setUploading(true);
      cid = await uploadToPinata(file);
      setUploading(false);
    }
    post(campaignId, cid, message);
  };

  const busy = uploading || isPending || confirming;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Post an Update</CardTitle>
        <CardDescription className="text-xs">
          Keep your donors informed about progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Share a progress update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <label className="cursor-pointer text-xs text-muted-foreground hover:text-primary">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? file.name : "Attach file (optional)"}
          </label>
          <Button
            size="sm"
            disabled={!message.trim() || busy}
            onClick={handlePost}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportFraudForm({
  campaignId,
  disabled,
  onSuccess,
}: {
  campaignId: bigint;
  disabled: boolean;
  onSuccess: () => void;
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { report, isPending, confirming, isSuccess, error } = useReportFraud();

  useEffect(() => {
    if (isSuccess) {
      setMessage("");
      setFile(null);
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const handleReport = async () => {
    let cid = "";
    if (file) {
      setUploading(true);
      cid = await uploadToPinata(file);
      setUploading(false);
    }
    report(campaignId, cid, message);
  };

  const busy = uploading || isPending || confirming;

  return (
    <Card className="border-rose-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          Report Fraud
        </CardTitle>
        <CardDescription className="text-xs">
          Only donors can report. If &gt;50% of donors report, the campaign
          enters refund mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Describe why you believe this campaign is fraudulent..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-xs text-muted-foreground">
            <input
              type="file"
              className="hidden"
              disabled={disabled}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? file.name : "Attach evidence (optional)"}
          </label>
        </div>
        {error && (
          <p className="text-xs text-destructive">
            {(error as Error).message}
          </p>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={disabled || !message.trim() || busy}
          onClick={handleReport}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          Submit Report
        </Button>
        {disabled && (
          <p className="text-xs text-muted-foreground">
            {!disabled
              ? ""
              : "You must be a donor to report, or you already reported."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
