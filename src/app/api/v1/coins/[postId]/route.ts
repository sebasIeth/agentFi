import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const url = new URL(`/api/coins/info?postId=${postId}`, req.url);
  const res = await fetch(url.toString());
  const data = await res.json();
  return NextResponse.json(data);
}
