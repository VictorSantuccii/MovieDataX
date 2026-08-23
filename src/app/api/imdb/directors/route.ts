import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getMovieCredits, getPopularMovies } from "@/lib/imdb";

type DirectorSpot = {
  id: number;
  title: string;
  director: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
};

export async function GET() {
  try {
    const data = await getPopularMovies();
    const titles = data.results.slice(0, 8);
    const enriched = await Promise.all(
      titles.map(async (movie) => {
        const credits = await getMovieCredits(movie.id);
        const director = credits.crew.find(
          (member) => member.job === "Director",
        );

        return {
          id: movie.id,
          title: movie.title ?? "-",
          director: director?.name ?? "Diretor não informado",
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        } satisfies DirectorSpot;
      }),
    );

    return jsonWithCache({ results: enriched }, CACHE_TTL.long);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
