"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  PLATFORM_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
} from "@/lib/contracts";
import { formatStablecoin, truncateAddress } from "@/lib/utils";

interface DonationRecord {
  campaignId: bigint;
  token: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
}

export default function MyDonationsPage() {
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !address) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const logs = await client.getLogs({
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
          args: { donor: address },
          fromBlock: 0n,
          toBlock: "latest",
        });

        setDonations(
          logs.map((l) => ({
            campaignId: l.args.campaignId!,
            token: l.args.token!,
            amount: l.args.amount!,
            blockNumber: l.blockNumber,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch donations:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [client, address]);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0n);

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in-up">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a2e]">My Donations</h1>
            <p className="mt-2 text-base text-[#6b6b7b]">
              Your charitable impact on the Mantle network.
            </p>
          </div>

          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-[#e8e4dd]">
              <div className="mb-4 rounded-2xl bg-[#fef3e2] p-4">
                <span className="text-2xl">👛</span>
              </div>
              <p className="text-lg font-medium text-[#6b6b7b]">
                Connect your wallet to see your donation history.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 w-full rounded-xl bg-white border border-[#e8e4dd] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-[#f0ede8]" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-32 bg-[#f0ede8]" />
                       <Skeleton className="h-3 w-20 bg-[#f0ede8]" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 bg-[#f0ede8]" />
                </div>
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-[#e8e4dd] animate-fade-in-up">
              <div className="mb-4 rounded-2xl bg-[#fef3e2] p-4">
                <Users className="h-10 w-10 text-[#c2762e]/40" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1a1a2e]">No donations yet</h3>
              <p className="mb-6 max-w-sm text-base text-[#6b6b7b]">
                You haven&apos;t contributed to any campaigns yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-95"
              >
                Explore campaigns
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <Card className="mb-8 border-0 shadow-[0_8px_30px_rgba(26,26,46,0.1)] bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] text-white">
                <CardContent className="flex items-center justify-between p-8">
                  <div>
                    <p className="text-white/60 font-medium mb-1">
                      Total Donated
                    </p>
                    <p className="text-4xl font-black tracking-tight">
                      ${formatStablecoin(totalDonated)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 font-medium mb-1">
                      Transactions
                    </p>
                    <p className="text-3xl font-bold">{donations.length}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {donations.map((d, i) => (
                  <Link
                    key={i}
                    href={`/campaign/${d.campaignId}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-between rounded-xl bg-white border border-[#e8e4dd] p-5 transition-all duration-200 hover:shadow-md hover:border-[#c2762e]/30 hover:-translate-y-0.5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef3e2] text-[#c2762e] group-hover:bg-[#c2762e]/20 transition-colors">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#1a1a2e] group-hover:text-[#c2762e] transition-colors">
                            Campaign #{d.campaignId.toString()}
                          </p>
                          <p className="text-sm text-[#6b6b7b]">Donation #{i + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1a1a2e]">
                          ${formatStablecoin(d.amount)}
                        </p>
                        <Badge variant="secondary" className="mt-1 font-medium bg-[#f0ede8] text-[#6b6b7b]">
                          {d.token.toLowerCase() ===
                          USDC_ADDRESS?.toLowerCase()
                            ? "USDC"
                            : "USDT"}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
