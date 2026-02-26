import { NextResponse } from "next/server";

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
		const requestMeta = {
			url: request.url,
			mediaType,
			genreParam,
			minRating,
			minYear,
			page,
		};
		console.info("[API][discover] start", requestMeta);

		const data = await discoverTitles(mediaType, {
			genreId: genreParam ? Number(genreParam) : undefined,
			minRating: Number.isFinite(minRating) ? minRating : 0,
			minYear: Number.isFinite(minYear) ? minYear : 0,
			page: Number.isFinite(page) && page > 0 ? page : 1,
		});

		console.info("[API][discover] success", {
			...requestMeta,
			responsePage: data.page,
			resultsCount: data.results?.length ?? 0,
			totalPages: data.total_pages,
			totalResults: data.total_results,
		});

		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[API][discover] error", {
			url: request.url,
			message,
			error,
		});
		return NextResponse.json({ message }, { status: 500 });
	}
}
