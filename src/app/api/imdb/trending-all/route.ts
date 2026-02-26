import { NextResponse } from "next/server";

import { getTrendingAll } from "@/lib/imdb";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const time = searchParams.get("time") === "day" ? "day" : "week";
		const data = await getTrendingAll(time);
		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
