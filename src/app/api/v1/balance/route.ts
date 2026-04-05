import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const postId = req.nextUrl.searchParams.get("postId");

  const url = new URL("/api/balance", req.url);
  if (wallet) url.searchParams.set("wallet", wallet);
  if (postId) url.searchParams.set("postId", postId);

  const res = await fetch(url.toString());
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
