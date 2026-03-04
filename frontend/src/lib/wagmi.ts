import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { type Chain } from "viem";
import { http } from "wagmi";

export const mantleSepolia: Chain = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: "Decentralised Donations",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [mantleSepolia],
  transports: {
    [mantleSepolia.id]: http("https://rpc.sepolia.mantle.xyz"),
  },
  ssr: true,
});
