import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;

  const [profileRes, earningsRes] = await Promise.all([
    fetch(new URL(`/api/profile/me?wallet=${wallet}`, req.url).toString()),
    fetch(new URL(`/api/earnings?wallet=${wallet}`, req.url).toString()),
  ]);

  const profile = await profileRes.json();
  const earnings = await earningsRes.json();

  return NextResponse.json({ ...profile, earnings });
}
