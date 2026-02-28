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

	console.info("[UI][titles] render", {
		mediaType,
		genreParam,
		selectedGenreId,
		page,
		genresLoading,
		titlesLoading,
		genresCount: genres.length,
		titlesCount: titles.length,
		totalPages,
		totalResults,
	});

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

		console.info("[UI][titles] updateQuery", {
			from: searchParamsString,
			next: {
				type: nextType,
				genre: nextGenre,
				page: nextPage,
			},
			result: params.toString(),
		});

		router.push(`/titles?${params.toString()}`);
	};

	useEffect(() => {
		const controller = new AbortController();
		console.info("[UI][titles] genres.load.start", { mediaType });
		setGenresLoading(true);

		const loadGenres = async () => {
			try {
				const response = await fetch(`/api/imdb/genres?type=${mediaType}`, {
					signal: controller.signal,
				});
				console.info("[UI][titles] genres.load.response", {
					status: response.status,
					ok: response.ok,
					mediaType,
				});
				if (!response.ok) {
					throw new Error("Failed to load genres");
				}
				const data = (await response.json()) as GenreResponse;
				console.info("[UI][titles] genres.load.success", {
					mediaType,
					count: data.genres?.length ?? 0,
				});
				setGenres(data.genres ?? []);
			} catch (error) {
				if (controller.signal.aborted) {
					console.info("[UI][titles] genres.load.aborted", { mediaType });
					return;
				}
				console.error("[UI][titles] genres.load.error", {
					mediaType,
					error,
				});
				setGenres([]);
			} finally {
				if (!controller.signal.aborted) {
					console.info("[UI][titles] genres.load.finally", { mediaType });
					setGenresLoading(false);
				}
			}
		};

		loadGenres();
		return () => {
			console.info("[UI][titles] genres.load.cleanup", { mediaType });
			controller.abort();
		};
	}, [mediaType]);

	useEffect(() => {
		console.info("[UI][titles] selectedGenre.guard.check", {
			genresLoading,
			genresCount: genres.length,
			selectedGenreId,
			mediaType,
		});

		if (genresLoading || genres.length === 0) {
			console.info("[UI][titles] selectedGenre.guard.skip", {
				reason: genresLoading ? "genresLoading" : "emptyGenres",
			});
			return;
		}

		const hasSelected =
			selectedGenreId !== undefined && genres.some((genre) => genre.id === selectedGenreId);

		if (hasSelected) {
			console.info("[UI][titles] selectedGenre.guard.keep-current", {
				selectedGenreId,
			});
			return;
		}

		const params = new URLSearchParams(searchParamsString);
		params.set("type", mediaType);
		params.set("genre", String(genres[0].id));
		params.set("page", "1");
		console.info("[UI][titles] selectedGenre.guard.replace", {
			from: searchParamsString,
			to: params.toString(),
		});
		router.replace(`/titles?${params.toString()}`);
	}, [genres, genresLoading, mediaType, router, searchParamsString, selectedGenreId]);

	useEffect(() => {
		if (!selectedGenreId) {
			console.info("[UI][titles] titles.load.skip", {
				reason: "noSelectedGenre",
				mediaType,
				page,
			});
			setTitles([]);
			setTotalPages(1);
			setTotalResults(0);
				setGenresLoading(false);
			setTitlesLoading(false);
			return;
			}

		const controller = new AbortController();
		console.info("[UI][titles] titles.load.start", {
			mediaType,
			selectedGenreId,
			page,
		});
		setTitlesLoading(true);

		const loadTitles = async () => {
			try {
				const response = await fetch(
					`/api/imdb/discover?type=${mediaType}&genre=${selectedGenreId}&page=${page}`,
					{ signal: controller.signal }
				);
				console.info("[UI][titles] titles.load.response", {
					status: response.status,
					ok: response.ok,
					mediaType,
					selectedGenreId,
					page,
				});
				if (!response.ok) {
					throw new Error("Failed to load titles");
				}
				const data = (await response.json()) as DiscoverResponse;
				if (controller.signal.aborted) {
					console.info("[UI][titles] titles.load.aborted", {
						mediaType,
						selectedGenreId,
						page,
					});
					return;
				}

				console.info("[UI][titles] titles.load.success", {
					mediaType,
					selectedGenreId,
					page: data.page,
					results: data.results?.length ?? 0,
					totalPages: data.total_pages,
					totalResults: data.total_results,
					sample: (data.results ?? []).slice(0, 3).map((entry) => ({
						id: entry.id,
						title: entry.title ?? entry.name ?? "-",
						hasPoster: Boolean(entry.poster_path),
					})),
				});

				const resolvedTotalPages = Math.max(1, data.total_pages ?? 1);
				if (page > resolvedTotalPages) {
					const params = new URLSearchParams(searchParamsString);
					params.set("type", mediaType);
					params.set("genre", String(selectedGenreId));
					params.set("page", String(resolvedTotalPages));
					console.warn("[UI][titles] titles.load.page-out-of-range", {
						requestedPage: page,
						resolvedTotalPages,
						to: params.toString(),
					});
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
			} catch (error) {
				if (controller.signal.aborted) {
					console.info("[UI][titles] titles.load.aborted-catch", {
						mediaType,
						selectedGenreId,
						page,
					});
					return;
				}
				console.error("[UI][titles] titles.load.error", {
					mediaType,
					selectedGenreId,
					page,
					error,
				});
				setTitles([]);
				setTotalPages(1);
				setTotalResults(0);
			} finally {
				if (!controller.signal.aborted) {
					console.info("[UI][titles] titles.load.finally", {
						mediaType,
						selectedGenreId,
						page,
					});
					setTitlesLoading(false);
				}
			}
		};

		loadTitles();
		return () => {
			console.info("[UI][titles] titles.load.cleanup", {
				mediaType,
				selectedGenreId,
				page,
			});
			controller.abort();
		};
	}, [mediaType, page, router, searchParamsString, selectedGenreId]);

	const getTitleName = (entry: TmdbListItem) => entry.title ?? entry.name ?? "-";
	const getTitleYear = (entry: TmdbListItem) =>
		entry.release_date?.slice(0, 4) ?? entry.first_air_date?.slice(0, 4) ?? "-";

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-20 h-40 bg-linear-to-r from-rose-600/25 via-red-500/15 to-amber-400/10 blur-3xl" />

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
							MovieDataX
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
								className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/40 focus:outline-none"
							/>
							<button
								type="submit"
								className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-rose-500"
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
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{titles.map((entry, index) => {
								const name = getTitleName(entry);
								const year = getTitleYear(entry);
								const poster = entry.poster_path
									? `${imageBase}/w500${entry.poster_path}`
									: "/placeholders/title-fallback.svg";

								if (index < 3) {
									console.info("[UI][titles] card.render", {
										id: entry.id,
										name,
										year,
										hasPoster: Boolean(entry.poster_path),
										poster,
									});
								}

								return (
									<div
										key={entry.id}
										className="app-category-card group overflow-hidden rounded-2xl border border-white/15 bg-slate-900/90 shadow-lg shadow-black/30 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-rose-300/60 hover:shadow-2xl hover:shadow-rose-900/20"
									>
										<Link
											href={`/title/${mediaType}/${entry.id}?type=${mediaType}&genre=${selectedGenreId ?? ""}&page=${page}`}
											className="block"
										>
											<div className="app-category-poster relative h-72 bg-slate-800 sm:h-80 lg:h-72">
												<Image
													alt={name}
													src={poster}
													fill
													sizes="(min-width: 1024px) 16rem, (min-width: 640px) 40vw, 70vw"
													className="app-category-poster-image object-cover"
													onLoad={() => {
														if (index < 3) {
															console.info("[UI][titles] image.load", {
																id: entry.id,
																src: poster,
															});
														}
													}}
													onError={() => {
														console.error("[UI][titles] image.error", {
															id: entry.id,
															src: poster,
														});
													}}
												/>
											</div>
											<div className="space-y-3 p-4">
												<p className="line-clamp-2 min-h-10 text-base font-semibold text-white">{name}</p>
												<div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
													<span className="app-category-chip rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/20">{year}</span>
													<span className="app-category-chip rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/20">
														{mediaType === "movie" ? "Filme" : "Série"}
													</span>
													<span className="app-category-chip inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/20">
														<Star className="h-3 w-3" />
														{entry.vote_average?.toFixed(1) ?? "-"}
													</span>
												</div>
												<p className="app-category-hint text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200/90">
													Clique para ver detalhes completos
												</p>
											</div>
										</Link>

									</div>
								);
							})}

							{titles.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-4">
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
