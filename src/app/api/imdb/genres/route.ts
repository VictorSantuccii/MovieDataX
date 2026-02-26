import { NextResponse } from "next/server";

import { getGenres } from "@/lib/imdb";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const typeParam = searchParams.get("type");
		const mediaType = typeParam === "tv" ? "tv" : "movie";
		console.info("[API][genres] start", {
			url: request.url,
			mediaType,
			typeParam,
		});
		const data = await getGenres(mediaType);
		console.info("[API][genres] success", {
			mediaType,
			genresCount: data.genres?.length ?? 0,
		});
		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[API][genres] error", {
			url: request.url,
			message,
			error,
		});
		return NextResponse.json({ message }, { status: 500 });
	}
}
