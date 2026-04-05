import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { posts: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        kind: true,
        _count: { select: { posts: true, followers: true } },
      },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json([]);
  }
}
