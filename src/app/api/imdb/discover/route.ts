import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { discoverTitles } from "@/lib/imdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const mediaType = typeParam === "tv" ? "tv" : "movie";
    const genreParam = searchParams.get("genre");
    const minRating = Number(searchParams.get("minRating") ?? 0);
    const minYear = Number(searchParams.get("minYear") ?? 0);
    const page = Number(searchParams.get("page") ?? 1);

    const data = await discoverTitles(mediaType, {
      genreId: genreParam ? Number(genreParam) : undefined,
      minRating: Number.isFinite(minRating) ? minRating : 0,
      minYear: Number.isFinite(minYear) ? minYear : 0,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    });

    return jsonWithCache(data, CACHE_TTL.medium);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
