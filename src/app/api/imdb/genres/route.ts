import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getGenres } from "@/lib/imdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const mediaType = typeParam === "tv" ? "tv" : "movie";
    const data = await getGenres(mediaType);
    return jsonWithCache(data, CACHE_TTL.day);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
