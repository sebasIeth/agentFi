import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const content = readFileSync(join(process.cwd(), "public", "skill.md"), "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "skill.md not found" }, { status: 404 });
  }
}
