import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getTopRatedMovies } from "@/lib/imdb";

export async function GET() {
  try {
    const data = await getTopRatedMovies();
    return jsonWithCache(data, CACHE_TTL.long);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
