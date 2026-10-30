"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, Search, SlidersHorizontal, Star, Tv } from "lucide-react";

type TmdbListItem = {
	id: number;
	media_type?: "movie" | "tv";
	title?: string;
	name?: string;
	vote_average?: number;
	popularity?: number;
	release_date?: string;
	first_air_date?: string;
	genre_ids?: number[];
	poster_path?: string;
	backdrop_path?: string;
};

type TmdbGenre = {
	id: number;
	name: string;
};

type GenreResponse = {
	genres: TmdbGenre[];
};

type SortOption = {
	value: string;
	label: string;
};

type DiscoverResponse = {
	page: number;
	results: TmdbListItem[];
	total_pages: number;
	total_results: number;
};

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
const sortOptions: SortOption[] = [
	{ value: "popularity.desc", label: "Mais populares" },
	{ value: "vote_average.desc", label: "Melhor avaliados" },
	{ value: "primary_release_date.desc", label: "Mais recentes" },
	{ value: "primary_release_date.asc", label: "Mais antigos" },
];

function TitlesPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const searchParamsString = searchParams.toString();

	const mediaType: "movie" | "tv" =
		searchParams.get("type") === "tv" ? "tv" : "movie";
	const genreParam = searchParams.get("genre");
	const minRatingParam = Number(searchParams.get("minRating") ?? 0);
	const minYearParam = Number(searchParams.get("minYear") ?? 0);
	const maxYearParam = Number(searchParams.get("maxYear") ?? 0);
	const sortBy = searchParams.get("sortBy") ?? "popularity.desc";
	const minVotesParam = Number(searchParams.get("minVotes") ?? 0);
	const pageParam = Number(searchParams.get("page") ?? 1);
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const [genres, setGenres] = useState<TmdbGenre[]>([]);
	const [titles, setTitles] = useState<TmdbListItem[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [totalResults, setTotalResults] = useState(0);
	const [genresLoading, setGenresLoading] = useState(true);
	const [titlesLoading, setTitlesLoading] = useState(true);
	const [searchTitle, setSearchTitle] = useState("");

	const selectedGenreId = useMemo(() => {
		if (!genreParam) {
			return undefined;
		}
		const parsed = Number(genreParam);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [genreParam]);

	const selectedGenre = useMemo(
		() => genres.find((genre) => genre.id === selectedGenreId),
		[genres, selectedGenreId]
	);

	const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = searchTitle.trim();
		if (!trimmed) {
			return;
		}
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	const updateQuery = (next: {
		type?: "movie" | "tv";
		genre?: number;
		page?: number;
		minRating?: number;
		minYear?: number;
		maxYear?: number;
		sortBy?: string;
		minVotes?: number;
	}) => {
		const params = new URLSearchParams(searchParamsString);
		const nextType = next.type ?? mediaType;
		const nextGenre = next.genre ?? selectedGenreId;
		const nextPage = next.page ?? page;
		const nextMinRating = next.minRating ?? (Number.isFinite(minRatingParam) ? minRatingParam : 0);
		const nextMinYear = next.minYear ?? (Number.isFinite(minYearParam) ? minYearParam : 0);
		const nextMaxYear = next.maxYear ?? (Number.isFinite(maxYearParam) ? maxYearParam : 0);
		const nextSortBy = next.sortBy ?? sortBy;
		const nextMinVotes = next.minVotes ?? (Number.isFinite(minVotesParam) ? minVotesParam : 0);

		params.set("type", nextType);
		if (nextGenre) {
			params.set("genre", String(nextGenre));
		} else {
			params.delete("genre");
		}
		params.set("page", String(nextPage));
		if (nextMinRating > 0) {
			params.set("minRating", String(nextMinRating));
		} else {
			params.delete("minRating");
		}
		if (nextMinYear > 0) {
			params.set("minYear", String(nextMinYear));
		} else {
			params.delete("minYear");
		}
		if (nextMaxYear > 0) {
			params.set("maxYear", String(nextMaxYear));
		} else {
			params.delete("maxYear");
		}
		if (nextSortBy !== "popularity.desc") {
			params.set("sortBy", nextSortBy);
		} else {
			params.delete("sortBy");
		}
		if (nextMinVotes > 0) {
			params.set("minVotes", String(nextMinVotes));
		} else {
			params.delete("minVotes");
		}

		router.push(`/titles?${params.toString()}`);
	};

	useEffect(() => {
		const controller = new AbortController();
		setGenresLoading(true);

		const loadGenres = async () => {
			try {
				const response = await fetch(`/api/imdb/genres?type=${mediaType}`, {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error("Failed to load genres");
				}
				const data = (await response.json()) as GenreResponse;
				setGenres(data.genres ?? []);
			} catch {
				if (controller.signal.aborted) {
					return;
				}
				setGenres([]);
			} finally {
				if (!controller.signal.aborted) {
					setGenresLoading(false);
				}
			}
		};

		loadGenres();
		return () => {
			controller.abort();
		};
	}, [mediaType]);

	useEffect(() => {

		if (genresLoading || genres.length === 0) {
			return;
		}

		const hasSelected =
			selectedGenreId !== undefined && genres.some((genre) => genre.id === selectedGenreId);

		if (hasSelected) {
			return;
		}

		const params = new URLSearchParams(searchParamsString);
		params.set("type", mediaType);
		params.set("genre", String(genres[0].id));
		params.set("page", "1");
		router.replace(`/titles?${params.toString()}`);
	}, [genres, genresLoading, mediaType, router, searchParamsString, selectedGenreId]);

	useEffect(() => {
		if (!selectedGenreId) {
			setTitles([]);
			setTotalPages(1);
			setTotalResults(0);
				setGenresLoading(false);
			setTitlesLoading(false);
			return;
			}

		const controller = new AbortController();
		setTitlesLoading(true);

		const loadTitles = async () => {
			try {
				const requestUrl = (requestedPage: number) =>
					`/api/imdb/discover?type=${mediaType}&genre=${selectedGenreId}&page=${requestedPage}&minRating=${minRatingParam}&minYear=${minYearParam}&maxYear=${maxYearParam}&sortBy=${encodeURIComponent(sortBy)}&minVotes=${minVotesParam}`;
				const response = await fetch(requestUrl(page), { signal: controller.signal });
				if (!response.ok) {
					throw new Error("Failed to load titles");
				}
				const data = (await response.json()) as DiscoverResponse;
				if (controller.signal.aborted) {
					return;
				}

				const resolvedTotalPages = Math.max(1, data.total_pages ?? 1);
				if (page > resolvedTotalPages) {
					const params = new URLSearchParams(searchParamsString);
					params.set("type", mediaType);
					params.set("genre", String(selectedGenreId));
					params.set("page", String(resolvedTotalPages));
					router.replace(`/titles?${params.toString()}`);
					return;
				}

				const pagesToLoad = [page + 1, page + 2, page + 3].filter(
					(requestedPage) => requestedPage <= resolvedTotalPages
				);
				const additionalResponses = await Promise.all(
					pagesToLoad.map((requestedPage) =>
						fetch(requestUrl(requestedPage), { signal: controller.signal })
					)
				);
				const additionalData = await Promise.all(
					additionalResponses
						.filter((additionalResponse) => additionalResponse.ok)
						.map((additionalResponse) => additionalResponse.json() as Promise<DiscoverResponse>)
				);
				const combinedResults = [
					...(data.results ?? []),
					...additionalData.flatMap((pageData) => pageData.results ?? []),
				];
				const uniqueResults = combinedResults.filter(
					(entry, index, list) => list.findIndex((candidate) => candidate.id === entry.id) === index
				);

				setTitles(
					uniqueResults.map((entry) => ({
						...entry,
						media_type: mediaType,
					}))
				);
				setTotalPages(resolvedTotalPages);
				setTotalResults(data.total_results ?? 0);
			} catch {
				if (controller.signal.aborted) {
					return;
				}
				setTitles([]);
				setTotalPages(1);
				setTotalResults(0);
			} finally {
				if (!controller.signal.aborted) {
					setTitlesLoading(false);
				}
			}
		};

		loadTitles();
		return () => {
			controller.abort();
		};
	}, [maxYearParam, mediaType, minRatingParam, minYearParam, minVotesParam, page, router, searchParamsString, selectedGenreId, sortBy]);

	const getTitleName = (entry: TmdbListItem) => entry.title ?? entry.name ?? "-";
	const getTitleYear = (entry: TmdbListItem) =>
		entry.release_date?.slice(0, 4) ?? entry.first_air_date?.slice(0, 4) ?? "-";
	const filterContextLabel = selectedGenre?.name ?? (mediaType === "movie" ? "Filmes" : "Séries");
	const activeFilterDescription = [
		minRatingParam > 0 ? `nota ${minRatingParam}+` : "",
		minYearParam > 0 || maxYearParam > 0 ? `${minYearParam || "qualquer"}–${maxYearParam || "agora"}` : "",
		sortOptions.find((option) => option.value === sortBy)?.label ?? "",
	]
		.filter(Boolean)
		.join(" · ");
	const recommendationGroups = [
		{
			key: "highlights",
			label: "Destaques selecionados",
			description: `Os melhores resultados em ${filterContextLabel.toLowerCase()}.`,
			entries: titles.slice(0, 6),
			accent: "text-rose-200",
		},
		{
			key: "ratings",
			label: "Notas que se destacam",
			description: "Títulos para assistir sem perder tempo.",
			entries: [...titles].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0)).slice(0, 5),
			accent: "text-amber-200",
		},
		{
			key: "discover",
			label: "Descobertas para hoje",
			description: activeFilterDescription || "Uma seleção para sair do óbvio.",
			entries: titles.slice(6, 12),
			accent: "text-sky-200",
		},
	];

	return (
		<main className="app-internal-page min-h-screen text-white">
			<section className="relative overflow-hidden px-6 pb-8 pt-8 sm:px-10 lg:px-16">
				<div className="app-internal-hero-bg absolute inset-0" />
				<div className="app-internal-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />

				<motion.div
					className="relative mx-auto grid max-w-7xl gap-4"
					variants={container}
					initial="hidden"
					animate="show"
				>
					<motion.div className="mx-auto grid max-w-3xl justify-items-center gap-3 text-center" variants={item}>
						<div className="flex items-center gap-3">
							<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
							<span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200/80">
								Catálogo MovieDataX
							</span>
							<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
						</div>
						<h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
							{mediaType === "movie" ? "Filmes" : "Séries"}
						</h1>
						<p className="max-w-xl text-sm leading-6 text-white/55 sm:text-base">
							Explore títulos por categoria e encontre sua próxima sessão.
						</p>

					</motion.div>
				</motion.div>
			</section>

			<section className="relative z-10 px-6 pb-20 sm:px-10 lg:px-16">
				<motion.div
					className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[minmax(0,1fr)_27rem]"
					variants={container}
					initial="hidden"
					animate="show"
				>
					<motion.div className="order-2 min-w-0 lg:order-1" variants={item}>
						<div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
						<div className="space-y-1">
							<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/75">
								Categoria selecionada
							</p>
							<h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
								{selectedGenre?.name ?? "Categoria"}
							</h2>
							<p className="text-xs text-white/50 sm:text-sm">
								{totalResults} títulos encontrados <span className="mx-1 text-white/25">•</span> Página {page} de {totalPages}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={page <= 1}
								onClick={() => updateQuery({ page: page - 1 })}
								className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
							>
								<ChevronLeft className="h-4 w-4" />
								Anterior
							</button>
							<button
								type="button"
								disabled={page >= totalPages}
								onClick={() => updateQuery({ page: page + 1 })}
								className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
							>
								Próxima
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
						</div>

					{titlesLoading ? (
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
							Carregando títulos da categoria...
						</div>
					) : (
						<div className="grid items-start gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
							{titles.map((entry) => {
								const name = getTitleName(entry);
								const year = getTitleYear(entry);
								const poster = entry.poster_path
									? `${imageBase}/w500${entry.poster_path}`
									: "/placeholders/title-fallback.svg";

								return (
									<div
										key={entry.id}
										className="app-category-card group self-start overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1"
									>
										<Link
											href={`/title/${mediaType}/${entry.id}?type=${mediaType}&genre=${selectedGenreId ?? ""}&page=${page}`}
											className="block"
										>
											<div className="app-category-poster relative aspect-[2/3]">
												<Image
													alt={name}
													src={poster}
													fill
													sizes="(min-width: 1280px) 14rem, (min-width: 1024px) 17vw, (min-width: 640px) 22vw, 42vw"
													className="app-category-poster-image object-cover"
												/>
											</div>
											<div className="space-y-1.5 p-2.5">
												<p className="app-category-title line-clamp-2 min-h-8 text-xs font-semibold sm:text-sm">{name}</p>
												<div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px]">
													<span className="app-main-poster-chip rounded-full px-1.5 py-0.5 font-semibold">{year}</span>
													<span className="app-main-poster-chip rounded-full px-1.5 py-0.5 font-semibold">
														{mediaType === "movie" ? "Filme" : "Série"}
													</span>
													<span className="app-main-poster-chip app-rating-chip inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold">
														<Star className="h-2.5 w-2.5" />
														{entry.vote_average?.toFixed(1) ?? "-"}
													</span>
												</div>
												<p className="app-category-hint text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]">
													Ver detalhes
												</p>
											</div>
										</Link>

									</div>
								);
							})}

							{titles.length === 0 && (
								<div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-4 lg:col-span-5 xl:col-span-6">
									Nenhum título encontrado nessa categoria.
								</div>
							)}
						</div>
					)}
					</motion.div>
					<aside className="app-filter-panel order-1 h-fit rounded-[2rem] border p-6 shadow-2xl lg:sticky lg:top-6 lg:order-2 lg:p-8">
						<div className="app-filter-header mb-6 rounded-2xl border p-4">
							<div className="flex items-start gap-3">
								<div className="app-filter-icon rounded-2xl p-2.5"><SlidersHorizontal className="h-5 w-5" /></div>
								<div>
								<p className="text-lg font-semibold text-white">Encontrar títulos</p>
								<p className="mt-1 text-sm text-white/55">Monte sua sessão ideal.</p>
								</div>
							</div>
							<form onSubmit={handleSearchSubmit} className="app-filter-search mt-4 flex items-center gap-2 rounded-xl border p-2">
								<Search className="ml-2 h-4 w-4 shrink-0 text-rose-200" />
								<input
									type="text"
									value={searchTitle}
									onChange={(event) => setSearchTitle(event.target.value)}
									placeholder="Buscar filme ou série"
									aria-label="Buscar filme ou série"
									className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white/85 placeholder:text-white/40 outline-none"
								/>
								<button
									type="submit"
									aria-label="Pesquisar título"
									title="Pesquisar título"
									className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white transition hover:bg-rose-500"
								>
									<Search className="h-4 w-4" />
								</button>
							</form>
						</div>
						<div className="space-y-3">
							<div className="app-filter-section">
								<p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Exibir</p>
								<div className="grid grid-cols-2 gap-2">
									{(["movie", "tv"] as const).map((type) => (
										<button key={type} type="button" onClick={() => updateQuery({ type, page: 1 })} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${mediaType === type ? "border-rose-400/50 bg-rose-500/20 text-rose-100" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"}`}>
											{type === "movie" ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
											{type === "movie" ? "Filmes" : "Séries"}
										</button>
									))}
								</div>
							</div>
							<div className="app-filter-section">
								<label htmlFor="min-votes" className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Confiabilidade da nota</label>
								<select id="min-votes" value={minVotesParam} onChange={(event) => updateQuery({ minVotes: Number(event.target.value), page: 1 })} className="app-filter-control w-full rounded-xl border border-white/10 bg-[#181821] px-3 py-3 text-sm text-white/80 outline-none">
									<option value="0">Todos os títulos</option>
									<option value="100">Pelo menos 100 votos</option>
									<option value="500">Pelo menos 500 votos</option>
									<option value="1000">Pelo menos 1.000 votos</option>
								</select>
								<p className="mt-2 text-xs leading-relaxed text-white/45">Evite notas baseadas em poucas avaliações.</p>
							</div>
							<div className="app-filter-section">
								<label htmlFor="sort-by" className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Ordenar resultados</label>
								<select id="sort-by" value={sortBy} onChange={(event) => updateQuery({ sortBy: event.target.value, page: 1 })} className="app-filter-control w-full rounded-xl border border-white/10 bg-[#181821] px-3 py-3 text-sm text-white/80 outline-none">
									{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
								</select>
							</div>
							<div className="app-filter-section">
								<label htmlFor="min-rating" className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/50"><span>Nota mínima</span><strong className="text-sm tracking-normal text-rose-200">{minRatingParam ? `${minRatingParam}/10` : "Qualquer"}</strong></label>
								<input id="min-rating" type="range" min="0" max="9" step="0.5" value={minRatingParam} onChange={(event) => updateQuery({ minRating: Number(event.target.value), page: 1 })} className="w-full accent-rose-500" />
							</div>
							<div className="app-filter-section grid grid-cols-2 gap-2">
								<label className="text-xs text-white/50">De<input type="number" min="1900" max="2100" value={minYearParam || ""} placeholder="Ano" onChange={(event) => updateQuery({ minYear: Number(event.target.value) || 0, page: 1 })} className="app-filter-control mt-2 w-full rounded-xl border border-white/10 bg-[#181821] px-3 py-3 text-sm text-white/80 outline-none" /></label>
								<label className="text-xs text-white/50">Até<input type="number" min="1900" max="2100" value={maxYearParam || ""} placeholder="Ano" onChange={(event) => updateQuery({ maxYear: Number(event.target.value) || 0, page: 1 })} className="app-filter-control mt-2 w-full rounded-xl border border-white/10 bg-[#181821] px-3 py-3 text-sm text-white/80 outline-none" /></label>
							</div>
							<div className="app-filter-section">
								<p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Gênero</p>
								{genresLoading ? <p className="text-sm text-white/50">Carregando gêneros...</p> : <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto pr-1">{genres.map((genre) => <button key={genre.id} type="button" onClick={() => updateQuery({ genre: genre.id, page: 1 })} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${selectedGenreId === genre.id ? "border-rose-400/50 bg-rose-500/20 font-medium text-rose-100" : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"}`}>{genre.name}</button>)}</div>}
							</div>
							<button type="button" onClick={() => updateQuery({ genre: genres[0]?.id, minRating: 0, minYear: 0, maxYear: 0, minVotes: 0, sortBy: "popularity.desc", page: 1 })} className="w-full rounded-xl border border-white/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:border-rose-300/30 hover:text-white">Limpar filtros</button>
						</div>
						<div className="app-filter-recommendations mt-5 border-t border-white/10 pt-5">
							<div className="mb-4">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-200">Curadoria dinâmica</p>
								<p className="mt-1 text-sm font-semibold text-white">{filterContextLabel} para explorar</p>
								<p className="mt-1 text-xs leading-relaxed text-white/50">
									As sugestões mudam conforme seus filtros.
								</p>
							</div>
							<div className="space-y-5">
								{recommendationGroups.map((group) => (
									<div key={group.key}>
										<div className="mb-2 flex items-center justify-between gap-2">
											<div>
												<p className={`text-xs font-semibold ${group.accent}`}>{group.label}</p>
												<p className="mt-0.5 text-[11px] text-white/45">{group.description}</p>
											</div>
											<Star className="h-3.5 w-3.5 shrink-0 text-amber-300" />
										</div>
										<div className="space-y-2">
											{group.entries.map((entry, index) => {
												const name = getTitleName(entry);
												const poster = entry.poster_path ? `${imageBase}/w185${entry.poster_path}` : "/placeholders/title-fallback.svg";
												return (
													<Link
														key={`${group.key}-${entry.id}`}
														href={`/title/${mediaType}/${entry.id}?type=${mediaType}&genre=${selectedGenreId ?? ""}&page=${page}`}
														className="app-filter-recommendation group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:-translate-y-0.5 hover:border-rose-300/40"
													>
														<span className="w-5 shrink-0 text-center text-xs font-black text-white/30">{String(index + 1).padStart(2, "0")}</span>
														<div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg">
															<Image alt={name} src={poster} fill sizes="40px" className="object-cover transition duration-500 group-hover:scale-105" />
														</div>
														<div className="min-w-0">
															<p className="line-clamp-1 text-xs font-semibold text-white">{name}</p>
															<p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-200">
																<Star className="h-3 w-3" />
																{entry.vote_average?.toFixed(1) ?? "-"}
															</p>
														</div>
													</Link>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					</aside>
				</motion.div>
			</section>
		</main>
	);
}

export default function TitlesPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-[#0b0b0f] px-6 pb-16 pt-20 text-white sm:px-10 lg:px-16">
					<div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
						Carregando catálogo...
					</div>
				</main>
			}
		>
			<TitlesPageContent />
		</Suspense>
	);
}
