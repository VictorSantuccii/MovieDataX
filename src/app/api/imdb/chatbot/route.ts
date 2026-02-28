import { NextResponse } from "next/server";

import { z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

import { ai } from "@/lib/genkit";
import {
	discoverTitles,
	getPopularMovies,
	getTopRatedMovies,
	getTopRatedTv,
	getTrendingAll,
	searchMulti,
} from "@/lib/imdb";

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
};

type ChatRequest = {
	message?: string;
	history?: ChatMessage[];
};

type CatalogItem = {
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
};

type GeneratedRecommendation = {
	media_type: "movie" | "tv";
	title: string;
	reason: string;
};

const responseSchema = z.object({
	reply: z.string(),
	recommendations: z
		.array(
			z.object({
				media_type: z.enum(["movie", "tv"]),
				title: z.string(),
				reason: z.string(),
			})
		)
		.max(8),
});

const normalizeText = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

const titleSimilarity = (a: string, b: string) => {
	const left = normalizeText(a);
	const right = normalizeText(b);
	if (!left || !right) {
		return 0;
	}
	if (left === right) {
		return 1;
	}
	if (left.includes(right) || right.includes(left)) {
		return 0.8;
	}
	const leftTokens = new Set(left.split(" "));
	const rightTokens = new Set(right.split(" "));
	let intersect = 0;
	for (const token of leftTokens) {
		if (rightTokens.has(token)) {
			intersect += 1;
		}
	}
	const union = new Set([...leftTokens, ...rightTokens]).size;
	return union === 0 ? 0 : intersect / union;
};

const scoreItem = (item: Pick<CatalogItem, "vote_average" | "popularity">) =>
	(item.vote_average ?? 0) * 10 + (item.popularity ?? 0);

const getYear = (item: Pick<CatalogItem, "release_date" | "first_air_date">) =>
	item.release_date?.slice(0, 4) ?? item.first_air_date?.slice(0, 4);

const normalizeItem = (item: Partial<CatalogItem>): CatalogItem | null => {
	const rawType = item.media_type;
	const media_type: "movie" | "tv" =
		rawType === "movie" || rawType === "tv"
			? rawType
			: item.first_air_date
				? "tv"
				: "movie";

	if (!item.id || !(item.title ?? "").trim()) {
		return null;
	}

	return {
		id: item.id,
		media_type,
		title: item.title ?? "-",
		overview: item.overview,
		poster_path: item.poster_path,
		backdrop_path: item.backdrop_path,
		release_date: item.release_date,
		first_air_date: item.first_air_date,
		vote_average: item.vote_average,
		vote_count: item.vote_count,
		popularity: item.popularity,
	};
};

const dedupeCatalog = (items: CatalogItem[]) => {
	const byId = new Map<string, CatalogItem>();
	for (const item of items) {
		const key = `${item.media_type}-${item.id}`;
		const existing = byId.get(key);
		if (!existing) {
			byId.set(key, item);
			continue;
		}
		byId.set(key, {
			...existing,
			overview: existing.overview ?? item.overview,
			poster_path: existing.poster_path ?? item.poster_path,
			backdrop_path: existing.backdrop_path ?? item.backdrop_path,
			vote_average: existing.vote_average ?? item.vote_average,
			vote_count: existing.vote_count ?? item.vote_count,
			popularity: existing.popularity ?? item.popularity,
		});
	}
	return [...byId.values()].sort((a, b) => scoreItem(b) - scoreItem(a));
};

const buildFallback = (message: string, catalog: CatalogItem[]) => {
	const lowered = message.toLowerCase();
	const keywords = lowered
		.split(/[^\p{L}\p{N}]+/u)
		.map((term) => term.trim())
		.filter((term) => term.length >= 4)
		.slice(0, 8);

	const keywordRank = (item: CatalogItem) => {
		if (!keywords.length) {
			return 0;
		}
		const haystack = `${item.title} ${item.overview ?? ""}`.toLowerCase();
		return keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
	};

	const recommended: GeneratedRecommendation[] = [...catalog]
		.sort((a, b) => {
			const byKeyword = keywordRank(b) - keywordRank(a);
			if (byKeyword !== 0) {
				return byKeyword;
			}
			return scoreItem(b) - scoreItem(a);
		})
		.slice(0, 6)
		.map((item) => ({
			media_type: item.media_type,
			title: item.title,
			reason: `Boa combinação com seu contexto, destaque de nota ${item.vote_average?.toFixed(1) ?? "-"} e relevância atual.`,
		}));

	return {
		reply:
			"Preparei indicações focadas em filmes e séries com base no seu pedido, combinando dados recentes e repertório de cinema/TV. Se quiser, posso refinar por gênero, década, humor ou duração.",
		recommendations: recommended,
	};
};

const resolveAgainstCatalog = (recommendation: GeneratedRecommendation, catalog: CatalogItem[]) => {
	let best: CatalogItem | null = null;
	let bestScore = 0;

	for (const item of catalog) {
		if (item.media_type !== recommendation.media_type) {
			continue;
		}
		const similarity = titleSimilarity(item.title, recommendation.title);
		if (similarity > bestScore) {
			best = item;
			bestScore = similarity;
		}
	}

	return bestScore >= 0.72 ? best : null;
};

const resolveByTmdbSearch = async (recommendation: GeneratedRecommendation) => {
	try {
		const response = await searchMulti(recommendation.title, "pt-BR", 1);
		const candidate = (response.results ?? [])
			.filter((item) => item.media_type === recommendation.media_type)
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
				titleScore: titleSimilarity(item.title ?? item.name ?? "", recommendation.title),
			}))
			.sort((a, b) => {
				const byTitle = b.titleScore - a.titleScore;
				if (byTitle !== 0) {
					return byTitle;
				}
				return scoreItem(b) - scoreItem(a);
			})[0];

		if (!candidate || candidate.titleScore < 0.45) {
			return null;
		}

		return {
			id: candidate.id,
			media_type: candidate.media_type,
			title: candidate.title,
			overview: candidate.overview,
			poster_path: candidate.poster_path,
			backdrop_path: candidate.backdrop_path,
			release_date: candidate.release_date,
			first_air_date: candidate.first_air_date,
			vote_average: candidate.vote_average,
			vote_count: candidate.vote_count,
			popularity: candidate.popularity,
		};
	} catch {
		return null;
	}
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ChatRequest;
		const message = body.message?.trim();
		if (!message) {
			return NextResponse.json({ message: "Mensagem inválida." }, { status: 400 });
		}

		const history = (body.history ?? []).slice(-8);

		const [trendingAll, popularMovies, topRatedMovies, topRatedTv, discoverMovies, discoverTv, searchResults] =
			await Promise.all([
				getTrendingAll("week", "pt-BR"),
				getPopularMovies("pt-BR"),
				getTopRatedMovies("pt-BR"),
				getTopRatedTv("pt-BR"),
				discoverTitles("movie", { language: "pt-BR", page: 1 }),
				discoverTitles("tv", { language: "pt-BR", page: 1 }),
				searchMulti(message, "pt-BR", 1),
			]);

		const catalog = dedupeCatalog(
			[
				...(trendingAll.results ?? []),
				...(popularMovies.results ?? []),
				...(topRatedMovies.results ?? []).map((item) => ({ ...item, media_type: "movie" as const })),
				...(topRatedTv.results ?? []).map((item) => ({ ...item, media_type: "tv" as const })),
				...(discoverMovies.results ?? []).map((item) => ({ ...item, media_type: "movie" as const })),
				...(discoverTv.results ?? []).map((item) => ({ ...item, media_type: "tv" as const })),
				...(searchResults.results ?? []),
			]
				.map((item) =>
					normalizeItem({
						id: item.id,
						media_type:
							item.media_type === "movie" || item.media_type === "tv"
								? item.media_type
								: undefined,
						title: item.title ?? item.name,
						overview: (item as { overview?: string }).overview,
						poster_path: item.poster_path,
						backdrop_path: item.backdrop_path,
						release_date: item.release_date,
						first_air_date: item.first_air_date,
						vote_average: item.vote_average,
						vote_count: (item as { vote_count?: number }).vote_count,
						popularity: item.popularity,
					})
				)
				.filter((item): item is CatalogItem => item !== null)
		);

		const pool = catalog.slice(0, 120).map((item) => ({
			id: item.id,
			media_type: item.media_type,
			title: item.title,
			year: getYear(item) ?? "-",
			vote_average: item.vote_average ?? 0,
			popularity: item.popularity ?? 0,
			overview: item.overview ?? "",
		}));

		let output: z.infer<typeof responseSchema> | null = null;
		if (process.env.GEMINI_API_KEY) {
			const generated = await ai.generate({
				model: googleAI.model("gemini-2.5-flash"),
				system:
					"Você é Axel, o chatbot cinéfilo do MovieDataX. Você só pode conversar e recomendar conteúdo de FILMES e SÉRIES/TV. " +
					"Se o usuário pedir qualquer outro tema, recuse educadamente e redirecione para cinema/séries. " +
					"Você pode recomendar títulos além do catálogo de contexto usando seu repertório de cinema e TV, desde que sejam reais e conhecidos. " +
					"Priorize contexto recente, mas não se limite a ele. Não invente títulos. " +
					"Use o histórico da conversa para manter continuidade, preferências e contexto do usuário. " +
					"Responda em português do Brasil, de forma clara, útil e amigável.",
				prompt:
					`Pedido do usuário: ${message}\n\n` +
					`Histórico recente: ${JSON.stringify(history)}\n\n` +
					`Catálogo recente TMDB (filmes e séries): ${JSON.stringify(pool)}\n\n` +
					"Indique no máximo 6 títulos e traga um motivo curto para cada recomendação.",
				output: {
					schema: responseSchema,
				},
			});

			output = generated.output ?? null;
		}

		const resolvedOutput = output ?? buildFallback(message, catalog);
		const rawRecommendations = resolvedOutput.recommendations.slice(0, 6);

		const resolvedFromCatalog = rawRecommendations.map((recommendation) => ({
			recommendation,
			catalogItem: resolveAgainstCatalog(recommendation, catalog),
		}));

		const unresolved = resolvedFromCatalog
			.filter((entry) => !entry.catalogItem)
			.map((entry) => entry.recommendation);

		const enrichedUnresolved = await Promise.all(unresolved.map((recommendation) => resolveByTmdbSearch(recommendation)));

		const recommendations = resolvedFromCatalog.map((entry) => {
			const fromCatalog = entry.catalogItem;
			if (fromCatalog) {
				return {
					id: fromCatalog.id,
					media_type: fromCatalog.media_type,
					title: fromCatalog.title,
					reason: entry.recommendation.reason,
					overview: fromCatalog.overview,
					poster_path: fromCatalog.poster_path,
					backdrop_path: fromCatalog.backdrop_path,
					release_date: fromCatalog.release_date,
					first_air_date: fromCatalog.first_air_date,
					vote_average: fromCatalog.vote_average,
					vote_count: fromCatalog.vote_count,
					popularity: fromCatalog.popularity,
					source: "tmdb-context",
				};
			}

			const foundBySearch = enrichedUnresolved.find(
				(candidate) =>
					candidate &&
					candidate.media_type === entry.recommendation.media_type &&
					titleSimilarity(candidate.title, entry.recommendation.title) >= 0.45
			);

			if (foundBySearch) {
				return {
					...foundBySearch,
					reason: entry.recommendation.reason,
					source: "ai-expanded",
				};
			}

			return {
				id: undefined,
				media_type: entry.recommendation.media_type,
				title: entry.recommendation.title,
				reason: entry.recommendation.reason,
				overview: undefined,
				poster_path: undefined,
				backdrop_path: undefined,
				release_date: undefined,
				first_air_date: undefined,
				vote_average: undefined,
				vote_count: undefined,
				popularity: undefined,
				source: "ai-expanded",
			};
		});

		return NextResponse.json({
			reply: resolvedOutput.reply,
			recommendations,
			catalog_size: catalog.length,
			restricted_domain: ["movie", "tv"],
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro interno.";
		return NextResponse.json({ message }, { status: 500 });
	}
}
