import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "featured";
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { shortDescription: { contains: search } },
        { story: { contains: search } }
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "featured") {
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
    } else if (sort === "trending" || sort === "highest_funded") {
      orderBy = { raisedAmount: "desc" };
    } else if (sort === "ending_soon") {
      orderBy = { deadline: "asc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      orderBy,
      include: {
        creator: {
          select: { name: true, avatar: true, walletAddress: true }
        },
        donations: {
          select: { id: true, amount: true, contributorAddress: true, createdAt: true }
        },
        _count: {
          select: { donations: true, bookmarks: true }
        }
      }
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Fetch campaigns error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const headerAddress = req.headers.get("x-wallet-address");
    const walletAddress = session?.walletAddress || headerAddress || body.publicKey || body.creatorAddress;

    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized. Connect wallet first." }, { status: 401 });
    }

    let creatorId = session?.userId;
    if (!creatorId) {
      let user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress,
            name: `Stellar Creator ${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`,
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80`,
          },
        });
      }
      creatorId = user.id;
    }

    const {
      title,
      shortDescription,
      story,
      category,
      fundingGoal,
      deadlineDays,
      coverImage,
      gallery,
      videoUrl,
      website,
      github,
      twitter,
      discord,
      milestones,
      rewardTiers,
    } = body;

    if (!title || !shortDescription || !story || !category || !fundingGoal || !deadlineDays || !coverImage) {
      return NextResponse.json({ error: "Missing required campaign fields" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);

    const deadline = new Date(Date.now() + Number(deadlineDays) * 24 * 60 * 60 * 1000);

    const campaign = await prisma.campaign.create({
      data: {
        creatorId,
        title,
        slug,
        shortDescription,
        story,
        category,
        fundingGoal: Number(fundingGoal),
        raisedAmount: 0,
        deadline,
        coverImage,
        gallery: gallery ? JSON.stringify(gallery) : null,
        videoUrl,
        website,
        github,
        twitter,
        discord,
        status: "ACTIVE",
        verified: true,
        milestones: milestones
          ? {
              create: milestones.map((m: any) => ({
                title: m.title,
                description: m.description || "",
                targetAmount: Number(m.targetAmount),
              })),
            }
          : undefined,
        rewardTiers: rewardTiers
          ? {
              create: rewardTiers.map((r: any) => ({
                title: r.title,
                description: r.description || "",
                minAmount: Number(r.minAmount),
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
