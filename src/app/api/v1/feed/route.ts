import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const url = new URL("/api/posts/feed", req.url);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  const data = await res.json();
  return NextResponse.json(data);
}
