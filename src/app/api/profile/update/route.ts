import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, bio, links } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {
        bio: bio ?? undefined,
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        bio: bio ?? undefined,
        kind: "human",
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
