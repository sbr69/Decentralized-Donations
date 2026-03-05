# Decentralised Donations

A fully on-chain crowdfunding platform built on **Mantle Sepolia**. Campaigns accept USDC and USDT stablecoins. Every donation, rating, fraud report, and withdrawal is recorded transparently on-chain — no middlemen, no hidden fees.

Donors earn ERC-1155 NFT badges for each campaign they support, can rate campaigns 1–5 stars, and report fraud. If >50% of donors flag a campaign, it enters refund mode automatically.

## Features

**Campaign Management**
- Create campaigns with a target amount, deadline, title, description, category, and supporting documents (pinned to IPFS)
- 8 categories: Medical, Education, Disaster Relief, Community, Environment, Technology, Creative, Other
- Post progress updates with optional file attachments
- Campaign statuses: Active → Closed / Refunding / Expired

**Donations & Badges**
- Donate USDC or USDT to any active campaign
- ERC-1155 NFT badge minted on first donation to each campaign
- Minimum donation: 1 USDC/USDT

**Trust & Accountability**
- Donors rate campaigns 1–5 stars (one rating per donor per campaign)
- Fraud reporting with evidence upload — if >50% of donors report, the campaign enters refund mode
- Refund claiming available when campaign is in Refunding or Expired state

**Withdrawal System**
- Creator can withdraw after deadline if the target is met (7-day grace window)
- Early withdrawal requires **unanimous** donor approval
- Fraud-majority campaigns are blocked from withdrawal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, Foundry |
| Frontend | Next.js 16, React 19, TypeScript |
| Web3 | wagmi v3, viem, RainbowKit |
| Styling | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Storage | IPFS via Pinata |
| Notifications | Sonner toast notifications |
| Network | Mantle Sepolia (Chain ID: 5003) |

## Project Structure

```
├── contracts/
│   ├── src/
│   │   ├── DonationPlatform.sol    # Core platform logic
│   │   ├── DonorBadge.sol          # ERC-1155 NFT badges
│   │   ├── MockUSDC.sol            # Test mock
│   │   └── MockUSDT.sol            # Test mock
│   ├── test/
│   │   ├── DonationPlatform.t.sol  # Platform tests
│   │   ├── DonorBadge.t.sol        # Badge tests
│   │   └── Invariants.t.sol        # Invariant tests
│   └── script/
│       ├── Deploy.s.sol            # Mainnet deployment
│       └── DeployMocks.s.sol       # Mock token deployment
│
└── frontend/
    └── src/
        ├── app/                    # Next.js pages (App Router)
        │   ├── page.tsx            # Home — browse campaigns
        │   ├── create/             # Create new campaign
        │   ├── campaign/[id]/      # Campaign detail view
        │   ├── my-campaigns/       # Creator dashboard
        │   └── my-donations/       # Donor history
        ├── components/
        │   ├── campaigns/          # CampaignCard, DonateModal, StarRating, etc.
        │   ├── layout/             # Header, Footer
        │   └── ui/                 # shadcn/ui primitives
        ├── hooks/                  # useCampaigns, useContractActions
        └── lib/                    # wagmi config, ABIs, utils, Pinata
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Foundry](https://getfoundry.sh/) (forge, cast, anvil)
- A wallet with Mantle Sepolia MNT for gas

### Contracts

```bash
cd contracts

# Install dependencies
forge install

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Deploy mocks (local/testnet)
forge script script/DeployMocks.s.sol --broadcast --rpc-url mantle_sepolia

# Deploy platform
forge script script/Deploy.s.sol --broadcast --rpc-url mantle_sepolia
```

**Required environment variables for deployment:**

```env
PRIVATE_KEY=
USDC_ADDRESS=
USDT_ADDRESS=
BASE_URI=
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env.local

# Start dev server
npm run dev

# Production build
npm run build
npm start
```

**Required environment variables:**

```env
NEXT_PUBLIC_PLATFORM_ADDRESS=
NEXT_PUBLIC_BADGE_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_USDT_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=
```

## Smart Contract Architecture

### DonationPlatform.sol

The core contract managing campaign lifecycle, donations, withdrawals, ratings, and fraud reports.

**Key constants:**
- `MIN_DURATION` — 3 days minimum campaign duration
- `MIN_DONATION` — 1 USDC/USDT (1e6)
- `WITHDRAW_GRACE` — 7 days to withdraw after deadline

**Events emitted:** CampaignCreated, DonationReceived, CampaignFunded, FundsWithdrawn, CampaignExpired, RatingSubmitted, FraudReported, CampaignFraudConfirmed, RefundClaimed, EarlyWithdrawRequested, EarlyWithdrawApproved, EarlyWithdrawExecuted, CampaignUpdate

**Security:** ReentrancyGuard, Ownable, Pausable, SafeERC20

### DonorBadge.sol

ERC-1155 multi-token contract. Each campaign has its own token ID — donors receive exactly one badge per campaign on first donation.

## Testing

63 tests covering:

- **Unit tests** — Campaign creation, donation flow, ratings, fraud reports, withdrawals, early withdrawals, refunds, expiration, pause/unpause
- **Badge tests** — Minting, minter authorization, multi-campaign badges, URI configuration
- **Invariant tests** — Donor count consistency, raised amount accuracy, refund zeroing, closed campaign balances

```bash
cd contracts
forge test -vvv
```

## Network

| Property | Value |
|----------|-------|
| Chain | Mantle Sepolia |
| Chain ID | 5003 |
| RPC | https://rpc.sepolia.mantle.xyz |
| Explorer | https://sepolia.mantlescan.xyz |
| Currency | MNT |

## License

MIT