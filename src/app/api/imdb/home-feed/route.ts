import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { discoverTitles, getPopularMovies, getTrendingAll } from "@/lib/imdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 1);
    const limitParam = Number(searchParams.get("limit") ?? 24);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 24;
    const minYear = Math.max(2000, new Date().getFullYear() - 3);

    const [trendingWeek, trendingDay, popularMovies, discoverMovies] =
      await Promise.all([
        getTrendingAll("week", "pt-BR", page),
        getTrendingAll("day", "pt-BR", page),
        getPopularMovies("pt-BR", page),
        discoverTitles("movie", {
          page,
          minRating: 6.5,
          minYear,
        }),
      ]);

    return jsonWithCache(
      {
        meta: {
          page,
          limit,
          updated_at: new Date().toISOString(),
          sources: 4,
          totals: {
            trending_week: trendingWeek.total_results ?? 0,
            trending_day: trendingDay.total_results ?? 0,
            popular_movies: popularMovies.total_results ?? 0,
            discover_movies: discoverMovies.total_results ?? 0,
          },
        },
        results: {
          trending_week: (trendingWeek.results ?? []).slice(0, limit),
          trending_day: (trendingDay.results ?? []).slice(0, limit),
          popular_movies: (popularMovies.results ?? []).slice(0, limit),
          discover_movies: (discoverMovies.results ?? []).slice(0, limit),
        },
      },
      CACHE_TTL.medium,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
