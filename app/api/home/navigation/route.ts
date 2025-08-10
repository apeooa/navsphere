import { NextResponse } from "next/server";
import { fetchJsonFromRepo } from "@/app/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const site = await fetchJsonFromRepo("site.json", { tag: "site", revalidate: 3600 });
    const all  = await fetchJsonFromRepo("navigation.json", { tag: "navigation", revalidate: 3600 });

    const defaultId = String(site?.defaultNavigationId ?? "");
    const items = Array.isArray(all?.navigationItems) ? all.navigationItems : [];
    const picked = defaultId ? items.find((g: any) => String(g?.id) === defaultId) : items[0];

    return NextResponse.json({ navigationItems: picked ? [picked] : [] }, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error in /api/home/navigation:", e);
    return NextResponse.json({ error: "获取导航数据失败" }, { status: 500 });
  }
}
