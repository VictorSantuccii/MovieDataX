import { NextResponse } from "next/server";

import { getTrendingAll } from "@/lib/imdb";

export async function GET() {
	try {
		const data = await getTrendingAll("day");
		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
