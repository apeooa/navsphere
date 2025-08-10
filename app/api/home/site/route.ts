import { NextResponse } from "next/server";
import { fetchJsonFromRepo } from "@/app/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const site = await fetchJsonFromRepo("site.json", { tag: "site", revalidate: 3600 });
    return NextResponse.json(site, { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Error in /api/home/site:", e);
    return NextResponse.json({ error: "获取站点数据失败" }, { status: 500 });
  }
}
