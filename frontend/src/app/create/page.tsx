"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
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
    <div className="bg-slate-50/50">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in-up">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
          >
            <div className="rounded-full bg-white p-1.5 shadow-sm border border-slate-100 group-hover:border-primary/20">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to campaigns
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Start a Campaign</h1>
            <p className="mt-3 text-lg text-slate-500">
              Describe your cause, set a goal, and upload proof of need. All
              data is stored securely on-chain and on IPFS.
            </p>
          </div>

          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Campaign Title</Label>
                  <Input
                    id="title"
                    required
                    maxLength={100}
                    className="h-11 bg-white"
                    placeholder="e.g., Medical treatment fund"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    maxLength={500}
                    className="resize-none bg-white p-4"
                    placeholder="Explain why you need funding and how the money will be used..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <p className="text-xs font-medium text-slate-400">
                      {description.length}/500
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target" className="text-sm font-semibold text-slate-700">Goal Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                      <Input
                        id="target"
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        className="pl-7 h-11 bg-white"
                        placeholder="1000"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Duration</Label>
                    <Select
                      value={durationDays}
                      onValueChange={setDurationDays}
                    >
                      <SelectTrigger id="duration" className="h-11 bg-white">
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
                  <Label htmlFor="category" className="text-sm font-semibold text-slate-700">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" className="h-11 bg-white">
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

                <div className="space-y-3 pt-2">
                  <Label htmlFor="proof" className="text-sm font-semibold text-slate-700">Supporting Document (optional)</Label>
                  <div className="flex flex-col items-start gap-3">
                    <label
                      htmlFor="proof"
                      className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-sm text-slate-500 transition-all hover:border-primary/50 hover:bg-primary/5"
                    >
                      <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium mt-2">
                        {proofFile ? <span className="text-primary">{proofFile.name}</span> : "Click to upload file to IPFS"}
                      </span>
                      <span className="text-xs text-slate-400">PDF, DOC, DOCX, or Images up to 10MB</span>
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
                  <p className="text-xs text-slate-500 mt-2">
                    Medical reports, invoices, or other proof — pinned directly on IPFS for
                    maximum transparency.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    {(error as Error).message || "Transaction failed"}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20"
                    disabled={!isConnected || busy || !title || !target}
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {uploading
                          ? "Pinning to IPFS..."
                          : confirming
                          ? "Waiting for confirmation..."
                          : "Please sign in wallet..."}
                      </span>
                    ) : !isConnected ? (
                      "Connect wallet to create"
                    ) : (
                      "Target Set: Create on Chain"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
