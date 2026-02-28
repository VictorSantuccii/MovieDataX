"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Film, Search, Star, Tv } from "lucide-react";

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

function TitlesPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const searchParamsString = searchParams.toString();

	const mediaType: "movie" | "tv" =
		searchParams.get("type") === "tv" ? "tv" : "movie";
	const genreParam = searchParams.get("genre");
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

	const handleBack = () => {
		router.push("/");
	};

	const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = searchTitle.trim();
		if (!trimmed) {
			return;
		}
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	const updateQuery = (next: { type?: "movie" | "tv"; genre?: number; page?: number }) => {
		const params = new URLSearchParams(searchParamsString);
		const nextType = next.type ?? mediaType;
		const nextGenre = next.genre ?? selectedGenreId;
		const nextPage = next.page ?? page;

		params.set("type", nextType);
		if (nextGenre) {
			params.set("genre", String(nextGenre));
		} else {
			params.delete("genre");
		}
		params.set("page", String(nextPage));

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
				const response = await fetch(
					`/api/imdb/discover?type=${mediaType}&genre=${selectedGenreId}&page=${page}`,
					{ signal: controller.signal }
				);
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

				setTitles(
					(data.results ?? []).map((entry) => ({
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
	}, [mediaType, page, router, searchParamsString, selectedGenreId]);

	const getTitleName = (entry: TmdbListItem) => entry.title ?? entry.name ?? "-";
	const getTitleYear = (entry: TmdbListItem) =>
		entry.release_date?.slice(0, 4) ?? entry.first_air_date?.slice(0, 4) ?? "-";

	return (
		<main className="app-internal-page min-h-screen text-white">
			<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
				<div className="app-internal-hero-bg absolute inset-0" />
				<div className="app-internal-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />

				<motion.div
					className="relative mx-auto grid max-w-6xl gap-6"
					variants={container}
					initial="hidden"
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
							Catálogo
						</span>
					</motion.div>

					<motion.div className="grid gap-4" variants={item}>
						<h1 className="text-3xl font-semibold text-white sm:text-4xl">
							{mediaType === "movie" ? "Filmes por categoria" : "Séries por categoria"}
						</h1>
						<p className="text-sm text-white/60">
							Clique em uma categoria e navegue pelas páginas dos títulos.
						</p>

						<form
							onSubmit={handleSearchSubmit}
							className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:rounded-full"
						>
							<Search className="h-4 w-4 text-rose-200" />
							<input
								type="text"
								value={searchTitle}
								onChange={(event) => setSearchTitle(event.target.value)}
								placeholder="Pesquisar título (filme ou série)"
								className="w-full bg-transparent text-base text-white/85 placeholder:text-white/40 focus:outline-none sm:text-sm"
							/>
							<button
								type="submit"
								className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-rose-600 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] leading-none text-white transition hover:bg-rose-500 sm:text-xs sm:tracking-[0.18em]"
							>
								Buscar
							</button>
						</form>

						<div className="flex flex-wrap gap-3">
							<button
								type="button"
								onClick={() => updateQuery({ type: "movie", page: 1 })}
								className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
									mediaType === "movie"
										? "bg-rose-500/30 text-rose-100"
										: "border border-white/10 bg-white/5 text-white/70 hover:text-white"
								}`}
							>
								<Film className="h-4 w-4" />
								Filmes
							</button>
							<button
								type="button"
								onClick={() => updateQuery({ type: "tv", page: 1 })}
								className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
									mediaType === "tv"
										? "bg-rose-500/30 text-rose-100"
										: "border border-white/10 bg-white/5 text-white/70 hover:text-white"
								}`}
							>
								<Tv className="h-4 w-4" />
								Séries
							</button>
						</div>

						{genresLoading ? (
							<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
								Carregando categorias...
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
								{genres.map((genre) => (
									<button
										key={genre.id}
										type="button"
										onClick={() => updateQuery({ genre: genre.id, page: 1 })}
										className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
											selectedGenreId === genre.id
												? "bg-rose-500/30 text-rose-100"
												: "border border-white/10 bg-white/5 text-white/70 hover:text-white"
										}`}
									>
										{genre.name}
									</button>
								))}
							</div>
						)}
					</motion.div>
				</motion.div>
			</section>

			<section className="relative z-10 px-6 pb-20 sm:px-10 lg:px-16">
				<motion.div
					className="mx-auto grid max-w-6xl gap-6"
					variants={container}
					initial="hidden"
					animate="show"
				>
					<motion.div className="flex flex-wrap items-center justify-between gap-3" variants={item}>
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">
								{selectedGenre?.name ?? "Categoria"}
							</p>
							<p className="mt-2 text-sm text-white/60">
								{totalResults} títulos encontrados • Página {page} de {totalPages}
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
					</motion.div>

					{titlesLoading ? (
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
							Carregando títulos da categoria...
						</div>
					) : (
						<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{titles.map((entry, index) => {
								const name = getTitleName(entry);
								const year = getTitleYear(entry);
								const poster = entry.poster_path
									? `${imageBase}/w500${entry.poster_path}`
									: "/placeholders/title-fallback.svg";

								if (index < 3) {
								}

								return (
									<div
										key={entry.id}
										className="app-category-card group w-30 shrink-0 snap-start overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 sm:w-auto"
									>
										<Link
											href={`/title/${mediaType}/${entry.id}?type=${mediaType}&genre=${selectedGenreId ?? ""}&page=${page}`}
											className="block"
										>
											<div className="app-category-poster relative aspect-2/3">
												<Image
													alt={name}
													src={poster}
													fill
													sizes="(min-width: 1024px) 11rem, (min-width: 640px) 40vw, 70vw"
													className="app-category-poster-image object-cover"
													onLoad={() => {
														if (index < 3) {
														}
													}}
													onError={() => {
													}}
												/>
											</div>
											<div className="space-y-2 p-2.5 sm:p-3">
												<p className="app-category-title line-clamp-2 min-h-9 text-[11px] font-semibold sm:text-sm">{name}</p>
												<div className="flex flex-wrap items-center gap-1 text-[10px] sm:gap-1.5 sm:text-xs">
													<span className="app-main-poster-chip rounded-full px-2 py-0.5 font-semibold">{year}</span>
													<span className="app-main-poster-chip rounded-full px-2 py-0.5 font-semibold">
														{mediaType === "movie" ? "Filme" : "Série"}
													</span>
													<span className="app-main-poster-chip app-rating-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold">
														<Star className="h-3 w-3" />
														{entry.vote_average?.toFixed(1) ?? "-"}
													</span>
												</div>
												<p className="app-category-hint text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]">
													Clique para ver detalhes completos
												</p>
											</div>
										</Link>

									</div>
								);
							})}

							{titles.length === 0 && (
								<div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-4">
									Nenhum título encontrado nessa categoria.
								</div>
							)}
						</div>
					)}
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
