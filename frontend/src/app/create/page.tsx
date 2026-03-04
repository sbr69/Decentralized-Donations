"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/contracts";
import { useCreateCampaign } from "@/hooks/useContractActions";
import { uploadToPinata } from "@/lib/pinata";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { create, isPending, confirming, isSuccess, error } =
    useCreateCampaign();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [categoryId, setCategoryId] = useState("0");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      router.push("/my-campaigns");
    }
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    try {
      let proofCID = "";
      if (proofFile) {
        setUploading(true);
        proofCID = await uploadToPinata(proofFile);
        setUploading(false);
      }

      const targetAmount = parseUnits(target, 6);
      const deadline = Math.floor(Date.now() / 1000) + Number(durationDays) * 86400;

      create(
        targetAmount,
        deadline,
        proofCID,
        title,
        description,
        Number(categoryId)
      );
    } catch (err) {
      setUploading(false);
      console.error("Campaign creation failed:", err);
    }
  };

  const busy = uploading || isPending || confirming;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Start a Campaign</CardTitle>
              <CardDescription>
                Describe your cause, set a goal, and upload proof of need. All
                data is stored on-chain and on IPFS.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    required
                    maxLength={100}
                    placeholder="Help fund my medical treatment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Explain why you need funding and how the money will be used..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target">Goal Amount (USD)</Label>
                    <Input
                      id="target"
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="1000"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={durationDays}
                      onValueChange={setDurationDays}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat, i) => (
                        <SelectItem key={cat} value={String(i)}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Supporting Document (optional)</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="proof"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Upload className="h-4 w-4" />
                      {proofFile ? proofFile.name : "Upload file to IPFS"}
                    </label>
                    <input
                      id="proof"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) =>
                        setProofFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Medical reports, invoices, or other proof — pinned on IPFS for
                    transparency.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {(error as Error).message || "Transaction failed"}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isConnected || busy || !title || !target}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading
                        ? "Uploading proof..."
                        : confirming
                        ? "Confirming..."
                        : "Creating..."}
                    </>
                  ) : !isConnected ? (
                    "Connect wallet first"
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
