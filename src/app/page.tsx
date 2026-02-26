"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import {
	ArrowUpRight,
	Award,
	Clapperboard,
	LineChart,
	Search,
	Sparkles,
	Star,
	TrendingUp,
	Users,
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
	const [query, setQuery] = useState("");
	const [trending, setTrending] = useState<TrendingCard[]>(fallbackTrending);
	const [topSearches, setTopSearches] = useState<TmdbListItem[]>(fallbackTitles);
	const [mostViewed, setMostViewed] = useState<TmdbListItem[]>(fallbackTitles);
	const [topRated, setTopRated] = useState<TmdbListItem[]>(fallbackTitles);
	const [directors, setDirectors] = useState<DirectorSpot[]>(fallbackDirectors);
	const [popularPeople, setPopularPeople] = useState<PopularPersonSpot[]>(fallbackPeople);
	const [awards, setAwards] = useState<AwardSpot[]>(fallbackAwards);

	const handleSearch = () => {
		const trimmed = query.trim();
		if (!trimmed) {
			return;
		}
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
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

				const [searches, viewed, topRatedData, directorsData, popularPeopleData, awardsData] = await Promise.all([
					fetchJson("/api/imdb/top-searches"),
					fetchJson("/api/imdb/most-viewed"),
					fetchJson("/api/imdb/top-rated"),
					fetchJson("/api/imdb/directors"),
					fetchJson("/api/imdb/popular-people"),
					fetchJson("/api/imdb/awards?page=1&limit=9"),
				]);

				if (!isActive) {
					return;
				}

				const nextTopSearches = normalizeList((searches?.results ?? []).slice(0, 12));
				const nextMostViewed = normalizeList((viewed?.results ?? []).slice(0, 12));
				const nextTopRated = normalizeList(
					(topRatedData?.results ?? []).map((item: TmdbListItem) => ({
						...item,
						media_type: "movie",
					}))
				);
				const nextDirectors = (directorsData?.results ?? []).slice(0, 6);
				const nextPeople = (popularPeopleData?.results ?? []).slice(0, 9);
				const nextAwards = (awardsData?.results ?? []).slice(0, 9) as AwardSpot[];

				if (nextTopSearches.length) {
					setTopSearches(nextTopSearches);
				}
				if (nextMostViewed.length) {
					setMostViewed(nextMostViewed);
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

				if (!nextTopSearches.length && !nextMostViewed.length && !nextTopRated.length) {
					setTopSearches(fallbackTitles);
					setMostViewed(fallbackTitles);
					setTopRated(fallbackTitles);
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
	const getAwardYear = (item: AwardSpot) =>
		item.release_date?.slice(0, 4) ?? item.first_air_date?.slice(0, 4) ?? "-";

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<div className="relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-24 h-48 bg-linear-to-r from-rose-600/25 via-red-500/15 to-amber-400/10 blur-3xl" />

				<section className="relative px-6 pb-16 pt-20 sm:px-10 lg:px-16">
					<motion.div
						className="mx-auto grid max-w-6xl gap-10"
						variants={container}
						initial={false}
						animate="show"
					>
						<motion.div
							className="flex flex-col items-center gap-4 text-center"
							variants={item}
						>
							<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
								<TrendingUp className="h-4 w-4" />
								Plataforma
							</span>
							<span className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
								MovieDataX
							</span>
							<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
								Análise real de tendências e desempenho em um só painel.
							</h1>
							<p className="max-w-2xl text-base text-white/70 sm:text-lg">
								Dados vivos do TMDB com recortes claros: nota media, faixa de anos e
								volume semanal. Tudo pronto para orientar o que assistir.
							</p>
						</motion.div>

						<motion.div
							className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
							variants={item}
						>
							<div className="flex flex-col gap-4">
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
									Busque agora
								</p>
								<form
									className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3"
									onSubmit={(event) => {
										event.preventDefault();
										handleSearch();
									}}
								>
									<Search className="h-5 w-5 text-rose-200" />
									<input
										className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
										placeholder="Buscar por filme ou diretor"
										type="text"
										value={query}
										onChange={(event) => setQuery(event.target.value)}
									/>
								</form>
								<button
									type="button"
									onClick={handleSearch}
									className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:-translate-y-0.5 hover:bg-rose-500"
								>
									<ArrowUpRight className="h-4 w-4" />
									Explorar painéis
								</button>
							</div>

							<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40">
								<div className="flex items-center justify-between">
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
										Tendências da semana
									</p>
									<LineChart className="h-5 w-5 text-rose-200" />
								</div>
								<div className="mt-6 space-y-4">
									{trending.map((movie) => (
										<div
											key={movie.id}
											className="rounded-2xl border border-white/10 bg-linear-to-r from-white/5 via-white/10 to-white/5 px-4 py-3"
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="text-base font-semibold text-white">
														{movie.title}
													</p>
													<p className="text-xs uppercase tracking-[0.3em] text-white/45">
														{movie.year}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white">
														<Star className="h-3 w-3" />
														{movie.rating}
													</span>
													<span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
														{movie.trend}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</motion.div>
					</motion.div>
				</section>
			</div>

			<section id="categorias-destaque" className="relative px-6 pb-24 sm:px-10 lg:px-16">
				<motion.div
					className="mx-auto grid max-w-6xl gap-8"
					variants={container}
					initial={false}
					whileInView="show"
					viewport={{ once: true, amount: 0.2 }}
				>
					<motion.div
						className="flex flex-wrap items-center justify-between gap-4"
						variants={item}
					>
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
								Categorias em destaque
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-white">
								Explore gêneros sem filtros.
							</h2>
						</div>
						<span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
							Fonte: TMDB
						</span>
					</motion.div>

					<motion.div className="grid gap-6 lg:grid-cols-2" variants={item}>
						<div className="rounded-3xl border border-white/10 bg-white/5 p-6">
							<div className="flex items-center gap-2 text-white">
								<Clapperboard className="h-5 w-5 text-rose-200" />
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Filmes por gênero
								</p>
							</div>
							<p className="mt-4 text-sm text-white/70">
								Clique para navegar pelas categorias de filmes.
							</p>
							<div className="mt-5 flex flex-wrap gap-2">
								{movieGenreOptions.slice(1).map((genre) => (
									<Link
										key={genre.id}
										href={`/titles?type=movie&genre=${genre.id}&page=1`}
										className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
									>
										{genre.label}
									</Link>
								))}
							</div>
							<Link
								href="/titles"
								className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
							>
								Ver catálogo por categorias
							</Link>
						</div>

						<div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/5 via-white/10 to-white/5 p-6">
							<div className="flex items-center gap-2 text-white">
								<Sparkles className="h-5 w-5 text-rose-200" />
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Séries por gênero
								</p>
							</div>
							<p className="mt-4 text-sm text-white/70">
								Descubra as séries mais fortes por categoria.
							</p>
							<div className="mt-5 flex flex-wrap gap-2">
								{tvGenreOptions.slice(1).map((genre) => (
									<Link
										key={genre.id}
										href={`/titles?type=tv&genre=${genre.id}&page=1`}
										className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
									>
										{genre.label}
									</Link>
								))}
							</div>
						</div>
					</motion.div>

					<motion.div className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Mais buscados
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Títulos que estão no radar agora.
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/titles"
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
								>
									Ver todos
								</Link>
								<LineChart className="h-5 w-5 text-rose-200" />
							</div>
						</motion.div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{topSearches.slice(0, 8).map((titleItem) => {
								const name = getTitleName(titleItem);
								const year = getTitleYear(titleItem);
								const type = getTitleType(titleItem);
								const poster = titleItem.poster_path
									? `${imageBase}/w500${titleItem.poster_path}`
									: undefined;

								const href = getTitleHref(titleItem);
								return (
									<Link key={`${type}-${titleItem.id}`} href={href} className="block">
										<motion.div
											className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50"
											variants={item}
										>
										<div className="relative aspect-2/3 bg-white/10">
											{poster ? (
												<Image
													alt={name}
													src={poster}
													fill
													sizes="(min-width: 1024px) 12rem, (min-width: 640px) 40vw, 70vw"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-white/50">
													Poster indisponível
												</div>
											)}
										</div>
										<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
										<div className="absolute bottom-0 left-0 right-0 p-4">
											<p className="text-sm font-semibold text-white">{name}</p>
											<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
												<span className="rounded-full bg-white/10 px-2 py-1">
													{year}
												</span>
												<span className="rounded-full bg-white/10 px-2 py-1">
													{type === "movie" ? "Filme" : "Série"}
												</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
													<Star className="h-3 w-3" />
													{titleItem.vote_average?.toFixed(1) ?? "-"}
												</span>
											</div>
										</div>
										</motion.div>
									</Link>
								);
							})}
							{topSearches.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-4">
									Nenhum título encontrado com os filtros atuais.
								</div>
							)}
						</div>
					</motion.div>

					<motion.div className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Mais vistos agora
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Destaques com mais visualizações recentes.
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/titles"
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
								>
									Ver todos
								</Link>
								<TrendingUp className="h-5 w-5 text-rose-200" />
							</div>
						</motion.div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{mostViewed.slice(0, 8).map((titleItem) => {
								const name = getTitleName(titleItem);
								const year = getTitleYear(titleItem);
								const type = getTitleType(titleItem);
								const poster = titleItem.poster_path
									? `${imageBase}/w500${titleItem.poster_path}`
									: undefined;

								const href = getTitleHref(titleItem);
								return (
									<Link key={`${type}-${titleItem.id}`} href={href} className="block">
										<motion.div
											className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-rose-300/50"
											variants={item}
										>
										<div className="relative aspect-2/3 bg-white/10">
											{poster ? (
												<Image
													alt={name}
													src={poster}
													fill
													sizes="(min-width: 1024px) 12rem, (min-width: 640px) 40vw, 70vw"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-white/50">
													Poster indisponível
												</div>
											)}
										</div>
										<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
										<div className="absolute bottom-0 left-0 right-0 p-4">
											<p className="text-sm font-semibold text-white">{name}</p>
											<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
												<span className="rounded-full bg-white/10 px-2 py-1">
													{year}
												</span>
												<span className="rounded-full bg-white/10 px-2 py-1">
													{type === "movie" ? "Filme" : "Série"}
												</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
													<Star className="h-3 w-3" />
													{titleItem.vote_average?.toFixed(1) ?? "-"}
												</span>
											</div>
										</div>
									</motion.div>
									</Link>
								);
							})}
							{mostViewed.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-4">
									Nenhum título encontrado com os filtros atuais.
								</div>
							)}
						</div>
					</motion.div>

					<motion.div className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Avaliações mais altas
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Filmes com melhor nota do publico.
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/titles"
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
								>
									Ver todos
								</Link>
								<Star className="h-5 w-5 text-rose-200" />
							</div>
						</motion.div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{topRated.slice(0, 6).map((titleItem) => {
								const name = getTitleName(titleItem);
								const year = getTitleYear(titleItem);
								const poster = titleItem.poster_path
									? `${imageBase}/w500${titleItem.poster_path}`
									: undefined;

								const href = `/title/movie/${titleItem.id}?type=movie&page=1`;
								return (
									<Link key={`top-${titleItem.id}`} href={href} className="block">
										<motion.div
											className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-rose-300/50"
											variants={item}
										>
										<div className="relative h-32 w-24 overflow-hidden rounded-2xl bg-white/10">
											{poster ? (
												<Image
													alt={name}
													src={poster}
													fill
													sizes="96px"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-white/50">
													Poster indisponível
												</div>
											)}
										</div>
										<div className="flex flex-1 flex-col justify-between">
											<div>
												<p className="text-lg font-semibold text-white">{name}</p>
												<p className="text-xs uppercase tracking-[0.3em] text-white/50">
													{year}
												</p>
											</div>
											<span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
												<Star className="h-3 w-3" />
												{titleItem.vote_average?.toFixed(1) ?? "-"}
											</span>
										</div>
									</motion.div>
									</Link>
								);
							})}
							{topRated.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
									Sem filmes para o filtro atual.
								</div>
							)}
						</div>
					</motion.div>

					<motion.div className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Diretores em destaque
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Olhar de quem está guiando as produções.
								</h3>
							</div>
							<Clapperboard className="h-5 w-5 text-rose-200" />
						</motion.div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{directors.map((entry) => {
								const poster = entry.poster_path
									? `${imageBase}/w500${entry.poster_path}`
									: undefined;
								const href = `/title/movie/${entry.id}?type=movie&page=1`;
								const year = entry.release_date?.slice(0, 4) ?? "-";

								return (
									<Link key={`director-${entry.id}`} href={href} className="block">
										<motion.div
											className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-rose-300/50"
											variants={item}
										>
										<div className="relative h-32 w-24 overflow-hidden rounded-2xl bg-white/10">
											{poster ? (
												<Image
													alt={entry.title}
													src={poster}
													fill
													sizes="96px"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-white/50">
													Poster indisponível
												</div>
											)}
										</div>
										<div className="flex flex-1 flex-col justify-between">
											<div>
												<p className="text-base font-semibold text-white">{entry.director}</p>
												<p className="text-sm text-white/70">{entry.title}</p>
												<p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/50">
													{year}
												</p>
											</div>
											<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
												<Star className="h-3 w-3" />
												{entry.vote_average?.toFixed(1) ?? "-"}
											</span>
										</div>
									</motion.div>
									</Link>
								);
							})}
							{directors.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
									Nenhum diretor encontrado.
								</div>
							)}
						</div>
					</motion.div>

					<motion.div className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Atores populares
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Perfis em alta no TMDB com títulos conhecidos.
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/people"
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
								>
									Ver todos
								</Link>
								<Users className="h-5 w-5 text-rose-200" />
							</div>
						</motion.div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{popularPeople.map((person) => {
								const profile = person.profile_path
									? `${imageBase}/w500${person.profile_path}`
									: undefined;

								return (
									<Link key={`person-${person.id}`} href={`/person/${person.id}`} className="block">
										<motion.div
											className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-rose-300/50"
											variants={item}
										>
										<div className="flex gap-4">
											<div className="relative h-32 w-24 overflow-hidden rounded-2xl bg-white/10">
												{profile ? (
													<Image
														alt={person.name}
														src={profile}
														fill
														sizes="96px"
														className="object-cover"
													/>
												) : (
													<div className="flex h-full items-center justify-center text-xs text-white/50">
														Sem foto
													</div>
												)}
											</div>
											<div className="flex-1">
												<p className="text-base font-semibold text-white">{person.name}</p>
												<p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
													{person.known_for_department ?? "Atuação"}
												</p>
												<p className="mt-2 inline-flex rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">
													Popularidade: {person.popularity?.toFixed(1) ?? "-"}
												</p>
											</div>
										</div>
										<div className="mt-4 flex flex-wrap gap-2">
											{person.known_for_titles.length > 0 ? (
												person.known_for_titles.map((knownTitle) => (
													<span
														key={`${person.id}-${knownTitle}`}
														className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
													>
														{knownTitle}
													</span>
												))
											) : (
												<span className="text-xs text-white/50">Sem títulos conhecidos</span>
											)}
										</div>
										</motion.div>
									</Link>
								);
							})}
							{popularPeople.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
									Nenhum ator popular encontrado.
								</div>
							)}
						</div>
					</motion.div>

					<motion.div id="oscar-premiacoes" className="grid gap-4" variants={container}>
						<motion.div className="flex items-center justify-between" variants={item}>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
									Premiações do Oscar
								</p>
								<h3 className="mt-2 text-2xl font-semibold text-white">
									Premiações em dados reais da API.
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/awards"
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
								>
									Acessar tudo
								</Link>
								<Award className="h-5 w-5 text-rose-200" />
							</div>
						</motion.div>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{awards.map((winner) => (
								<Link
									key={`${winner.media_type}-${winner.id}`}
									href={`/title/${winner.media_type}/${winner.id}?type=${winner.media_type}&page=1`}
									className="block rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-rose-300/50"
								>
									<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
										{winner.source_awards.join(" • ")}
									</p>
									<p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
										{winner.media_type === "movie" ? "Filme" : "Série"} • {getAwardYear(winner)}
									</p>
									<h4 className="mt-2 text-xl font-semibold text-white">{winner.title}</h4>
									<p className="mt-2 line-clamp-3 text-sm text-white/75">
										{winner.overview || "Sem descrição disponível."}
									</p>
									<p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/90">
										Ver detalhes do título
									</p>
								</Link>
							))}
							{awards.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
									Nenhuma premiação encontrada no momento.
								</div>
							)}
						</div>
					</motion.div>
				</motion.div>
			</section>
		</main>
	);
}
