import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getTitleDetails } from "@/lib/imdb";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const mediaTypeParam = requestUrl.searchParams.get("media_type");
    const mediaType = mediaTypeParam === "tv" ? "tv" : "movie";
    const idParam = Number(requestUrl.searchParams.get("id") ?? 0);

    if (!Number.isFinite(idParam) || idParam <= 0) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const details = await getTitleDetails(mediaType, idParam);

    return jsonWithCache(
      {
        id: details.id,
        media_type: mediaType,
        title: details.title ?? details.name ?? "-",
        overview: details.overview,
        tagline: details.tagline,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        release_date: details.release_date,
        first_air_date: details.first_air_date,
        status: details.status,
        runtime: details.runtime,
        episode_run_time: details.episode_run_time,
        vote_average: details.vote_average,
        vote_count: details.vote_count,
        popularity: details.popularity,
        homepage: details.homepage,
        genres: details.genres ?? [],
      },
      CACHE_TTL.long,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
