import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, type PublicClient } from "viem";

const BLOCK_RANGE = 9_999n;
const DEPLOY_BLOCK = 35_581_900n;

// mantle sepolia limits eth_getLogs to 10k blocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLogsChunked(client: PublicClient, params: any): Promise<any[]> {
  const latest = await client.getBlockNumber();
  const allLogs: unknown[] = [];

  for (let from = DEPLOY_BLOCK; from <= latest; from += BLOCK_RANGE + 1n) {
    const to = from + BLOCK_RANGE > latest ? latest : from + BLOCK_RANGE;
    const logs = await client.getLogs({ ...params, fromBlock: from, toBlock: to });
    allLogs.push(...logs);
  }
  return allLogs;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStablecoin(amount: bigint): string {
  const num = Number(formatUnits(amount, 6));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function truncateAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function getIpfsUrl(cid: string): string {
  if (!cid) return "";
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  return `https://${gateway}/ipfs/${cid}`;
}

export function getProgress(raised: bigint, target: bigint): number {
  if (target === 0n) return 0;
  const pct = Number((raised * 10000n) / target) / 100;
  return Math.min(pct, 100);
}

export function getAverageRating(sum: number, count: number): number {
  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

export function isDeadlinePassed(deadline: number): boolean {
  return Date.now() / 1000 >= deadline;
}

export function timeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadline - now;
  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
