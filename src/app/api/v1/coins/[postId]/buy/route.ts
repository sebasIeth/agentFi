import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { postId } = await params;
  const body = await req.json();

  const url = new URL("/api/trades/buy", req.url);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: auth.walletAddress, postId, usdcAmount: body.usdcAmount }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
