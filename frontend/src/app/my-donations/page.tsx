"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import Link from "next/link";
import { Users } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">My Donations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your donation history across all campaigns
            </p>
          </div>

          {!isConnected ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                Connect your wallet to see your donation history.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                You haven&apos;t made any donations yet.
              </p>
              <Link
                href="/"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Explore campaigns to donate
              </Link>
            </div>
          ) : (
            <>
              <Card className="mb-6">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Donated
                    </p>
                    <p className="text-2xl font-bold">
                      {formatStablecoin(totalDonated)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transactions
                    </p>
                    <p className="text-2xl font-bold">{donations.length}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {donations.map((d, i) => (
                  <Link
                    key={i}
                    href={`/campaign/${d.campaignId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Campaign #{d.campaignId.toString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatStablecoin(d.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs">
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
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
