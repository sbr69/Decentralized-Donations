"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ERC20_ABI,
  PLATFORM_ABI,
  PLATFORM_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
} from "@/lib/contracts";

interface DonateModalProps {
  campaignId: bigint;
  children: React.ReactNode;
  onSuccess?: () => void;
}

type Step = "input" | "approving" | "donating" | "done";

export function DonateModal({
  campaignId,
  children,
  onSuccess,
}: DonateModalProps) {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"usdc" | "usdt">("usdc");
  const [step, setStep] = useState<Step>("input");

  const tokenAddress = token === "usdc" ? USDC_ADDRESS : USDT_ADDRESS;
  const parsedAmount = amount ? parseUnits(amount, 6) : 0n;

  const {
    writeContract: approve,
    data: approveTx,
    isPending: approveLoading,
  } = useWriteContract();

  const { isLoading: approveConfirming } = useWaitForTransactionReceipt({
    hash: approveTx,
    query: {
      enabled: !!approveTx,
    },
  });

  const {
    writeContract: donate,
    data: donateTx,
    isPending: donateLoading,
  } = useWriteContract();

  const { isLoading: donateConfirming, isSuccess: donateSuccess } =
    useWaitForTransactionReceipt({
      hash: donateTx,
      query: {
        enabled: !!donateTx,
      },
    });

  const handleApprove = () => {
    if (!parsedAmount || !address) return;
    setStep("approving");
    approve(
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PLATFORM_ADDRESS, parsedAmount],
      },
      {
        onSuccess: () => {
          handleDonate();
        },
        onError: () => setStep("input"),
      }
    );
  };

  const handleDonate = () => {
    if (!parsedAmount) return;
    setStep("donating");
    donate(
      {
        address: PLATFORM_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: "donate",
        args: [campaignId, tokenAddress, BigInt(parsedAmount)],
      },
      {
        onSuccess: () => {
          setStep("done");
          onSuccess?.();
        },
        onError: () => setStep("input"),
      }
    );
  };

  const busy =
    approveLoading || approveConfirming || donateLoading || donateConfirming;

  const reset = () => {
    setAmount("");
    setStep("input");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Donation</DialogTitle>
          <DialogDescription>
            Choose a stablecoin and enter the amount you&apos;d like to donate.
          </DialogDescription>
        </DialogHeader>

        {donateSuccess || step === "done" ? (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-green-600">
              Donation successful!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thank you for your contribution.
            </p>
            <Button className="mt-4" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Select
                value={token}
                onValueChange={(v) => setToken(v as "usdc" | "usdt")}
              >
                <SelectTrigger id="token">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usdc">USDC</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={!amount || Number(amount) <= 0 || busy || !address}
              onClick={handleApprove}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === "approving" ? "Approving..." : "Donating..."}
                </>
              ) : (
                "Approve & Donate"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
