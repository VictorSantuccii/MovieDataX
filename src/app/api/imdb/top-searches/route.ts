import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getTrendingAll } from "@/lib/imdb";

export async function GET() {
  try {
    const data = await getTrendingAll("week");
    return jsonWithCache(data, CACHE_TTL.medium);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
