import { NextResponse } from "next/server";

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
		console.info("[API][category-sections] start", { mediaType });

		const genreData = await getGenres(mediaType);
		const genres = (genreData.genres ?? []).slice(0, 8);
		console.info("[API][category-sections] genres", {
			mediaType,
			count: genres.length,
		});

		const sections = await Promise.all(
			genres.map(async (genre) => {
				try {
					const data = await discoverTitles(mediaType, { genreId: genre.id, page: 1 });
					let items = normalizeList(data.results ?? [], mediaType);
					console.info("[API][category-sections] discover", {
						mediaType,
						genreId: genre.id,
						genreName: genre.name,
						items: items.length,
					});

					if (items.length === 0) {
						const fallback = await discoverTitles(mediaType, { page: 1 });
						items = normalizeList(fallback.results ?? [], mediaType).slice(0, 12);
						console.info("[API][category-sections] fallback", {
							mediaType,
							genreId: genre.id,
							genreName: genre.name,
							items: items.length,
						});
					}

					return {
						id: genre.id,
						name: genre.name,
						mediaType,
						items: items.slice(0, 12),
					};
				} catch (error) {
					console.error("[API][category-sections] section-error", {
						mediaType,
						genreId: genre.id,
						genreName: genre.name,
						error: error instanceof Error ? error.message : "Unknown error",
					});
					return {
						id: genre.id,
						name: genre.name,
						mediaType,
						items: [] as TmdbListItem[],
					};
				}
			})
		);

		console.info("[API][category-sections] done", {
			mediaType,
			sections: sections.length,
		});

		return NextResponse.json({ mediaType, sections });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[API][category-sections] fatal", { message });
		return NextResponse.json({ message }, { status: 500 });
	}
}
