import { NextResponse } from "next/server";

import { getTrendingMovies } from "@/lib/imdb";

export async function GET() {
	try {
		const data = await getTrendingMovies();
		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
