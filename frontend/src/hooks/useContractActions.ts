"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { PLATFORM_ABI, PLATFORM_ADDRESS } from "@/lib/contracts";

export function useCreateCampaign() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const create = (
    targetAmount: bigint,
    deadline: number,
    proofCID: string,
    title: string,
    description: string,
    categoryId: number
  ) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "createCampaign",
      args: [targetAmount, deadline, proofCID, title, description, categoryId],
    });
  };

  return { create, isPending, confirming, isSuccess, error, hash };
}

export function useWithdrawFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const withdraw = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "withdrawFunds",
      args: [campaignId],
    });
  };

  return { withdraw, isPending, confirming, isSuccess, error };
}

export function useRateCampaign() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const rate = (campaignId: bigint, rating: number) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "rateCampaign",
      args: [campaignId, rating],
    });
  };

  return { rate, isPending, confirming, isSuccess, error };
}

export function useReportFraud() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const report = (campaignId: bigint, proofCID: string, message: string) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "reportFraud",
      args: [campaignId, proofCID, message],
    });
  };

  return { report, isPending, confirming, isSuccess, error };
}

export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const claim = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "claimRefund",
      args: [campaignId],
    });
  };

  return { claim, isPending, confirming, isSuccess, error };
}

export function useRequestEarlyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const request = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "requestEarlyWithdraw",
      args: [campaignId],
    });
  };

  return { request, isPending, confirming, isSuccess, error };
}

export function useApproveEarlyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const approve = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "approveEarlyWithdraw",
      args: [campaignId],
    });
  };

  return { approve, isPending, confirming, isSuccess, error };
}

export function useExecuteEarlyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const execute = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "executeEarlyWithdraw",
      args: [campaignId],
    });
  };

  return { execute, isPending, confirming, isSuccess, error };
}

export function usePostUpdate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const post = (campaignId: bigint, updateCID: string, message: string) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "postUpdate",
      args: [campaignId, updateCID, message],
    });
  };

  return { post, isPending, confirming, isSuccess, error };
}

export function useExpireCampaign() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const expire = (campaignId: bigint) => {
    writeContract({
      address: PLATFORM_ADDRESS,
      abi: PLATFORM_ABI,
      functionName: "expireCampaign",
      args: [campaignId],
    });
  };

  return { expire, isPending, confirming, isSuccess, error };
}
