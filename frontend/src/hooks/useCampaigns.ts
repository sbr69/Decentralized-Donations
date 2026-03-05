"use client";

import { useReadContract } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import {
  PLATFORM_ABI,
  PLATFORM_ADDRESS,
  type CampaignData,
} from "@/lib/contracts";
import { getLogsChunked } from "@/lib/utils";

export function useCampaign(campaignId: bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "getCampaign",
    args: [campaignId],
  });

  const client = usePublicClient();
  const [meta, setMeta] = useState<{
    title: string;
    description: string;
    proofCID: string;
  } | null>(null);

  useEffect(() => {
    if (!client) return;
    (async () => {
      try {
        const logs = await getLogsChunked(client, {
          address: PLATFORM_ADDRESS,
          event: {
            type: "event",
            name: "CampaignCreated",
            inputs: [
              { name: "campaignId", type: "uint256", indexed: true },
              { name: "creator", type: "address", indexed: true },
              { name: "targetAmount", type: "uint128", indexed: false },
              { name: "deadline", type: "uint40", indexed: false },
              { name: "proofCID", type: "string", indexed: false },
              { name: "title", type: "string", indexed: false },
              { name: "description", type: "string", indexed: false },
              { name: "categoryId", type: "uint8", indexed: false },
            ],
          } as const,
          args: { campaignId },
        });

        if (logs.length > 0) {
          const args = logs[0].args;
          setMeta({
            title: args.title ?? "",
            description: args.description ?? "",
            proofCID: args.proofCID ?? "",
          });
        }
      } catch {
        // ignore
      }
    })();
  }, [client, campaignId]);

  const campaign: CampaignData | null = data
    ? {
        id: campaignId,
        creator: data[0],
        deadline: Number(data[1]),
        status: data[2] as 0 | 1 | 2 | 3,
        earlyWithdrawRequested: data[3],
        targetAmount: data[4],
        raisedAmount: data[5],
        ratingSum: Number(data[6]),
        ratingCount: Number(data[7]),
        donorCount: Number(data[8]),
        fraudReportCount: Number(data[9]),
        earlyWithdrawApprovals: Number(data[10]),
        categoryId: Number(data[11]),
        title: meta?.title,
        description: meta?.description,
        proofCID: meta?.proofCID,
      }
    : null;

  return { campaign, isLoading, refetch };
}

export function useCampaignCount() {
  return useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "campaignCount",
  });
}

export function useAllCampaigns() {
  const { data: count, isLoading: countLoading } = useCampaignCount();
  const client = usePublicClient();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!client || count === undefined) return;
    setLoading(true);

    const total = Number(count);
    if (total === 0) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    try {
      let metaMap = new Map<
        string,
        { title: string; description: string; proofCID: string }
      >();

      try {
        const logs = await getLogsChunked(client, {
          address: PLATFORM_ADDRESS,
          event: {
            type: "event",
            name: "CampaignCreated",
            inputs: [
              { name: "campaignId", type: "uint256", indexed: true },
              { name: "creator", type: "address", indexed: true },
              { name: "targetAmount", type: "uint128", indexed: false },
              { name: "deadline", type: "uint40", indexed: false },
              { name: "proofCID", type: "string", indexed: false },
              { name: "title", type: "string", indexed: false },
              { name: "description", type: "string", indexed: false },
              { name: "categoryId", type: "uint8", indexed: false },
            ],
          } as const,
        });

        for (const log of logs) {
          const id = log.args.campaignId?.toString() ?? "";
          metaMap.set(id, {
            title: log.args.title ?? "",
            description: log.args.description ?? "",
            proofCID: log.args.proofCID ?? "",
          });
        }
      } catch {
        // ignore
      }

      const calls = Array.from({ length: total }, (_, i) => ({
        address: PLATFORM_ADDRESS as `0x${string}`,
        abi: PLATFORM_ABI,
        functionName: "getCampaign" as const,
        args: [BigInt(i + 1)] as const,
      }));

      const results = await client.multicall({ contracts: calls });

      const items: CampaignData[] = results
        .map((res, i) => {
          if (res.status !== "success" || !res.result) return null;
          const d = res.result as readonly [
            `0x${string}`,
            number,
            number,
            boolean,
            bigint,
            bigint,
            number,
            number,
            number,
            number,
            number,
            number,
          ];
          const id = BigInt(i + 1);
          const meta = metaMap.get(id.toString());
          return {
            id,
            creator: d[0],
            deadline: Number(d[1]),
            status: d[2] as 0 | 1 | 2 | 3,
            earlyWithdrawRequested: d[3],
            targetAmount: d[4],
            raisedAmount: d[5],
            ratingSum: Number(d[6]),
            ratingCount: Number(d[7]),
            donorCount: Number(d[8]),
            fraudReportCount: Number(d[9]),
            earlyWithdrawApprovals: Number(d[10]),
            categoryId: Number(d[11]),
            title: meta?.title,
            description: meta?.description,
            proofCID: meta?.proofCID,
          } satisfies CampaignData;
        })
        .filter(Boolean) as CampaignData[];

      setCampaigns(items.reverse());
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [client, count]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { campaigns, isLoading: countLoading || loading, refetch: fetchAll };
}

export function useCampaignUpdates(campaignId: bigint) {
  const client = usePublicClient();
  const [updates, setUpdates] = useState<
    { updateCID: string; message: string; blockNumber: bigint }[]
  >([]);

  useEffect(() => {
    if (!client) return;
    (async () => {
      try {
        const logs = await getLogsChunked(client, {
          address: PLATFORM_ADDRESS,
          event: {
            type: "event",
            name: "CampaignUpdate",
            inputs: [
              { name: "campaignId", type: "uint256", indexed: true },
              { name: "updateCID", type: "string", indexed: false },
              { name: "message", type: "string", indexed: false },
            ],
          } as const,
          args: { campaignId },
        });
        setUpdates(
          logs.map((l) => ({
            updateCID: l.args.updateCID ?? "",
            message: l.args.message ?? "",
            blockNumber: l.blockNumber,
          }))
        );
      } catch {
        // ignore
      }
    })();
  }, [client, campaignId]);

  return updates;
}

export function useCampaignDonations(campaignId: bigint) {
  const client = usePublicClient();
  const [donations, setDonations] = useState<
    {
      donor: `0x${string}`;
      token: `0x${string}`;
      amount: bigint;
      blockNumber: bigint;
    }[]
  >([]);

  useEffect(() => {
    if (!client) return;
    (async () => {
      try {
        const logs = await getLogsChunked(client, {
          address: PLATFORM_ADDRESS,
          event: {
            type: "event",
            name: "DonationReceived",
            inputs: [
              { name: "campaignId", type: "uint256", indexed: true },
              { name: "donor", type: "address", indexed: true },
              { name: "token", type: "address", indexed: true },
              { name: "amount", type: "uint128", indexed: false },
            ],
          } as const,
          args: { campaignId },
        });
        setDonations(
          logs.map((l) => ({
            donor: l.args.donor!,
            token: l.args.token!,
            amount: l.args.amount!,
            blockNumber: l.blockNumber,
          }))
        );
      } catch {
        // ignore
      }
    })();
  }, [client, campaignId]);

  return donations;
}
