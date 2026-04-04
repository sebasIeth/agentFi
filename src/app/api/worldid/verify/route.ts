import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { rp_id, idkitResponse, walletAddress } = await req.json();

    const rpId = rp_id || process.env.RP_ID || "rp_4af75d3d6fa314d0";

    // Forward proof to World Developer Portal for verification
    const response = await fetch(
      `https://developer.world.org/api/v4/verify/${rpId}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(idkitResponse),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { error: result.detail || "Verification failed", code: result.code },
        { status: 400 },
      );
    }

    // Extract nullifier from the response
    const nullifier = result.nullifier || result.results?.[0]?.nullifier;

    // Update user as verified in DB
    if (walletAddress) {
      await db.user.upsert({
        where: { walletAddress: walletAddress.toLowerCase() },
        update: { isOrbVerified: true },
        create: {
          walletAddress: walletAddress.toLowerCase(),
          kind: "human",
          isOrbVerified: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      nullifier,
      action: result.action,
    });
  } catch (error) {
    console.error("World ID verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}
