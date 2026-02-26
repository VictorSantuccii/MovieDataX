"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Loader2, Play, Search, Star, Ticket } from "lucide-react";

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
	const [loadingMore, setLoadingMore] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const readQueryFromUrl = () => {
			const params = new URLSearchParams(window.location.search);
			setQuery(params.get("q")?.trim() ?? "");
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
			console.info("[UI][search] empty query");
			setResults([]);
			setPage(1);
			setTotalPages(1);
			setTotalResults(0);
			setStatus("idle");
			return;
		}

		let isActive = true;
		const loadResults = async (targetPage: number, append = false) => {
			if (append) {
				setLoadingMore(true);
			} else {
				setStatus("loading");
			}
			console.info("[UI][search] loading", { query, page: targetPage, append });
			try {
				const response = await fetch(
					`/api/imdb/search?q=${encodeURIComponent(query)}&page=${targetPage}`
				);
				console.info("[UI][search] response", {
					status: response.status,
					query,
					page: targetPage,
				});
				if (!response.ok) {
					throw new Error("Search failed");
				}
				const data = (await response.json()) as SearchResponse;
				console.info("[UI][search] results", {
					query,
					page: data.page,
					totalPages: data.total_pages,
					totalResults: data.total_results,
					total: data.results?.length ?? 0,
				});
				if (isActive) {
					setResults((previous) => {
						if (!append) {
							return data.results ?? [];
						}
						const seen = new Set(previous.map((item) => `${item.media_type}-${item.id}`));
						const incoming = (data.results ?? []).filter(
							(item) => !seen.has(`${item.media_type}-${item.id}`)
						);
						return [...previous, ...incoming];
					});
					setPage(data.page ?? targetPage);
					setTotalPages(Math.max(1, data.total_pages ?? 1));
					setTotalResults(data.total_results ?? 0);
					setOpenId(null);
					setStatus("done");
				}
			} catch (error) {
				console.error("[UI][search] load error", {
					query,
					error: error instanceof Error ? error.message : "Unknown error",
				});
				if (isActive) {
					setStatus("error");
				}
			} finally {
				if (isActive) {
					setLoadingMore(false);
				}
			}
		};

		void loadResults(1, false);

		return () => {
			isActive = false;
		};
	}, [query]);

	const total = totalResults || results.length;

	const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = searchInput.trim();
		if (!trimmed) {
			setQuery("");
			router.push("/search");
			return;
		}
		setQuery(trimmed);
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	const handleLoadMore = async () => {
		if (loadingMore || page >= totalPages || !query) {
			return;
		}

		const nextPage = page + 1;
		setLoadingMore(true);
		try {
			const response = await fetch(`/api/imdb/search?q=${encodeURIComponent(query)}&page=${nextPage}`);
			if (!response.ok) {
				throw new Error("Search failed");
			}
			const data = (await response.json()) as SearchResponse;
			setResults((previous) => {
				const seen = new Set(previous.map((item) => `${item.media_type}-${item.id}`));
				const incoming = (data.results ?? []).filter(
					(item) => !seen.has(`${item.media_type}-${item.id}`)
				);
				return [...previous, ...incoming];
			});
			setPage(data.page ?? nextPage);
			setTotalPages(Math.max(1, data.total_pages ?? totalPages));
			setTotalResults(data.total_results ?? totalResults);
			setStatus("done");
		} catch {
			setStatus("error");
		} finally {
			setLoadingMore(false);
		}
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
		return "";
	}, [query, status, total]);

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<section className="relative overflow-hidden px-6 pb-12 pt-16 sm:px-10 lg:px-16">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-20 h-40 bg-linear-to-r from-rose-600/25 via-red-500/15 to-amber-400/10 blur-3xl" />
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
							MovieDataX
						</span>
						<span className="text-2xl font-semibold tracking-[0.2em] text-white sm:text-3xl lg:text-4xl">
							Resultados
						</span>
					</motion.div>
					<motion.div variants={item}>
						<form
							onSubmit={handleSearchSubmit}
							className="mb-4 flex w-full max-w-2xl items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3"
						>
							<Search className="h-5 w-5 text-rose-200" />
							<input
								type="text"
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Pesquisar filmes e séries"
								className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/45 focus:outline-none"
							/>
							<button
								type="submit"
								className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-rose-500"
							>
								Buscar
							</button>
						</form>
						<h1 className="text-3xl font-semibold text-white sm:text-4xl">
							Busca por: {query || "-"}
						</h1>
						<p className="mt-3 text-sm text-white/60">{total} títulos encontrados.</p>
					</motion.div>
				</motion.div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-6xl">
					{emptyState ? (
						<div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
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
							{results.map((title) => {
								const name = title.title ?? title.name ?? "-";
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
									: undefined;
								const backdrop = title.backdrop_path
									? `${imageBase}/w780${title.backdrop_path}`
									: undefined;
								const backdrops = title.images?.backdrops?.slice(0, 3) ?? [];
								const postersCount = title.images?.posters?.length ?? 0;
								const backdropsCount = title.images?.backdrops?.length ?? 0;
								const videosCount = title.videos?.results?.length ?? 0;
								const reviews = title.reviews?.results ?? [];
								const reviewsCount = title.reviews?.total_results ?? reviews.length;
								const rowId = `${title.media_type}-${title.id}`;
								const isOpen = openId === rowId;
								const director = title.credits?.crew?.find(
									(member) => member.job === "Director"
								);
								const creator = title.created_by?.[0];
								const cast = title.credits?.cast?.slice(0, 6) ?? [];
								const leadName = director?.name ?? creator?.name ?? "-";
								const status = title.status ?? "-";
								const budget =
									title.media_type === "movie" ? formatMoney(title.budget) : "-";
								const revenue =
									title.media_type === "movie" ? formatMoney(title.revenue) : "-";

								return (
									<motion.article
										key={rowId}
										className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
										variants={item}
									>
										<div className="grid gap-6 p-6 lg:grid-cols-[200px_1fr]">
											<div className="flex flex-col gap-4">
												<div className="relative h-75 overflow-hidden rounded-2xl bg-white/10">
													{poster ? (
														<Image
															alt={name}
															src={poster}
															fill
															sizes="(min-width: 1024px) 200px, 60vw"
															className="object-cover"
														/>
													) : (
														<div className="flex h-75 items-center justify-center text-xs text-white/50">
															Poster indisponível
														</div>
													)}
												</div>
												<div className="flex flex-wrap gap-2">
													<span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-200">
														{title.media_type === "movie" ? "Filme" : "Série"}
													</span>
													<span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/70">
														{year}
													</span>
												</div>
											</div>

											<div className="space-y-4">
												<div className="flex flex-wrap items-center justify-between gap-3">
													<div>
														<h2 className="text-2xl font-semibold text-white">{name}</h2>
														<p className="text-sm uppercase tracking-[0.3em] text-white/40">
															{formatDate(title.release_date ?? title.first_air_date)}
														</p>
													</div>
													<div className="flex flex-wrap items-center gap-2">
														<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
															<Star className="h-3 w-3" />
															{title.vote_average?.toFixed(1) ?? "-"}
														</span>
														<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
															{title.vote_count ?? 0} votos
														</span>
														<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
															{runtime}
														</span>
													</div>
												</div>

												<p className="text-sm text-white/70">
													{title.overview || "Sem descrição cadastrada."}
												</p>

												<div className="flex flex-wrap gap-2">
													{title.genres?.slice(0, 4).map((genre) => (
														<span
															key={genre.id}
															className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/70"
														>
															{genre.name}
														</span>
													))}
												</div>

												<div className="flex flex-wrap items-center gap-3">
													{trailer ? (
														<a
															className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-rose-500"
															href={`https://www.youtube.com/watch?v=${trailer.key}`}
															target="_blank"
															rel="noreferrer"
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
															className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70"
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
														className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-rose-400/60 hover:text-white"
														aria-expanded={isOpen}
													>
														{isOpen ? "Ocultar dados" : "Ver dados completos"}
													</button>
												</div>

												<div className="grid gap-3 sm:grid-cols-3">
													{backdrops.map((image) => (
														<div
															key={image.file_path}
															className="relative h-24 overflow-hidden rounded-2xl border border-white/10"
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
													<div className="grid gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
														<div>
															<p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
																Detalhes do título
															</p>
															<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Tipo
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">
																		{title.media_type === "movie" ? "Filme" : "Série"}
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Direção
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">{leadName}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Duração
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">{runtime}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Avaliações
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">
																		{title.vote_average?.toFixed(1) ?? "-"} ({title.vote_count ?? 0})
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Status
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">{status}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Gêneros
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">
																		{title.genres?.map((genre) => genre.name).join(", ") || "-"}
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Orçamento
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">{budget}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Imagens
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">
																		{postersCount} posters, {backdropsCount} backdrops
																	</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Receita
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">{revenue}</p>
																</div>
																<div className="rounded-xl border border-white/10 bg-white/5 p-3">
																	<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
																		Videos
																	</p>
																	<p className="mt-2 text-sm font-semibold text-white">
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
																<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
																	{cast.map((person) => {
																		const profile = person.profile_path
																			? `${imageBase}/w185${person.profile_path}`
																			: undefined;

																		return (
																			<div
																				key={person.id}
																				className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
																			>
																				<div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">
																					{profile ? (
																						<Image
																							alt={person.name}
																							src={profile}
																							fill
																							sizes="40px"
																							className="object-cover"
																						/>
																					) : (
																						<div className="flex h-full items-center justify-center text-[10px] text-white/60">
																							-
																						</div>
																					)}
																				</div>
																				<div>
																					<p className="text-xs font-semibold text-white">{person.name}</p>
																					<p className="text-[10px] text-white/60">
																						{person.character ?? "-"}
																					</p>
																				</div>
																			</div>
																		);
																	})}
																	{status === "done" && query && page < totalPages && (
																		<div className="flex justify-center">
																			<button
																				type="button"
																				onClick={handleLoadMore}
																				disabled={loadingMore}
																				className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-rose-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
																			>
																				{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
																				{loadingMore ? "Carregando..." : "Mostrar mais filmes"}
																			</button>
																		</div>
																	)}
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
																			className="rounded-2xl border border-white/10 bg-white/5 p-3"
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
					</div>
				)}
			</div>
		</section>
	</main>
	);
}
