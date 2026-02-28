import { NextResponse } from "next/server";

import { getTitleDetails, getTitleReviews, searchMulti } from "@/lib/imdb";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q")?.trim();
		const pageParam = Number(searchParams.get("page") ?? 1);
		const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

		if (!query) {
			return NextResponse.json({ message: "Missing query." }, { status: 400 });
		}

		const data = await searchMulti(query, "pt-BR", page);
		const titles = data.results
			.filter((result) => result.media_type === "movie" || result.media_type === "tv")
			.slice(0, 12);

		const enriched = await Promise.all(
			titles.map(async (result) => {
				const mediaType = result.media_type as "movie" | "tv";
				const [details, reviews] = await Promise.all([
					getTitleDetails(mediaType, result.id),
					getTitleReviews(mediaType, result.id),
				]);

				return { ...details, media_type: mediaType, reviews };
			})
		);
		return NextResponse.json({
			query,
			page,
			total_pages: data.total_pages,
			total_results: data.total_results,
			results: enriched,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
