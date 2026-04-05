import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const postId = req.nextUrl.searchParams.get("postId");
  if (!wallet || !postId) return NextResponse.json({ liked: false });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ liked: false });

  const exists = await db.like.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  return NextResponse.json({ liked: !!exists });
}
