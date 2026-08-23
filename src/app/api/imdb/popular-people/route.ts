import { NextResponse } from "next/server";

import { CACHE_TTL, jsonWithCache } from "@/lib/api-cache";
import { getPopularPeople } from "@/lib/imdb";

type PopularPersonSpot = {
  id: number;
  name: string;
  known_for_department?: string;
  popularity?: number;
  profile_path?: string;
  known_for_titles: string[];
};

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const pageParam = Number(requestUrl.searchParams.get("page") ?? 1);
    const limitParam = Number(requestUrl.searchParams.get("limit") ?? 18);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 18;

    const data = await getPopularPeople("pt-BR", page);
    const actorResults = (data.results ?? []).filter((person) => {
      const department = (person.known_for_department ?? "").toLowerCase();
      return department.includes("acting") || department.includes("atua");
    });

    const results = actorResults.slice(0, limit).map(
      (person) =>
        ({
          id: person.id,
          name: person.name,
          known_for_department: person.known_for_department,
          popularity: person.popularity,
          profile_path: person.profile_path,
          known_for_titles: (person.known_for ?? [])
            .map((entry) => entry.title ?? entry.name)
            .filter((value): value is string => Boolean(value))
            .slice(0, 3),
        }) satisfies PopularPersonSpot,
    );

    return jsonWithCache(
      {
        page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        results,
      },
      CACHE_TTL.long,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
