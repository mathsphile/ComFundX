import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CrowdFundX database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.campaignComment.deleteMany();
  await prisma.campaignUpdate.deleteMany();
  await prisma.rewardTier.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  // Create Users (Creators & Backers)
  const creator1 = await prisma.user.create({
    data: {
      walletAddress: "GDQP2KPQGKIHYJGXNUIYOTVIPRWIROW6A265JICGP76B4T34N264A7E3",
      name: "Aria Vance",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      bio: "Core Soroban developer & Web3 infrastructure engineer. Building decentralized financial tooling on Stellar.",
      twitter: "@ariavance_x",
      github: "ariavance",
      website: "https://ariavance.dev"
    }
  });

  const creator2 = await prisma.user.create({
    data: {
      walletAddress: "GBA23KLMFPWERTIOP901234567890ABCDEF1234567890ABCDEF12345",
      name: "Dr. Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      bio: "AI researcher & open-source advocate. Pioneering decentralized compute networks on Soroban.",
      twitter: "@marcus_ai",
      github: "marcus-vance",
      website: "https://neurostella.io"
    }
  });

  const creator3 = await prisma.user.create({
    data: {
      walletAddress: "GCXYZ9876543210FEDCBA09876543210FEDCBA09876543210FEDCBA",
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
      bio: "EdTech founder & literacy gaming designer. Empowering children through blockchain education.",
      twitter: "@elena_edtech",
      github: "elena-games",
      website: "https://luminalearning.org"
    }
  });

  const backer1 = await prisma.user.create({
    data: {
      walletAddress: "GDSK8901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
      name: "Liam O'Connor",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      bio: "Early crypto investor and Stellar ecosystem enthusiast."
    }
  });

  // Future deadline dates
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const pastDeadline = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  // Create Campaign 1: Soroban Pay Protocol
  const c1 = await prisma.campaign.create({
    data: {
      onChainId: 1,
      creatorId: creator1.id,
      title: "Soroban Pay: Next-Gen Sub-Second Micropayments Protocol",
      slug: "soroban-pay-protocol",
      category: "Web3",
      shortDescription: "Empowering global web applications with instant, zero-gas Soroban smart contract micropayments.",
      story: `## The Vision
Soroban Pay is building a high-throughput, sub-second payment gateway natively built on Stellar Soroban smart contracts. 

### Why Stellar?
Existing blockchain payment gateways suffer from high latency and variable gas fees. Soroban allows us to perform atomic, predictable transactions with near-instant finality.

### Key Features
- **Zero-Trust Escrow**: Funds are locked inside audited Soroban contracts until milestone conditions are verified on-chain.
- **SDK & React Hooks**: Plug-and-play developer components for seamless checkout integration in Next.js applications.
- **Automated Yield**: Unused escrow balances earn protocol yields via Stellar liquidity pools.`,
      fundingGoal: 25000,
      raisedAmount: 18450,
      deadline: in30Days,
      coverImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80",
      videoUrl: "https://youtu.be/X9E2upV4nJw",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80"
      ]),
      website: "https://sorobanpay.dev",
      github: "https://github.com/sorobanpay/core",
      twitter: "https://twitter.com/sorobanpay",
      discord: "https://discord.gg/sorobanpay",
      featured: true,
      verified: true,
      views: 3420,
      status: "ACTIVE",
      milestones: {
        create: [
          { title: "Core Soroban Contract Deployment", description: "Audit and deploy escrow contracts on Stellar Testnet.", targetAmount: 8000, completed: true },
          { title: "Developer SDK & React Hooks", description: "Publish @sorobanpay/sdk on NPM with documentation.", targetAmount: 15000, completed: true },
          { title: "Mainnet Security Audit", description: "Third-party smart contract audit by leading security firm.", targetAmount: 25000, completed: false }
        ]
      },
      rewardTiers: {
        create: [
          { title: "Supporter Tier", description: "Early access to SDK beta and official Discord Supporter role.", minAmount: 100, backerCount: 24 },
          { title: "Builder Pass", description: "Dedicated API key with zero platform fees for 1 year.", minAmount: 500, backerCount: 12 },
          { title: "Whale Sponsor", description: "Logo featured on Soroban Pay documentation homepage.", minAmount: 2500, backerCount: 3 }
        ]
      },
      updates: {
        create: [
          { title: "Testnet Contracts Successfully Deployed!", content: "We are thrilled to announce that our core Soroban smart contracts are live on Stellar Testnet with 100% test coverage." }
        ]
      }
    }
  });

  // Create Campaign 2: NeuroStellar AI
  const c2 = await prisma.campaign.create({
    data: {
      onChainId: 2,
      creatorId: creator2.id,
      title: "NeuroStellar: Decentralized AI Inference Marketplace",
      slug: "neurostellar-ai-marketplace",
      category: "AI",
      shortDescription: "Decentralized GPU marketplace running open-source LLM inference powered by Soroban micro-settlements.",
      story: `## Decentralized Compute for Everyone
NeuroStellar connects independent GPU providers with AI developers using Stellar smart contract escrows.

### Problem
Centralized cloud providers charge extortionate prices for GPU clusters. Developers need open, permissionless AI inferencing.

### Solution
Our platform uses Soroban to meter tokenized execution per prompt, settling XLM directly to node operators every 10 seconds.`,
      fundingGoal: 50000,
      raisedAmount: 39800,
      deadline: in15Days,
      coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80"
      ]),
      website: "https://neurostella.io",
      github: "https://github.com/neurostella",
      featured: true,
      verified: true,
      views: 5120,
      status: "ACTIVE",
      milestones: {
        create: [
          { title: "Proof-of-Compute Soroban Engine", description: "On-chain verification of LLM output hashes.", targetAmount: 20000, completed: true },
          { title: "GPU Worker Node CLI", description: "One-command setup for NVIDIA GPU hosts.", targetAmount: 50000, completed: false }
        ]
      },
      rewardTiers: {
        create: [
          { title: "Compute Credit Pass", description: "Receive $200 equivalent in free GPU inference compute.", minAmount: 250, backerCount: 45 }
        ]
      }
    }
  });

  // Create Campaign 3: Lumina Learning
  const c3 = await prisma.campaign.create({
    data: {
      onChainId: 3,
      creatorId: creator3.id,
      title: "Lumina Learn: Blockchain Literacy Games for Kids",
      slug: "lumina-learn-gaming",
      category: "Education",
      shortDescription: "Gamified interactive storybook helping 10M+ children master digital financial literacy on Stellar.",
      story: `## Learning Money & Web3 Safety Through Play
Lumina Learn combines captivating visual storybooks with Soroban testnet mini-games teaching kids how money, savings, and cryptography work.`,
      fundingGoal: 15000,
      raisedAmount: 16200,
      deadline: in45Days,
      coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80",
      featured: false,
      verified: true,
      views: 1890,
      status: "ACTIVE",
      milestones: {
        create: [
          { title: "Alpha Prototype Release", description: "First 5 interactive chapters published.", targetAmount: 10000, completed: true }
        ]
      }
    }
  });

  // Create Campaign 4: Expired/Failed Campaign for Refund Demo
  const c4 = await prisma.campaign.create({
    data: {
      onChainId: 4,
      creatorId: creator1.id,
      title: "StellarVR: Decentralized Virtual Metaverse Hub",
      slug: "stellar-vr-metaverse",
      category: "Gaming",
      shortDescription: "Virtual reality world built on Stellar Web3 state sync (Expired Campaign - Claim Refund Test).",
      story: `## Virtual Metaverse on Stellar
This campaign reached its deadline without meeting its funding target. Supporters can safely claim a 100% refund of their donated XLM directly through the Soroban contract escrow!`,
      fundingGoal: 40000,
      raisedAmount: 12000,
      deadline: pastDeadline,
      coverImage: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200&auto=format&fit=crop&q=80",
      featured: false,
      verified: false,
      views: 890,
      status: "FAILED"
    }
  });

  // Add Initial Donations
  await prisma.donation.create({
    data: {
      campaignId: c1.id,
      contributorId: backer1.id,
      contributorAddress: backer1.walletAddress,
      amount: 1500,
      txHash: "0x8f9c2d1e3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
      status: "CONFIRMED"
    }
  });

  await prisma.donation.create({
    data: {
      campaignId: c4.id,
      contributorId: backer1.id,
      contributorAddress: backer1.walletAddress,
      amount: 500,
      txHash: "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
      status: "CONFIRMED"
    }
  });

  // Add Comments
  await prisma.campaignComment.create({
    data: {
      campaignId: c1.id,
      userId: backer1.id,
      content: "Super excited for sub-second Soroban micropayments! The architecture looks rock solid."
    }
  });

  console.log("Database successfully seeded with CrowdFundX initial data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
