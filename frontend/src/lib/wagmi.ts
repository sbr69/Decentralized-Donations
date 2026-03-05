import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://sepolia.mantlescan.xyz" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
  testnet: true,
});

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Connect",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "Decentralised Donations",
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [mantleSepolia],
  transports: {
    [mantleSepolia.id]: http("https://rpc.sepolia.mantle.xyz"),
  },
  multiInjectedProviderDiscovery: true,
  ssr: true,
});
