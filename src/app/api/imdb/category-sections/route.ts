import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { discoverTitles, getGenres, type TmdbListItem } from "@/lib/imdb";

const normalizeList = (list: TmdbListItem[], mediaType: "movie" | "tv") =>
  list
    .filter((entry) => Boolean(entry.title ?? entry.name))
    .map((entry) => ({
      ...entry,
      media_type: mediaType,
    }));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const mediaType: "movie" | "tv" = typeParam === "tv" ? "tv" : "movie";

    const genreData = await getGenres(mediaType);
    const genres = (genreData.genres ?? []).slice(0, 8);

    const sections = await Promise.all(
      genres.map(async (genre) => {
        try {
          const data = await discoverTitles(mediaType, {
            genreId: genre.id,
            page: 1,
          });
          let items = normalizeList(data.results ?? [], mediaType);

          if (items.length === 0) {
            const fallback = await discoverTitles(mediaType, { page: 1 });
            items = normalizeList(fallback.results ?? [], mediaType).slice(
              0,
              12,
            );
          }

          return {
            id: genre.id,
            name: genre.name,
            mediaType,
            items: items.slice(0, 12),
          };
        } catch {
          return {
            id: genre.id,
            name: genre.name,
            mediaType,
            items: [] as TmdbListItem[],
          };
        }
      }),
    );

    return jsonWithCache({ mediaType, sections }, CACHE_TTL.medium);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
