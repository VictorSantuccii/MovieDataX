"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Play, Search, Star, Ticket } from "lucide-react";

type TmdbGenre = {
	id: number;
	name: string;
};

type TmdbImage = {
	file_path: string;
};

type TmdbVideo = {
	id: string;
	key: string;
	name: string;
	site: string;
	type: string;
};

type TmdbReview = {
	id: string;
	author: string;
	content: string;
	created_at: string;
	url: string;
};

type TmdbReviewsResponse = {
	page: number;
	results: TmdbReview[];
	total_pages: number;
	total_results: number;
};

type TmdbCredits = {
	cast: Array<{
		id: number;
		name: string;
		character?: string;
		profile_path?: string;
	}>;
	crew: Array<{
		id: number;
		name: string;
		job: string;
		department: string;
	}>;
};

type TmdbDetails = {
	id: number;
	media_type: "movie" | "tv";
	title?: string;
	name?: string;
	overview?: string;
	poster_path?: string;
	backdrop_path?: string;
	vote_average?: number;
	vote_count?: number;
	release_date?: string;
	first_air_date?: string;
	runtime?: number;
	episode_run_time?: number[];
	genres?: TmdbGenre[];
	status?: string;
	budget?: number;
	revenue?: number;
	homepage?: string;
	tagline?: string;
	number_of_seasons?: number;
	number_of_episodes?: number;
	created_by?: Array<{
		id: number;
		name: string;
	}>;
	images?: {
		backdrops?: TmdbImage[];
		posters?: TmdbImage[];
	};
	videos?: {
		results?: TmdbVideo[];
	};
	credits?: TmdbCredits;
	reviews?: TmdbReviewsResponse;
};

type SearchResponse = {
	query: string;
	page: number;
	total_pages: number;
	total_results: number;
	results: TmdbDetails[];
};

type MediaFilter = "all" | "movie" | "tv";

const container: Variants = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08 },
	},
};

const item: Variants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const imageBase = "https://image.tmdb.org/t/p";

const formatDate = (value?: string) => {
	if (!value) {
		return "-";
	}
	return value;
};

const formatMoney = (value?: number) => {
	if (!value) {
		return "-";
	}
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
};

const resolveMediaType = (title: Pick<TmdbDetails, "media_type" | "first_air_date">): "movie" | "tv" => {
	if (title.media_type === "movie" || title.media_type === "tv") {
		return title.media_type;
	}
	return title.first_air_date ? "tv" : "movie";
};

export default function SearchPage() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
		"idle"
	);
	const [results, setResults] = useState<TmdbDetails[]>([]);
	const [openId, setOpenId] = useState<string | null>(null);
	const [searchInput, setSearchInput] = useState(query);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalResults, setTotalResults] = useState(0);
	const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
	const [minRating, setMinRating] = useState(0);
	const [minYear, setMinYear] = useState("");

	const buildSearchUrl = (options?: {
		query?: string;
		page?: number;
		mediaFilter?: MediaFilter;
		minRating?: number;
		minYear?: string;
	}) => {
		const nextQuery = (options?.query ?? query).trim();
		const nextPage = Math.max(1, options?.page ?? page);
		const nextMediaFilter = options?.mediaFilter ?? mediaFilter;
		const nextMinRating = options?.minRating ?? minRating;
		const nextMinYear = options?.minYear ?? minYear;

		const params = new URLSearchParams();
		if (nextQuery) {
			params.set("q", nextQuery);
			params.set("page", String(nextPage));
		}

		if (nextMediaFilter !== "all") {
			params.set("type", nextMediaFilter);
		}

		if (nextMinRating > 0) {
			params.set("minRating", String(nextMinRating));
		}

		const nextMinYearNumber = Number(nextMinYear);
		if (Number.isFinite(nextMinYearNumber) && nextMinYearNumber > 0) {
			params.set("minYear", String(nextMinYearNumber));
		}

		const queryString = params.toString();
		return queryString ? `/search?${queryString}` : "/search";
	};

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const readQueryFromUrl = () => {
			const params = new URLSearchParams(window.location.search);
			setQuery(params.get("q")?.trim() ?? "");

			const rawPage = Number(params.get("page") ?? 1);
			setPage(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);

			const rawType = params.get("type");
			const resolvedType: MediaFilter =
				rawType === "movie" || rawType === "tv" ? rawType : "all";
			setMediaFilter(resolvedType);

			const rawMinRating = Number(params.get("minRating") ?? 0);
			const resolvedMinRating = Number.isFinite(rawMinRating) && rawMinRating > 0 ? rawMinRating : 0;
			setMinRating(resolvedMinRating);

			const rawMinYear = Number(params.get("minYear") ?? 0);
			setMinYear(Number.isFinite(rawMinYear) && rawMinYear > 0 ? String(rawMinYear) : "");
		};

		readQueryFromUrl();
		window.addEventListener("popstate", readQueryFromUrl);
		return () => window.removeEventListener("popstate", readQueryFromUrl);
	}, []);

	const handleBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}
		router.push("/");
	};

	useEffect(() => {
		setSearchInput(query);
	}, [query]);

	useEffect(() => {
		if (!query) {
			setResults([]);
			setTotalPages(1);
			setTotalResults(0);
			setStatus("idle");
			return;
		}

		let isActive = true;
		const loadResults = async (targetPage: number) => {
			setStatus("loading");
			try {
				const response = await fetch(
					`/api/imdb/search?q=${encodeURIComponent(query)}&page=${targetPage}`
				);
				if (!response.ok) {
					throw new Error("Search failed");
				}
				const data = (await response.json()) as SearchResponse;
				if (isActive) {
					setResults(data.results ?? []);
					setPage(data.page ?? targetPage);
					setTotalPages(Math.max(1, data.total_pages ?? 1));
					setTotalResults(data.total_results ?? 0);
					setOpenId(null);
					setStatus("done");
				}
			} catch {
				if (isActive) {
					setStatus("error");
				}
			}
		};

		void loadResults(page);

		return () => {
			isActive = false;
		};
	}, [query, page]);

	const total = totalResults || results.length;
	const minYearNumber = Number(minYear);
	const filteredResults = useMemo(() => {
		return results.filter((title) => {
			const resolvedMediaType = resolveMediaType(title);
			if (mediaFilter !== "all" && resolvedMediaType !== mediaFilter) {
				return false;
			}

			if (minRating > 0 && (title.vote_average ?? 0) < minRating) {
				return false;
			}

			if (Number.isFinite(minYearNumber) && minYearNumber > 0) {
				const releaseYear = Number(
					(title.release_date ?? title.first_air_date ?? "").slice(0, 4)
				);
				if (!Number.isFinite(releaseYear) || releaseYear < minYearNumber) {
					return false;
				}
			}

			return true;
		});
	}, [mediaFilter, minRating, minYearNumber, results]);
	const hasActiveFilters = mediaFilter !== "all" || minRating > 0 || (Number.isFinite(minYearNumber) && minYearNumber > 0);
	const visibleCount = filteredResults.length;

	const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = searchInput.trim();
		if (!trimmed) {
			setQuery("");
			setPage(1);
			router.push("/search");
			return;
		}
		setQuery(trimmed);
		setPage(1);
		router.push(buildSearchUrl({ query: trimmed, page: 1 }));
	};

	const handlePageChange = (nextPage: number) => {
		if (!query || nextPage < 1 || nextPage > totalPages || nextPage === page) {
			return;
		}
		setPage(nextPage);
		router.push(buildSearchUrl({ page: nextPage }));
	};

	const emptyState = useMemo(() => {
		if (!query) {
			return "Digite algo para pesquisar filmes e séries.";
		}
		if (status === "loading") {
			return "Buscando títulos no TMDB...";
		}
		if (status === "error") {
			return "Não foi possível carregar os resultados.";
		}
		if (status === "done" && total === 0) {
			return "Nenhum título encontrado para esta busca.";
		}
		if (status === "done" && hasActiveFilters && visibleCount === 0) {
			return "Nenhum título corresponde aos filtros selecionados nesta página.";
		}
		return "";
	}, [hasActiveFilters, query, status, total, visibleCount]);

	return (
		<main className="app-search-page min-h-screen text-white">
			<section className="relative overflow-hidden px-6 pb-12 pt-16 sm:px-10 lg:px-16">
				<div className="app-search-hero-bg absolute inset-0" />
				<div className="app-search-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />
				<motion.div
					className="relative mx-auto grid max-w-6xl gap-6"
					variants={container}
					initial={false}
					animate="show"
				>
					<motion.div className="flex flex-wrap items-center gap-3" variants={item}>
						<button
							type="button"
							onClick={handleBack}
							className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar
						</button>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase text-rose-200">
							<Ticket className="h-4 w-4" />
							Busca
						</span>

					</motion.div>
					<motion.div variants={item}>
						<form
							onSubmit={handleSearchSubmit}
							className="app-search-form mb-4 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:rounded-full"
						>
							<Search className="h-5 w-5 text-rose-200" />
							<input
								type="text"
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Pesquisar filmes e séries"
								className="app-search-input w-full bg-transparent text-base text-white/85 placeholder:text-white/45 focus:outline-none sm:text-sm"
							/>
							<button
								type="submit"
								className="app-search-submit inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-rose-600 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] leading-none text-white transition hover:bg-rose-500 sm:h-10 sm:text-xs sm:tracking-[0.18em]"
							>
								Buscar
							</button>
						</form>
						<h1 className="text-3xl font-semibold text-white sm:text-4xl">
							Busca por: {query || "-"}
						</h1>
						<p className="mt-3 text-sm text-white/60">
							{hasActiveFilters
								? `Mostrando ${visibleCount} de ${results.length} resultados desta página.`
								: `${total} títulos encontrados.`}
						</p>
						<div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
							<label className="app-search-filter-label grid gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
								Tipo
								<select
									value={mediaFilter}
									onChange={(event) => {
										const nextMediaFilter = event.target.value as MediaFilter;
										setMediaFilter(nextMediaFilter);
										setPage(1);
										router.push(buildSearchUrl({ mediaFilter: nextMediaFilter, page: 1 }));
									}}
									className="app-search-filter app-search-filter-control app-search-select rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 outline-none transition focus:border-rose-400/60"
								>
									<option value="all" className="bg-[#0b0b0f] text-white">Todos</option>
									<option value="movie" className="bg-[#0b0b0f] text-white">Filmes</option>
									<option value="tv" className="bg-[#0b0b0f] text-white">Séries</option>
								</select>
							</label>
							<label className="app-search-filter-label grid gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
								Nota mínima
								<select
									value={String(minRating)}
									onChange={(event) => {
										const nextMinRating = Number(event.target.value);
										setMinRating(nextMinRating);
										setPage(1);
										router.push(buildSearchUrl({ minRating: nextMinRating, page: 1 }));
									}}
									className="app-search-filter app-search-filter-control app-search-select rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 outline-none transition focus:border-rose-400/60"
								>
									<option value="0" className="bg-[#0b0b0f] text-white">Sem mínimo</option>
									<option value="5" className="bg-[#0b0b0f] text-white">5.0+</option>
									<option value="6" className="bg-[#0b0b0f] text-white">6.0+</option>
									<option value="7" className="bg-[#0b0b0f] text-white">7.0+</option>
									<option value="8" className="bg-[#0b0b0f] text-white">8.0+</option>
								</select>
							</label>
							<label className="app-search-filter-label grid gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
								Ano mínimo
								<input
									type="number"
									inputMode="numeric"
									min={1900}
									max={new Date().getFullYear()}
									value={minYear}
									onChange={(event) => {
										const nextMinYear = event.target.value;
										setMinYear(nextMinYear);
										setPage(1);
										router.push(buildSearchUrl({ minYear: nextMinYear, page: 1 }));
									}}
									placeholder="Ex: 2018"
									className="app-search-filter app-search-filter-control rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 placeholder:text-white/40 outline-none transition focus:border-rose-400/60"
								/>
							</label>
						</div>
						{query && totalPages > 0 && (
							<div className="mt-4 flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => handlePageChange(page - 1)}
									disabled={page <= 1 || status === "loading"}
									className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</button>
								<span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
									Página {page} de {totalPages}
								</span>
								<button
									type="button"
									onClick={() => handlePageChange(page + 1)}
									disabled={page >= totalPages || status === "loading"}
									className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									Próxima
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						)}
					</motion.div>
				</motion.div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-6xl">
					{emptyState ? (
						<div className="app-search-empty rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
							{status === "loading" && (
								<span className="mb-3 inline-flex items-center gap-2 text-white">
									<Loader2 className="h-4 w-4 animate-spin" />
									Carregando
								</span>
							)}
							<p>{emptyState}</p>
						</div>
					) : (
						<div className="grid gap-6">
							{filteredResults.map((title) => {
								const name = title.title ?? title.name ?? "-";
								const resolvedMediaType = resolveMediaType(title);
								const year = title.release_date
									? title.release_date.slice(0, 4)
									: title.first_air_date?.slice(0, 4) ?? "-";
								const runtime = title.runtime
									? `${title.runtime} min`
									: title.episode_run_time?.[0]
									? `${title.episode_run_time[0]} min`
									: "-";
								const trailer = title.videos?.results?.find(
									(video) =>
										video.site === "YouTube" && video.type === "Trailer"
								);
								const poster = title.poster_path
									? `${imageBase}/w500${title.poster_path}`
									: "/placeholders/title-fallback.svg";
								const backdrop = title.backdrop_path
									? `${imageBase}/w780${title.backdrop_path}`
									: undefined;
								const backdrops = title.images?.backdrops?.slice(0, 3) ?? [];
								const postersCount = title.images?.posters?.length ?? 0;
								const backdropsCount = title.images?.backdrops?.length ?? 0;
								const videosCount = title.videos?.results?.length ?? 0;
								const reviews = title.reviews?.results ?? [];
								const reviewsCount = title.reviews?.total_results ?? reviews.length;
								const rowId = `${resolvedMediaType}-${title.id}`;
								const isOpen = openId === rowId;
								const director = title.credits?.crew?.find(
									(member) => member.job === "Director"
								);
								const creator = title.created_by?.[0];
								const cast = title.credits?.cast?.slice(0, 6) ?? [];
								const leadName = director?.name ?? creator?.name ?? "-";
								const status = title.status ?? "-";
								const budget =
									resolvedMediaType === "movie" ? formatMoney(title.budget) : "-";
								const revenue =
									resolvedMediaType === "movie" ? formatMoney(title.revenue) : "-";

								return (
									<motion.article
										key={rowId}
										className="app-search-card overflow-hidden rounded-3xl border border-white/10 bg-white/5"
										variants={item}
									>
										<div className="grid gap-5 p-5 lg:grid-cols-[180px_1fr]">
											<div className="flex flex-col gap-4">
												<div className="app-search-poster relative h-62 overflow-hidden rounded-2xl bg-white/10 sm:h-68">
													<Image
														alt={name}
														src={poster}
														fill
														sizes="(min-width: 1024px) 180px, 60vw"
														className="object-cover"
													/>
												</div>
												<div className="flex flex-wrap gap-2">
													<span className="app-search-chip rounded-full bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-200">
														{resolvedMediaType === "movie" ? "Filme" : "Série"}
													</span>
													<span className="app-search-chip rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/70">
														{year}
													</span>
												</div>
											</div>

											<div className="space-y-3">
												<div className="flex flex-wrap items-center justify-between gap-3">
													<div>
														<h2 className="text-xl font-semibold text-white">{name}</h2>
														<p className="text-sm uppercase tracking-[0.3em] text-white/40">
															{formatDate(title.release_date ?? title.first_air_date)}
														</p>
													</div>
													<div className="flex flex-wrap items-center gap-2">
														<span className="app-search-chip app-search-rating inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
															<Star className="h-3 w-3" />
															{title.vote_average?.toFixed(1) ?? "-"}
														</span>
														<span className="app-search-chip rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
															{title.vote_count ?? 0} votos
														</span>
														<span className="app-search-chip rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
															{runtime}
														</span>
													</div>
												</div>

												<p className="app-search-overview text-xs text-white/70 sm:text-sm">
													{title.overview || "Sem descrição cadastrada."}
												</p>

												<div className="flex flex-wrap gap-2">
													{title.genres?.slice(0, 4).map((genre) => (
														<Link
															key={genre.id}
															href={`/titles?type=${resolvedMediaType}&genre=${genre.id}&page=1`}
															className="app-search-genre rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/70"
														>
															{genre.name}
														</Link>
													))}
												</div>

												<div className="flex flex-wrap items-center gap-3">
													{trailer ? (
														<a
															className="app-search-action-primary inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-rose-500"
															href={`#trailer-${title.id}`}
														>
															<Play className="h-4 w-4" />
															Ver trailer
														</a>
													) : (
														<span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
															Trailer indisponível
														</span>
													)}
													{backdrop && (
														<a
															className="app-search-action-secondary rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70"
															href={backdrop}
															target="_blank"
															rel="noreferrer"
														>
															Ver imagem grande
														</a>
													)}
													<button
														type="button"
														onClick={() => setOpenId(isOpen ? null : rowId)}
														className="app-search-action-secondary rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
														aria-expanded={isOpen}
													>
														{isOpen ? "Ocultar dados" : "Ver dados completos"}
													</button>
												</div>

												{trailer && (
													<div id={`trailer-${title.id}`} className="app-search-trailer overflow-hidden rounded-2xl border border-white/10 bg-black/60">
														<div className="aspect-video">
															<iframe
																src={`https://www.youtube.com/embed/${trailer.key}`}
																title={`Trailer de ${name}`}
																allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
																referrerPolicy="strict-origin-when-cross-origin"
																allowFullScreen
																className="h-full w-full"
															/>
														</div>
													</div>
												)}

												<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:gap-3 sm:grid-cols-3">
													{backdrops.map((image) => (
														<div
															key={image.file_path}
															className="relative h-24 w-48 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 sm:w-auto"
														>
															<Image
																alt={name}
																src={`${imageBase}/w500${image.file_path}`}
																fill
																sizes="(min-width: 640px) 160px, 100vw"
																className="object-cover"
															/>
														</div>
													))}
												</div>

												{isOpen && (
													<div className="app-search-expanded grid gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
														<div>
															<p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
																Detalhes do título
															</p>
															<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Tipo
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
																		{resolvedMediaType === "movie" ? "Filme" : "Série"}
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Direção
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">{leadName}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Duração
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">{runtime}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Avaliações
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
																		{title.vote_average?.toFixed(1) ?? "-"} ({title.vote_count ?? 0})
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Status
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">{status}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Gêneros
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
																		{title.genres?.map((genre) => genre.name).join(", ") || "-"}
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Orçamento
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">{budget}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Imagens
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
																		{postersCount} posters, {backdropsCount} backdrops
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Receita
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">{revenue}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Videos
																	</p>
																	<p className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
																		{videosCount} disponiveis
																	</p>
																</div>
															</div>
														</div>

														<div>
															<p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
																Elenco principal
															</p>
															{cast.length === 0 ? (
																<p className="text-xs text-white/60">
																	Elenco não informado.
																</p>
															) : (
																<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
																	{cast.map((person) => {
																		const profile = person.profile_path
																			? `${imageBase}/w185${person.profile_path}`
																			: "/placeholders/person-fallback.svg";

																		return (
																			<Link
																				key={person.id}
																				href={`/person/${person.id}`}
																				className="app-search-cast-card group flex w-58 shrink-0 snap-start items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/60 hover:bg-white/10 sm:w-auto"
																			>
																				<div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">
																					<Image
																						alt={person.name}
																						src={profile}
																						fill
																						sizes="40px"
																						className="object-cover transition duration-300 group-hover:scale-110"
																					/>
																				</div>
																				<div>
																					<p className="text-xs font-semibold text-white transition group-hover:text-rose-100">{person.name}</p>
																					<p className="text-[10px] text-white/60">
																						{person.character ?? "-"}
																					</p>
																				</div>
																			</Link>
																		);
																	})}
																</div>
															)}
														</div>

														<div>
															<p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
																Comentários ({reviewsCount})
															</p>
															{reviews.length === 0 ? (
																<p className="text-xs text-white/60">
																	Nenhum comentário encontrado para este título.
																</p>
															) : (
																<div className="grid gap-3">
																	{reviews.slice(0, 3).map((review) => (
																		<div
																			key={review.id}
																			className="app-search-review-card rounded-2xl border border-white/10 bg-white/5 p-3"
																		>
																			<p className="text-xs font-semibold text-white">
																				{review.author}
																			</p>
																			<p className="mt-2 text-xs text-white/70">
																				{review.content.slice(0, 280)}
																				{review.content.length > 280 ? "..." : ""}
																			</p>
																			<a
																				href={review.url}
																				target="_blank"
																				rel="noreferrer"
																				className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-rose-200"
																			>
																				Ler comentário
																			</a>
																		</div>
																	))}
																</div>
															)}
														</div>
													</div>
												)}
											</div>
									</div>
								</motion.article>
							);
						})}
						{query && totalPages > 1 && (
							<div className="flex flex-wrap items-center justify-center gap-2 pt-2">
								<button
									type="button"
									onClick={() => handlePageChange(page - 1)}
									disabled={page <= 1 || status === "loading"}
									className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</button>
								<span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
									Página {page} de {totalPages}
								</span>
								<button
									type="button"
									onClick={() => handlePageChange(page + 1)}
									disabled={page >= totalPages || status === "loading"}
									className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									Próxima
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	</main>
	);
}
