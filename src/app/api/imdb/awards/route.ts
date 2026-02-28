import { NextResponse } from "next/server";

import { getTopRatedMovies, getTopRatedTv, searchMulti } from "@/lib/imdb";

type AwardSearch = {
	label: string;
	query: string;
};

type AwardResult = {
	id: number;
	media_type: "movie" | "tv";
	title: string;
	overview?: string;
	poster_path?: string;
	backdrop_path?: string;
	release_date?: string;
	first_air_date?: string;
	vote_average?: number;
	vote_count?: number;
	popularity?: number;
	source_awards: string[];
};

type AwardSection = {
	award: string;
	total_results: number;
	available_years: number[];
	results: AwardResult[];
};

const getItemYear = (item: Pick<AwardResult, "release_date" | "first_air_date">) => {
	const raw = item.release_date ?? item.first_air_date;
	if (!raw) {
		return undefined;
	}
	const year = Number(raw.slice(0, 4));
	return Number.isFinite(year) && year > 1800 ? year : undefined;
};

const getItemScore = (item: Pick<AwardResult, "vote_average" | "popularity">) =>
	(item.vote_average ?? 0) * 10 + (item.popularity ?? 0);

const buildAwardSections = (
	items: AwardResult[],
	awardLabels: string[],
	limitPerAward: number
): AwardSection[] => {
	const sections = awardLabels.map((award) => {
		const awardItems = items
			.filter((item) => item.source_awards.includes(award))
			.sort((a, b) => getItemScore(b) - getItemScore(a));

		const years = [...new Set(awardItems.map((item) => getItemYear(item)).filter((year): year is number => year !== undefined))]
			.sort((a, b) => b - a);

		return {
			award,
			total_results: awardItems.length,
			available_years: years,
			results: awardItems.slice(0, limitPerAward),
		};
	});

	return sections.filter((section) => section.total_results > 0);
};

const buildYearDistribution = (items: AwardResult[]) => {
	const byYear = new Map<number, number>();
	for (const item of items) {
		const year = getItemYear(item);
		if (!year) {
			continue;
		}
		byYear.set(year, (byYear.get(year) ?? 0) + 1);
	}

	return [...byYear.entries()]
		.sort((a, b) => b[0] - a[0])
		.map(([year, count]) => ({ year, count }));
};

const awardSearches: AwardSearch[] = [
	{ label: "Oscar", query: "academy award winner" },
	{ label: "Globo de Ouro", query: "golden globe winner" },
	{ label: "BAFTA", query: "bafta winner" },
	{ label: "Palma de Ouro", query: "palme d'or" },
	{ label: "Emmy", query: "emmy winner" },
];

export async function GET(request: Request) {
	try {
		const requestUrl = new URL(request.url);
		const pageParam = Number(requestUrl.searchParams.get("page") ?? 1);
		const limitParam = Number(requestUrl.searchParams.get("limit") ?? 18);
		const awardLimitParam = Number(requestUrl.searchParams.get("award_limit") ?? 12);
		const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
		const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 18;
		const awardLimit = Number.isFinite(awardLimitParam) && awardLimitParam > 0 ? awardLimitParam : 12;

		const searchResponses = await Promise.allSettled(
			awardSearches.map(async (award) => {
				const response = await searchMulti(award.query, "en-US", page);
				return {
					award: award.label,
					total_pages: response.total_pages,
					results: response.results,
				};
			})
		);

		const fulfilledResponses: Array<{
			award: string;
			total_pages: number;
			results: Array<{
				id: number;
				media_type?: string;
				title?: string;
				name?: string;
				overview?: string;
				poster_path?: string;
				backdrop_path?: string;
				release_date?: string;
				first_air_date?: string;
				vote_average?: number;
				vote_count?: number;
				popularity?: number;
			}>;
		}> = [];

		for (const entry of searchResponses) {
			if (entry.status === "fulfilled") {
				fulfilledResponses.push(entry.value);
			}
		}

		const maxTotalPages = Math.max(
			1,
			...fulfilledResponses.map((entry) => (Number.isFinite(entry.total_pages) ? entry.total_pages : 1))
		);

		const mappedResults = fulfilledResponses.flatMap((entry) =>
			entry.results
				.filter((item) => item.media_type === "movie" || item.media_type === "tv")
				.map((item) => ({
					id: item.id,
					media_type: item.media_type as "movie" | "tv",
					title: item.title ?? item.name ?? "-",
					overview: item.overview,
					poster_path: item.poster_path,
					backdrop_path: item.backdrop_path,
					release_date: item.release_date,
					first_air_date: item.first_air_date,
					vote_average: item.vote_average,
					vote_count: item.vote_count,
					popularity: item.popularity,
					source_awards: [entry.award],
				}))
		);

		const byId = new Map<string, AwardResult>();
		for (const item of mappedResults) {
			const key = `${item.media_type}-${item.id}`;
			const existing = byId.get(key);
			if (!existing) {
				byId.set(key, item);
				continue;
			}

			const sources = new Set([...existing.source_awards, ...item.source_awards]);
			byId.set(key, {
				...existing,
				source_awards: [...sources],
				vote_average: existing.vote_average ?? item.vote_average,
				vote_count: existing.vote_count ?? item.vote_count,
				popularity: existing.popularity ?? item.popularity,
				poster_path: existing.poster_path ?? item.poster_path,
				backdrop_path: existing.backdrop_path ?? item.backdrop_path,
				overview: existing.overview ?? item.overview,
			});
		}

		const normalizedItems = [...byId.values()]
			.sort((a, b) => getItemScore(b) - getItemScore(a));

		const results = normalizedItems.slice(0, limit);
		const awardSections = buildAwardSections(normalizedItems, awardSearches.map((award) => award.label), awardLimit);
		const yearDistribution = buildYearDistribution(normalizedItems);

		if (results.length === 0) {
			const [topMovies, topTv] = await Promise.all([
				getTopRatedMovies("pt-BR"),
				getTopRatedTv("pt-BR"),
			]);

			const fallbackPool: AwardResult[] = [
				...(topMovies.results ?? []).map((item) => ({
					id: item.id,
					media_type: "movie" as const,
					title: item.title ?? item.name ?? "-",
					overview: undefined,
					poster_path: item.poster_path,
					backdrop_path: item.backdrop_path,
					release_date: item.release_date,
					first_air_date: item.first_air_date,
					vote_average: item.vote_average,
					vote_count: undefined,
					popularity: item.popularity,
					source_awards: ["Oscar", "BAFTA", "Globo de Ouro"],
				})),
				...(topTv.results ?? []).map((item) => ({
					id: item.id,
					media_type: "tv" as const,
					title: item.title ?? item.name ?? "-",
					overview: undefined,
					poster_path: item.poster_path,
					backdrop_path: item.backdrop_path,
					release_date: item.release_date,
					first_air_date: item.first_air_date,
					vote_average: item.vote_average,
					vote_count: undefined,
					popularity: item.popularity,
					source_awards: ["Emmy", "Globo de Ouro"],
				})),
			];

			const uniqueFallback = new Map<string, AwardResult>();
			for (const entry of fallbackPool) {
				uniqueFallback.set(`${entry.media_type}-${entry.id}`, entry);
			}

			const sortedFallback = [...uniqueFallback.values()]
				.sort((a, b) => getItemScore(b) - getItemScore(a));

			const start = (page - 1) * limit;
			const pagedFallback = sortedFallback.slice(start, start + limit);
			const fallbackTotalPages = Math.max(1, Math.ceil(sortedFallback.length / limit));
			const awardSectionsFallback = buildAwardSections(sortedFallback, awardSearches.map((award) => award.label), awardLimit);
			const yearDistributionFallback = buildYearDistribution(sortedFallback);

			return NextResponse.json({
				page,
				total_pages: fallbackTotalPages,
				total_results: sortedFallback.length,
				has_more: page < fallbackTotalPages,
				available_awards: awardSearches.map((award) => award.label),
				year_distribution: yearDistributionFallback,
				award_sections: awardSectionsFallback,
				results: pagedFallback,
			});
		}

		return NextResponse.json({
			page,
			total_pages: maxTotalPages,
			total_results: byId.size,
			has_more: page < maxTotalPages,
			available_awards: awardSearches.map((award) => award.label),
			year_distribution: yearDistribution,
			award_sections: awardSections,
			results,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
