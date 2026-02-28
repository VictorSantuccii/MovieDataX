"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import {
	ArrowUpRight,
	Award,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Clapperboard,
	Clock3,
	LineChart,
	Play,
	Search,
	Sparkles,
	Star,
	TrendingUp,
	Users,
	X,
} from "lucide-react";

type TrendingApiResponse = {
	results: Array<{
		id: number;
		title: string;
		vote_average: number;
		release_date?: string;
		popularity?: number;
	}>;
};

type TmdbListItem = {
	id: number;
	media_type?: "movie" | "tv";
	title?: string;
	name?: string;
	vote_average?: number;
	release_date?: string;
	first_air_date?: string;
	genre_ids?: number[];
	poster_path?: string;
	backdrop_path?: string;
};

type DirectorSpot = {
	id: number;
	title: string;
	director: string;
	poster_path?: string;
	backdrop_path?: string;
	vote_average?: number;
	release_date?: string;
};

type PopularPersonSpot = {
	id: number;
	name: string;
	known_for_department?: string;
	popularity?: number;
	profile_path?: string;
	known_for_titles: string[];
};

type TrendingCard = {
	id: number;
	title: string;
	year: string;
	rating: string;
	trend: string;
};

type AwardSpot = {
	id: number;
	media_type: "movie" | "tv";
	title: string;
	overview?: string;
	poster_path?: string;
	backdrop_path?: string;
	release_date?: string;
	first_air_date?: string;
	vote_average?: number;
	source_awards: string[];
};

type TrendingDetails = {
	id: number;
	media_type: "movie" | "tv";
	title: string;
	overview?: string;
	tagline?: string;
	poster_path?: string;
	backdrop_path?: string;
	release_date?: string;
	first_air_date?: string;
	status?: string;
	runtime?: number;
	episode_run_time?: number[];
	vote_average?: number;
	vote_count?: number;
	popularity?: number;
	homepage?: string;
	genres?: Array<{ id: number; name: string }>;
};

type HomeFeedResponse = {
	meta?: {
		page?: number;
		limit?: number;
		updated_at?: string;
		sources?: number;
		totals?: {
			trending_week?: number;
			trending_day?: number;
			popular_movies?: number;
			discover_movies?: number;
		};
	};
	results?: {
		trending_week?: TmdbListItem[];
		trending_day?: TmdbListItem[];
		popular_movies?: TmdbListItem[];
		discover_movies?: TmdbListItem[];
	};
};

const container: Variants = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 },
	},
};

const item: Variants = {
	hidden: { opacity: 0, y: 14 },
	show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const fallbackTrending: TrendingCard[] = [
	{ id: 1, title: "Em alta esta semana", year: "2024", rating: "8.2", trend: "+6%" },
	{ id: 2, title: "Seleção curada", year: "2023", rating: "7.9", trend: "+4%" },
	{ id: 3, title: "Novo destaque", year: "2022", rating: "7.7", trend: "+3%" },
];

const fallbackTitles: TmdbListItem[] = [
	{ id: 603, title: "Matrix", media_type: "movie", vote_average: 8.2, release_date: "1999-03-31" },
	{ id: 157336, title: "Interstellar", media_type: "movie", vote_average: 8.4, release_date: "2014-11-05" },
	{ id: 1396, name: "Breaking Bad", media_type: "tv", vote_average: 8.9, first_air_date: "2008-01-20" },
	{ id: 1399, name: "Game of Thrones", media_type: "tv", vote_average: 8.5, first_air_date: "2011-04-17" },
];

const fallbackDirectors: DirectorSpot[] = [
	{ id: 157336, title: "Interstellar", director: "Christopher Nolan", vote_average: 8.4, release_date: "2014-11-05" },
	{ id: 598, title: "Cidade de Deus", director: "Fernando Meirelles", vote_average: 8.4, release_date: "2002-08-30" },
	{ id: 680, title: "Pulp Fiction", director: "Quentin Tarantino", vote_average: 8.5, release_date: "1994-09-10" },
];

const fallbackPeople: PopularPersonSpot[] = [
	{ id: 31, name: "Tom Hanks", known_for_department: "Acting", popularity: 40.1, known_for_titles: ["Forrest Gump", "Cast Away", "The Green Mile"] },
	{ id: 6193, name: "Leonardo DiCaprio", known_for_department: "Acting", popularity: 52.4, known_for_titles: ["Inception", "Titanic", "The Revenant"] },
	{ id: 500, name: "Tom Cruise", known_for_department: "Acting", popularity: 47.8, known_for_titles: ["Top Gun: Maverick", "Mission: Impossible", "Rain Man"] },
];

const imageBase = "https://image.tmdb.org/t/p";

const movieGenreOptions = [
	{ id: "all", label: "Todas as categorias" },
	{ id: 28, label: "Ação" },
	{ id: 12, label: "Aventura" },
	{ id: 35, label: "Comédia" },
	{ id: 18, label: "Drama" },
	{ id: 27, label: "Terror" },
	{ id: 878, label: "Ficção científica" },
	{ id: 10749, label: "Romance" },
];

const tvGenreOptions = [
	{ id: "all", label: "Todas as categorias" },
	{ id: 10759, label: "Ação e aventura" },
	{ id: 16, label: "Animação" },
	{ id: 35, label: "Comédia" },
	{ id: 80, label: "Crime" },
	{ id: 18, label: "Drama" },
	{ id: 9648, label: "Mistério" },
	{ id: 10765, label: "Ficção científica" },
	{ id: 10749, label: "Romance" },
];

const fallbackAwards: AwardSpot[] = [
	{
		id: 872585,
		media_type: "movie",
		title: "Oppenheimer",
		release_date: "2023-07-19",
		vote_average: 8.1,
		overview: "Vencedor em múltiplas categorias e destaque técnico.",
		source_awards: ["Oscar"],
	},
	{
		id: 915935,
		media_type: "movie",
		title: "Anatomy of a Fall",
		release_date: "2023-08-23",
		vote_average: 7.6,
		overview: "Reconhecido por roteiro e circuito de festivais internacionais.",
		source_awards: ["Palma de Ouro", "Globo de Ouro"],
	},
	{
		id: 94997,
		media_type: "tv",
		title: "House of the Dragon",
		first_air_date: "2022-08-21",
		vote_average: 8.4,
		overview: "Produção indicada e premiada em grandes cerimônias da TV.",
		source_awards: ["Emmy", "Globo de Ouro"],
	},
];


export default function Home() {
	const router = useRouter();
	const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const [query, setQuery] = useState("");
	const [trending, setTrending] = useState<TrendingCard[]>(fallbackTrending);
	const [topSearches, setTopSearches] = useState<TmdbListItem[]>(fallbackTitles);
	const [mostViewed, setMostViewed] = useState<TmdbListItem[]>(fallbackTitles);
	const [popularNow, setPopularNow] = useState<TmdbListItem[]>(fallbackTitles);
	const [discoverNow, setDiscoverNow] = useState<TmdbListItem[]>(fallbackTitles);
	const [publicFavorites, setPublicFavorites] = useState<TmdbListItem[]>(fallbackTitles);
	const [kidsNow, setKidsNow] = useState<TmdbListItem[]>(fallbackTitles);
	const [topRated, setTopRated] = useState<TmdbListItem[]>(fallbackTitles);
	const [directors, setDirectors] = useState<DirectorSpot[]>(fallbackDirectors);
	const [popularPeople, setPopularPeople] = useState<PopularPersonSpot[]>(fallbackPeople);
	const [awards, setAwards] = useState<AwardSpot[]>(fallbackAwards);
	const [apiSourcesCount, setApiSourcesCount] = useState(6);
	const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);
	const [selectedTrendingId, setSelectedTrendingId] = useState<number | null>(null);
	const [trendingDetails, setTrendingDetails] = useState<TrendingDetails | null>(null);
	const [trendingDetailsLoading, setTrendingDetailsLoading] = useState(false);
	const [trendingDetailsError, setTrendingDetailsError] = useState<string | null>(null);
	const [heroIndex, setHeroIndex] = useState(0);

	const handleSearch = () => {
		const trimmed = query.trim();
		if (!trimmed) {
			return;
		}
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	const setRowRef = (key: string) => (node: HTMLDivElement | null) => {
		rowRefs.current[key] = node;
	};

	const scrollRow = (key: string, direction: "prev" | "next") => {
		const element = rowRefs.current[key];
		if (!element) {
			return;
		}

		const amount = Math.max(260, Math.floor(element.clientWidth * 0.82));
		element.scrollBy({
			left: direction === "next" ? amount : -amount,
			behavior: "smooth",
		});
	};

	const resolveMediaType = (item: TmdbListItem) => {
		if (item.media_type === "movie" || item.media_type === "tv") {
			return item.media_type;
		}
		if (item.first_air_date) {
			return "tv";
		}
		if (item.release_date) {
			return "movie";
		}
		return "movie";
	};

	useEffect(() => {
		let isActive = true;

		const normalizeList = (list: TmdbListItem[]) =>
			list
				.filter((entry) => {
					const rawType = (entry as { media_type?: string }).media_type;
					if (rawType && rawType !== "movie" && rawType !== "tv") {
						return false;
					}
					return Boolean(entry.title ?? entry.name);
				})
				.map((entry) => ({
					...entry,
					media_type: resolveMediaType(entry),
				}));

		const loadTrending = async () => {
			try {
				const response = await fetch("/api/imdb/trending");
				if (!response.ok) {
					return;
				}
				const data = (await response.json()) as TrendingApiResponse;
				const top = data.results.slice(0, 6);
				const mapped = top.map((movie, index) => ({
					id: movie.id,
					title: movie.title,
					year: movie.release_date ? movie.release_date.slice(0, 4) : "-",
					rating: movie.vote_average.toFixed(1),
					trend: `+${Math.max(2, 6 - index)}%`,
				}));

				if (isActive) {
					setTrending(mapped.length ? mapped : fallbackTrending);
				}
			} catch {
				// Keep fallback values on any error.
			}
		};

		loadTrending();

		const loadCollections = async () => {
			try {
				const fetchJson = async (url: string) => {
					try {
						const response = await fetch(url);
						if (!response.ok) {
							return null;
						}
						return await response.json();
					} catch {
						return null;
					}
				};

				const [searches, viewed, topRatedData, directorsData, popularPeopleData, awardsData, homeFeed, kidsFeed] = await Promise.all([
					fetchJson("/api/imdb/top-searches"),
					fetchJson("/api/imdb/most-viewed"),
					fetchJson("/api/imdb/top-rated"),
					fetchJson("/api/imdb/directors"),
					fetchJson("/api/imdb/popular-people"),
					fetchJson("/api/imdb/awards?page=1&limit=9"),
					fetchJson("/api/imdb/home-feed?page=1&limit=24"),
					fetchJson("/api/imdb/discover?type=movie&genre=10751&minRating=5&page=1"),
				]);

				if (!isActive) {
					return;
				}

				const nextTopSearches = normalizeList((searches?.results ?? []).slice(0, 12));
				const nextMostViewed = normalizeList((viewed?.results ?? []).slice(0, 12));
				const nextHomeFeed = (homeFeed ?? {}) as HomeFeedResponse;
				const nextPopularNow = normalizeList((nextHomeFeed.results?.popular_movies ?? []).slice(0, 18));
				const nextDiscoverNow = normalizeList((nextHomeFeed.results?.discover_movies ?? []).slice(0, 18));
				const nextTopRated = normalizeList(
					(topRatedData?.results ?? []).map((item: TmdbListItem) => ({
						...item,
						media_type: "movie",
					}))
				);
				const nextPublicFavorites = nextTopRated.slice(0, 12);
				const nextKids = normalizeList((kidsFeed?.results ?? []).slice(0, 12));
				const nextDirectors = (directorsData?.results ?? []).slice(0, 9);
				const nextPeople = (popularPeopleData?.results ?? []).slice(0, 12);
				const nextAwards = (awardsData?.results ?? []).slice(0, 9) as AwardSpot[];

				if (nextTopSearches.length) {
					setTopSearches(nextTopSearches);
				}
				if (nextMostViewed.length) {
					setMostViewed(nextMostViewed);
				}
				if (nextPopularNow.length) {
					setPopularNow(nextPopularNow);
				}
				if (nextDiscoverNow.length) {
					setDiscoverNow(nextDiscoverNow);
				}
				if (nextPublicFavorites.length) {
					setPublicFavorites(nextPublicFavorites);
				}
				if (nextKids.length) {
					setKidsNow(nextKids);
				}
				if (nextTopRated.length) {
					setTopRated(nextTopRated);
				}
				if (nextDirectors.length) {
					setDirectors(nextDirectors);
				}
				if (nextPeople.length) {
					setPopularPeople(nextPeople);
				}
				if (nextAwards.length) {
					setAwards(nextAwards);
				}

				const sourcesFromFeed = nextHomeFeed.meta?.sources;
				if (typeof sourcesFromFeed === "number" && Number.isFinite(sourcesFromFeed)) {
					setApiSourcesCount(Math.max(6, sourcesFromFeed));
				}

				if (!nextTopSearches.length && !nextMostViewed.length && !nextTopRated.length) {
					setTopSearches(fallbackTitles);
					setMostViewed(fallbackTitles);
					setTopRated(fallbackTitles);
				}

				if (!nextPopularNow.length) {
					setPopularNow(fallbackTitles);
				}

				if (!nextDiscoverNow.length) {
					setDiscoverNow(fallbackTitles);
				}

				if (!nextPublicFavorites.length) {
					setPublicFavorites(fallbackTitles);
				}

				if (!nextKids.length) {
					setKidsNow(fallbackTitles);
				}

				if (!nextDirectors.length) {
					setDirectors(fallbackDirectors);
				}

				if (!nextPeople.length) {
					setPopularPeople(fallbackPeople);
				}

				if (!nextAwards.length) {
					setAwards(fallbackAwards);
				}
			} catch {
				// Keep fallback values on any error.
			}
		};

		loadCollections();

		return () => {
			isActive = false;
		};
	}, []);


	const getTitleName = (item: TmdbListItem) => item.title ?? item.name ?? "-";
	const getTitleYear = (item: TmdbListItem) =>
		item.release_date?.slice(0, 4) ?? item.first_air_date?.slice(0, 4) ?? "-";
	const getTitleType = (item: TmdbListItem) => resolveMediaType(item);
	const getTitleHref = (item: TmdbListItem) => {
		const type = getTitleType(item);
		return `/title/${type}/${item.id}?type=${type}&page=1`;
	};

	const heroItems = useMemo(() => {
		const seen = new Set<string>();
		const merged = [...topSearches, ...popularNow, ...mostViewed];
		const unique: TmdbListItem[] = [];

		for (const entry of merged) {
			const type = resolveMediaType(entry);
			const key = `${type}-${entry.id}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			unique.push(entry);
			if (unique.length >= 8) {
				break;
			}
		}

		return unique;
	}, [topSearches, popularNow, mostViewed]);

	useEffect(() => {
		if (heroItems.length <= 1) {
			return;
		}

		const timer = setInterval(() => {
			setHeroIndex((current) => (current + 1) % heroItems.length);
		}, 4500);

		return () => clearInterval(timer);
	}, [heroItems.length]);

	useEffect(() => {
		if (!heroItems.length) {
			setHeroIndex(0);
			return;
		}
		if (heroIndex > heroItems.length - 1) {
			setHeroIndex(0);
		}
	}, [heroIndex, heroItems.length]);

	const openTrendingModal = async (movieId: number) => {
		setIsTrendingModalOpen(true);
		setSelectedTrendingId(movieId);
		setTrendingDetails(null);
		setTrendingDetailsError(null);
		setTrendingDetailsLoading(true);

		try {
			const response = await fetch(`/api/imdb/title-details?media_type=movie&id=${movieId}`);
			if (!response.ok) {
				throw new Error("Não foi possível carregar os dados do filme.");
			}
			const data = (await response.json()) as TrendingDetails;
			setTrendingDetails(data);
		} catch {
			setTrendingDetailsError("Não foi possível carregar os dados do filme no momento.");
		} finally {
			setTrendingDetailsLoading(false);
		}
	};

	const closeTrendingModal = () => {
		setIsTrendingModalOpen(false);
		setSelectedTrendingId(null);
		setTrendingDetails(null);
		setTrendingDetailsError(null);
		setTrendingDetailsLoading(false);
	};

	const currentHero = heroItems[heroIndex] ?? topSearches[0] ?? fallbackTitles[0];
	const currentHeroType = getTitleType(currentHero);
	const currentHeroName = getTitleName(currentHero);
	const currentHeroYear = getTitleYear(currentHero);
	const currentHeroPoster = currentHero.poster_path
		? `${imageBase}/w780${currentHero.poster_path}`
		: "/placeholders/title-fallback.svg";
	const currentHeroBackdrop = currentHero.backdrop_path
		? `${imageBase}/w1280${currentHero.backdrop_path}`
		: currentHeroPoster;
	const currentHeroGenres =
		(currentHero.genre_ids ?? [])
			.map((genreId) => {
				const source = currentHeroType === "movie" ? movieGenreOptions : tvGenreOptions;
				return source.find((entry) => entry.id === genreId)?.label;
			})
			.filter((label): label is string => Boolean(label))
			.slice(0, 3);

	const shiftHero = (direction: "prev" | "next") => {
		if (!heroItems.length) {
			return;
		}
		setHeroIndex((current) => {
			if (direction === "next") {
				return (current + 1) % heroItems.length;
			}
			return (current - 1 + heroItems.length) % heroItems.length;
		});
	};

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<div className="relative overflow-hidden">
				<div className="app-home-bg absolute inset-0" />
				<div className="app-home-glow absolute inset-x-0 top-16 h-40 blur-3xl" />

				<section className="relative px-4 pb-10 pt-20 sm:px-8 lg:px-12">
					<motion.div className="mx-auto flex w-full max-w-315 flex-col gap-6" variants={container} initial={false} animate="show">
						<motion.div variants={item} className="px-2">
							<div className="app-brand-shell relative mx-auto max-w-5xl px-4 py-6 text-center sm:px-8 sm:py-8">
								<span className="app-brand-kicker inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-100/90 sm:text-[11px]">
									Plataforma de cinema
								</span>
								<h2 className="app-brand-title mt-3 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-rose-200 via-white to-sky-200 sm:text-5xl lg:text-6xl">
									MovieDataX
								</h2>
								<p className="app-brand-subtitle mx-auto mt-3 max-w-3xl text-base text-white/78 sm:text-lg lg:text-xl">
									Seu hub inteligente para explorar filmes e o que realmente importa no cinema.
								</p>
							</div>
						</motion.div>

						<motion.div variants={item} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50">
							<div className="relative">
								<div className="relative h-48 sm:h-64 lg:h-82">
									<Image
										alt={currentHeroName}
										src={currentHeroBackdrop}
										fill
										sizes="100vw"
										className="object-cover"
									/>
									<div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/20" />
									<div className="app-hero-overlay absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
								</div>

								<button type="button" onClick={() => shiftHero("prev")} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white/80 transition hover:text-white" aria-label="Anterior">
									<ChevronLeft className="h-5 w-5" />
								</button>
								<button type="button" onClick={() => shiftHero("next")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white/80 transition hover:text-white" aria-label="Próximo">
									<ChevronRight className="h-5 w-5" />
								</button>

								<div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
									<p className="app-hero-subtitle text-xs uppercase tracking-[0.32em] text-white/70">Destaque da semana</p>
									<h1 className="app-hero-title mt-2 max-w-2xl text-2xl font-semibold text-white sm:text-3xl lg:text-5xl">{currentHeroName}</h1>
									<div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
										<span className="app-hero-chip rounded-full bg-white/15 px-3 py-1 font-medium">{currentHeroYear}</span>
										<span className="app-hero-chip rounded-full bg-white/15 px-3 py-1 font-medium">{currentHeroType === "movie" ? "Filme" : "Série"}</span>
										<span className="app-hero-chip app-rating-chip rounded-full bg-white/15 px-3 py-1 font-medium"><Star className="h-3.5 w-3.5" /> {currentHero.vote_average?.toFixed(1) ?? "-"}</span>
										{currentHeroGenres.map((genre) => (
											<span key={genre} className="app-hero-chip rounded-full bg-white/15 px-3 py-1 font-medium">{genre}</span>
										))}
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-2">
										<button
											type="button"
											onClick={() => void openTrendingModal(currentHero.id)}
											className="app-hero-cta-primary inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
										>
											<Play className="h-4 w-4" /> Assistir trailer
										</button>
										<Link href={getTitleHref(currentHero)} className="app-hero-cta-secondary inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white">
											<ArrowUpRight className="h-4 w-4" /> Ver detalhes
										</Link>
									</div>
								</div>
							</div>
						</motion.div>

						<motion.div variants={item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<form className="col-span-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
								<Search className="h-5 w-5 text-rose-200" />
								<input className="w-full bg-transparent text-white/85 placeholder:text-white/40 focus:outline-none" placeholder="Buscar por filmes ou diretores" value={query} onChange={(event) => setQuery(event.target.value)} />
							</form>
							<Link href="/titles" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-rose-300/60"><Clapperboard className="h-4 w-4" />Catálogo</Link>
							<Link href="/awards" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-rose-300/60"><Award className="h-4 w-4" />Premiações</Link>
							<Link href="/people" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-rose-300/60"><Users className="h-4 w-4" />Pessoas</Link>
							<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90">{apiSourcesCount}+ fontes de API</div>
						</motion.div>

						<motion.div variants={item} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
							<div className="space-y-6">
								<div>
									<div className="mb-3 flex items-center justify-between">
										<h2 className="text-2xl font-semibold text-white">Para você</h2>
										<Link href="/titles" className="text-sm text-white/70 hover:text-white">Ver todos</Link>
									</div>
									<div ref={setRowRef("row-top")} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
										{topSearches.slice(0, 8).map((entry) => {
											const name = getTitleName(entry);
											const type = getTitleType(entry);
											const firstGenre = (entry.genre_ids ?? [])
												.map((genreId) => {
													const source = type === "movie" ? movieGenreOptions : tvGenreOptions;
													return source.find((genre) => genre.id === genreId)?.label;
												})
												.find((label): label is string => Boolean(label));
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`top-${entry.id}`} href={getTitleHref(entry)} className="group block w-38 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50 sm:w-42">
													<div className="relative aspect-2/3"><Image alt={name} src={poster} fill sizes="180px" className="object-cover" /><div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" /></div>
													<div className="absolute" />
													<div className="-mt-16 p-3">
														<p className="app-poster-title line-clamp-2 text-sm font-semibold text-white">{name}</p>
														<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{getTitleYear(entry)}</span>
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{type === "movie" ? "Filme" : "Série"}</span>
															{firstGenre ? (
																<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{firstGenre}</span>
															) : null}
															<span className="app-main-poster-chip app-rating-chip rounded-full px-2 py-0.5 text-[11px] font-semibold"><Star className="h-3 w-3" /> {entry.vote_average?.toFixed(1) ?? "-"}</span>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</div>

								<div>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="inline-flex items-center gap-2 text-xl font-semibold text-white"><TrendingUp className="h-5 w-5 text-rose-200" />Mais populares</h3>
										<div className="hidden items-center gap-2 lg:flex">
											<button type="button" onClick={() => scrollRow("row-pop", "prev")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Anterior</button>
											<button type="button" onClick={() => scrollRow("row-pop", "next")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Próximo</button>
										</div>
									</div>
									<div ref={setRowRef("row-pop")} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
										{popularNow.slice(0, 8).map((entry) => {
											const name = getTitleName(entry);
											const type = getTitleType(entry);
											const firstGenre = (entry.genre_ids ?? [])
												.map((genreId) => {
													const source = type === "movie" ? movieGenreOptions : tvGenreOptions;
													return source.find((genre) => genre.id === genreId)?.label;
												})
												.find((label): label is string => Boolean(label));
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`pop-${entry.id}`} href={getTitleHref(entry)} className="block w-38 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50 sm:w-42">
													<div className="relative aspect-2/3"><Image alt={name} src={poster} fill sizes="180px" className="object-cover" /><div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" /></div>
													<div className="-mt-16 p-3">
														<p className="app-poster-title line-clamp-2 text-sm font-semibold text-white">{name}</p>
														<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{getTitleYear(entry)}</span>
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{type === "movie" ? "Filme" : "Série"}</span>
															{firstGenre ? (
																<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{firstGenre}</span>
															) : null}
															<span className="app-main-poster-chip app-rating-chip rounded-full px-2 py-0.5 text-[11px] font-semibold"><Star className="h-3 w-3" /> {entry.vote_average?.toFixed(1) ?? "-"}</span>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</div>

								<div>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="inline-flex items-center gap-2 text-xl font-semibold text-white"><Star className="h-5 w-5 text-amber-300" />Favoritos do público</h3>
										<div className="hidden items-center gap-2 lg:flex">
											<button type="button" onClick={() => scrollRow("row-favorites", "prev")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Anterior</button>
											<button type="button" onClick={() => scrollRow("row-favorites", "next")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Próximo</button>
										</div>
									</div>
									<div ref={setRowRef("row-favorites")} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
										{publicFavorites.slice(0, 8).map((entry) => {
											const name = getTitleName(entry);
											const type = getTitleType(entry);
											const firstGenre = (entry.genre_ids ?? [])
												.map((genreId) => {
													const source = type === "movie" ? movieGenreOptions : tvGenreOptions;
													return source.find((genre) => genre.id === genreId)?.label;
												})
												.find((label): label is string => Boolean(label));
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`favorite-${entry.id}`} href={getTitleHref(entry)} className="block w-38 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50 sm:w-42">
													<div className="relative aspect-2/3"><Image alt={name} src={poster} fill sizes="180px" className="object-cover" /><div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" /></div>
													<div className="-mt-16 p-3">
														<p className="app-poster-title line-clamp-2 text-sm font-semibold text-white">{name}</p>
														<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{getTitleYear(entry)}</span>
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{type === "movie" ? "Filme" : "Série"}</span>
															{firstGenre ? <span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{firstGenre}</span> : null}
															<span className="app-main-poster-chip app-rating-chip rounded-full px-2 py-0.5 text-[11px] font-semibold"><Star className="h-3 w-3" /> {entry.vote_average?.toFixed(1) ?? "-"}</span>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</div>

								<div>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="inline-flex items-center gap-2 text-xl font-semibold text-white"><Sparkles className="h-5 w-5 text-rose-200" />Sessão Kids</h3>
										<div className="hidden items-center gap-2 lg:flex">
											<button type="button" onClick={() => scrollRow("row-kids", "prev")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Anterior</button>
											<button type="button" onClick={() => scrollRow("row-kids", "next")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Próximo</button>
										</div>
									</div>
									<div ref={setRowRef("row-kids")} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
										{kidsNow.slice(0, 8).map((entry) => {
											const name = getTitleName(entry);
											const type = getTitleType(entry);
											const firstGenre = (entry.genre_ids ?? [])
												.map((genreId) => {
													const source = type === "movie" ? movieGenreOptions : tvGenreOptions;
													return source.find((genre) => genre.id === genreId)?.label;
												})
												.find((label): label is string => Boolean(label));
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`kids-${entry.id}`} href={getTitleHref(entry)} className="block w-38 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50 sm:w-42">
													<div className="relative aspect-2/3"><Image alt={name} src={poster} fill sizes="180px" className="object-cover" /><div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" /></div>
													<div className="-mt-16 p-3">
														<p className="app-poster-title line-clamp-2 text-sm font-semibold text-white">{name}</p>
														<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{getTitleYear(entry)}</span>
															<span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{type === "movie" ? "Filme" : "Série"}</span>
															{firstGenre ? <span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">{firstGenre}</span> : <span className="app-main-poster-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">Kids</span>}
															<span className="app-main-poster-chip app-rating-chip rounded-full px-2 py-0.5 text-[11px] font-semibold"><Star className="h-3 w-3" /> {entry.vote_average?.toFixed(1) ?? "-"}</span>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</div>

								<div>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="text-xl font-semibold text-white">Mais vistos</h3>
										<Link href="/titles" className="text-sm text-white/70 hover:text-white">Ver todos</Link>
									</div>
									<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
										{mostViewed.slice(0, 6).map((entry) => {
											const name = getTitleName(entry);
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`viewed-${entry.id}`} href={getTitleHref(entry)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-rose-300/50">
													<div className="relative h-20 w-14 overflow-hidden rounded-xl"><Image alt={name} src={poster} fill sizes="56px" className="object-cover" /></div>
													<div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-white">{name}</p><p className="mt-1 text-xs text-white/70">{getTitleYear(entry)} • {getTitleType(entry) === "movie" ? "Filme" : "Série"}</p></div>
												</Link>
											);
										})}
									</div>
								</div>
							</div>

							<aside className="space-y-4">
								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<div className="mb-3 flex items-center justify-between">
										<p className="text-sm font-semibold text-white">Tendências da semana</p>
										<LineChart className="h-4 w-4 text-rose-200" />
									</div>
									<div className="space-y-2">
										{trending.slice(0, 5).map((movie) => (
											<button key={movie.id} type="button" onClick={() => void openTrendingModal(movie.id)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-rose-300/50">
												<div><p className="text-sm font-semibold text-white">{movie.title}</p><p className="text-xs text-white/55">{movie.year}</p></div>
												<span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">{movie.trend}</span>
											</button>
										))}
									</div>
								</div>

								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<div className="mb-3 flex items-center justify-between">
										<p className="text-sm font-semibold text-white">Em alta</p>
										<Link href="/titles" className="text-xs text-white/60 hover:text-white">Ver todos</Link>
									</div>
									<div className="space-y-3">
										{topRated.slice(0, 3).map((entry) => {
											const name = getTitleName(entry);
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											return (
												<Link key={`side-${entry.id}`} href={getTitleHref(entry)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 transition hover:border-rose-300/50">
													<div className="relative h-14 w-10 overflow-hidden rounded-lg"><Image alt={name} src={poster} fill sizes="40px" className="object-cover" /></div>
													<div className="min-w-0"><p className="line-clamp-1 text-sm font-semibold text-white">{name}</p><p className="text-xs text-white/60">⭐ {entry.vote_average?.toFixed(1) ?? "-"}</p></div>
												</Link>
											);
										})}
									</div>
								</div>

								<div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
									<p className="font-semibold text-white">Dados de API ativos</p>
									<p className="mt-1">{apiSourcesCount}+ fontes, {topSearches.length + mostViewed.length + popularNow.length + discoverNow.length} títulos processados.</p>
								</div>

								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-rose-200" />Atores em alta</p>
									<div className="space-y-2">
										{popularPeople.slice(0, 3).map((person) => (
											<Link key={`home-person-${person.id}`} href={`/person/${person.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 transition hover:border-rose-300/50">
												<span>{person.name}</span>
												<span className="text-xs text-white/60">{person.popularity?.toFixed(1) ?? "-"}</span>
											</Link>
										))}
									</div>
								</div>

								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white"><Award className="h-4 w-4 text-rose-200" />Premiações</p>
									<div className="space-y-2">
										{awards.slice(0, 2).map((entry) => (
											<Link key={`home-award-${entry.id}`} href={`/title/${entry.media_type}/${entry.id}?type=${entry.media_type}&page=1`} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-rose-300/50">
												<p className="text-sm font-semibold text-white">{entry.title}</p>
												<p className="mt-1 text-xs text-white/60">{entry.source_awards.join(" • ")}</p>
											</Link>
										))}
									</div>
								</div>

								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white"><Clapperboard className="h-4 w-4 text-rose-200" />Diretores</p>
									<div className="space-y-2">
										{directors.slice(0, 3).map((entry) => (
											<Link key={`home-director-${entry.id}`} href={`/title/movie/${entry.id}?type=movie&page=1`} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-rose-300/50">
												<p className="text-sm font-semibold text-white">{entry.director}</p>
												<p className="mt-1 text-xs text-white/60">{entry.title}</p>
											</Link>
										))}
									</div>
								</div>
							</aside>
						</motion.div>
					</motion.div>
				</section>
			</div>

			{isTrendingModalOpen && (
				<div className="fixed inset-0 z-90 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
					<button
						type="button"
						onClick={closeTrendingModal}
						className="absolute inset-0 bg-black/70 backdrop-blur-sm"
						aria-label="Fechar modal"
					/>
					<div className="relative z-10 my-2 w-full max-w-100 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d14] shadow-2xl shadow-black/60 sm:my-0 sm:max-w-3xl sm:rounded-3xl">
						<div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-r from-rose-500/20 via-amber-400/10 to-fuchsia-500/20 blur-2xl" />
						<button
							type="button"
							onClick={closeTrendingModal}
							className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 transition hover:text-white"
							aria-label="Fechar"
						>
							<X className="h-4 w-4" />
						</button>

						{trendingDetailsLoading && (
							<div className="p-6 text-center text-sm text-white/70 sm:p-8">Carregando dados do filme...</div>
						)}

						{!trendingDetailsLoading && trendingDetailsError && (
							<div className="p-6 text-center text-sm text-white/70 sm:p-8">{trendingDetailsError}</div>
						)}

						{!trendingDetailsLoading && !trendingDetailsError && trendingDetails && (
							<div className="grid max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-6.5rem)] md:grid-cols-[220px_1fr]">
								<div className="relative hidden bg-white/10 md:block md:min-h-80">
									<Image
										alt={trendingDetails.title}
										src={trendingDetails.poster_path ? `${imageBase}/w500${trendingDetails.poster_path}` : "/placeholders/title-fallback.svg"}
										fill
										sizes="(min-width: 768px) 220px, 100vw"
										className="object-cover"
									/>
								</div>

								<div className="space-y-3 overflow-y-auto p-4 pr-12 sm:space-y-4 sm:p-5 sm:pr-14 md:pr-12">
									<div className="mx-auto w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:hidden">
										<div className="relative aspect-2/3">
											<Image
												alt={trendingDetails.title}
												src={trendingDetails.poster_path ? `${imageBase}/w500${trendingDetails.poster_path}` : "/placeholders/title-fallback.svg"}
												fill
												sizes="96px"
												className="object-cover"
											/>
										</div>
									</div>

									<div className="text-center md:text-left">
										<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200 sm:text-xs sm:tracking-[0.3em]">Tendência da semana</p>
										<h3 className="mt-2 text-lg font-semibold text-white sm:text-xl md:text-2xl">{trendingDetails.title}</h3>
										{trendingDetails.tagline ? (
											<p className="mt-2 text-xs text-white/70 sm:text-sm">{trendingDetails.tagline}</p>
										) : null}
									</div>

									<div className="grid grid-cols-2 gap-2">
										<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
											<Star className="h-3.5 w-3.5 text-amber-300" />
											Nota: {trendingDetails.vote_average?.toFixed(1) ?? "-"}
										</span>
										<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
											<Users className="h-3.5 w-3.5 text-rose-200" />
											Votos: {trendingDetails.vote_count?.toLocaleString("pt-BR") ?? "-"}
										</span>
										<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
											<Calendar className="h-3.5 w-3.5 text-rose-200" />
											Ano: {(trendingDetails.release_date ?? trendingDetails.first_air_date)?.slice(0, 4) ?? "-"}
										</span>
										<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
											<Clock3 className="h-3.5 w-3.5 text-rose-200" />
											Duração: {trendingDetails.runtime ? `${trendingDetails.runtime} min` : (trendingDetails.episode_run_time?.[0] ? `${trendingDetails.episode_run_time[0]} min` : "-")}
										</span>
									</div>

									<div className="flex flex-wrap gap-2">
										<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
											Status: {trendingDetails.status ?? "-"}
										</span>
										<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
											Popularidade: {trendingDetails.popularity?.toFixed(1) ?? "-"}
										</span>
									</div>

									{trendingDetails.genres && trendingDetails.genres.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{trendingDetails.genres.slice(0, 6).map((genre) => (
												<Link
													key={genre.id}
													href={`/titles?type=${trendingDetails.media_type ?? "movie"}&genre=${genre.id}&page=1`}
													className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-300/60 hover:text-rose-100"
												>
													{genre.name}
												</Link>
											))}
										</div>
									)}

									<p className="text-xs leading-relaxed text-white/75 sm:text-sm">
										{trendingDetails.overview || "Sem descrição disponível para este título."}
									</p>

									<div className="flex flex-wrap justify-center gap-2 md:justify-start">
										<Link
											href={`/title/${trendingDetails.media_type ?? "movie"}/${selectedTrendingId ?? trendingDetails.id}?type=${trendingDetails.media_type ?? "movie"}&page=1`}
											className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-rose-500 sm:text-xs sm:tracking-[0.2em]"
										>
											Ver página completa
										</Link>
										<Link
											href={`/search?q=${encodeURIComponent(trendingDetails.title)}`}
											className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 transition hover:text-white sm:text-xs sm:tracking-[0.2em]"
										>
											Buscar similares
										</Link>
										{trendingDetails.homepage ? (
											<Link
												href={trendingDetails.homepage}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 transition hover:text-white sm:text-xs sm:tracking-[0.2em]"
											>
												Site oficial
											</Link>
										) : null}
										<button
											type="button"
											onClick={closeTrendingModal}
											className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 transition hover:text-white sm:text-xs sm:tracking-[0.2em]"
										>
											Fechar
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</main>
	);
}
