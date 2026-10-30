"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, Calendar, Clapperboard, Star, TrendingUp, Users } from "lucide-react";

type AwardItem = {
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
	results: AwardItem[];
};

type YearDistributionItem = {
	year: number;
	count: number;
};

type AwardsResponse = {
	page: number;
	total_pages: number;
	total_results: number;
	has_more: boolean;
	available_awards?: string[];
	year_distribution?: YearDistributionItem[];
	award_sections?: AwardSection[];
	results: AwardItem[];
};

const imageBase = "https://image.tmdb.org/t/p";

export default function AwardsPage() {
	const [items, setItems] = useState<AwardItem[]>([]);
	const [sections, setSections] = useState<AwardSection[]>([]);
	const [yearDistribution, setYearDistribution] = useState<YearDistributionItem[]>([]);
	const [availableAwards, setAvailableAwards] = useState<string[]>([]);
	const [totalResults, setTotalResults] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		const loadFirstPage = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/imdb/awards?page=1&limit=90&award_limit=18");
				if (!response.ok) {
					throw new Error("Falha ao carregar premiações");
				}
				const data = (await response.json()) as AwardsResponse;
				if (!mounted) {
					return;
				}
				setItems(data.results ?? []);
				setSections(data.award_sections ?? []);
				setYearDistribution(data.year_distribution ?? []);
				setAvailableAwards(data.available_awards ?? []);
				setTotalResults(data.total_results ?? 0);
			} catch {
				if (mounted) {
					setItems([]);
					setSections([]);
					setYearDistribution([]);
					setAvailableAwards([]);
					setTotalResults(0);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void loadFirstPage();
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<main className="app-awards-page min-h-screen text-white">
			<section className="relative overflow-hidden px-6 pb-8 pt-8 sm:px-10 lg:px-16">
				<div className="app-awards-hero-bg absolute inset-0" />
				<div className="app-awards-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />

				<div className="relative mx-auto max-w-7xl text-center">
					<div className="mb-3 flex items-center justify-center gap-3">
						<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
						<span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200/80">
							<Award className="h-4 w-4" />
							Premiações
						</span>
						<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
					</div>
					<h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">Premiações</h1>
					<p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
						Explore títulos reconhecidos, principais eventos e anos marcantes do cinema e da televisão.
					</p>
					<div className="mt-5 flex flex-wrap justify-center gap-2">
						<span className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
							<Clapperboard className="h-4 w-4 text-rose-200" />
							{totalResults} títulos
						</span>
						<span className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
							<Award className="h-4 w-4 text-rose-200" />
							{availableAwards.length} premiações
						</span>
						<span className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
							<Calendar className="h-4 w-4 text-rose-200" />
							{yearDistribution.length} anos mapeados
						</span>
					</div>
				</div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-7xl">
					{loading ? (
						<div className="app-awards-panel rounded-2xl border p-6 text-sm">Carregando premiações...</div>
					) : (
						<div className="space-y-10">
							{yearDistribution.length > 0 && (
								<div className="app-awards-panel rounded-[2rem] border p-5 shadow-2xl">
									<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">Anos disponíveis</p>
									<div className="mt-4 flex flex-wrap gap-2">
										{yearDistribution.slice(0, 18).map((yearItem) => (
											<span
												key={yearItem.year}
												className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
											>
												{yearItem.year}
												<span className="text-white/60">({yearItem.count})</span>
											</span>
										))}
									</div>
								</div>
							)}

							{sections.map((section) => (
								<div key={section.award} className="space-y-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">Premiação</p>
											<h2 className="mt-1 text-2xl font-semibold text-white">{section.award}</h2>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<span className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
												<Clapperboard className="h-3.5 w-3.5 text-rose-200" />
												{section.total_results} títulos
											</span>
											<span className="app-awards-pill inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
												<Calendar className="h-3.5 w-3.5 text-rose-200" />
												{section.available_years.slice(0, 6).join(" • ") || "Sem ano"}
											</span>
										</div>
									</div>

									<div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
										{section.results.map((entry) => {
											const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : "/placeholders/title-fallback.svg";
											const year = entry.release_date?.slice(0, 4) ?? entry.first_air_date?.slice(0, 4) ?? "-";
											const href = `/title/${entry.media_type}/${entry.id}?type=${entry.media_type}&page=1`;

											return (
												<Link
													key={`${section.award}-${entry.media_type}-${entry.id}`}
													href={href}
													className="app-awards-card group block overflow-hidden rounded-2xl border p-3 transition hover:-translate-y-1"
												>
													<div className="app-awards-poster relative aspect-[2/3] overflow-hidden rounded-xl">
															<Image alt={entry.title} src={poster} fill sizes="(min-width: 1280px) 20vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
														</div>
														<div className="space-y-2 p-1 pt-3">
															<p className="line-clamp-2 text-sm font-semibold text-white">{entry.title}</p>
															<p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
																<Calendar className="h-3 w-3" />
																{year}
															</p>
															<div className="flex flex-wrap gap-1.5 text-[10px]">
																<span className="app-awards-pill inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold">
																	<Star className="h-3 w-3" />
																	{entry.vote_average?.toFixed(1) ?? "-"}
																</span>
																<span className="app-awards-pill inline-flex items-center gap-1 rounded-full px-2 py-1">
																	<Users className="h-3 w-3" />
																	{entry.vote_count?.toLocaleString("pt-BR") ?? "-"}
																</span>
																<span className="app-awards-pill inline-flex items-center gap-1 rounded-full px-2 py-1">
																	<TrendingUp className="h-3 w-3" />
																	{entry.popularity?.toFixed(1) ?? "-"}
																</span>
															</div>
														</div>
													<p className="mt-3 line-clamp-3 text-sm text-white/70">{entry.overview || "Sem descrição."}</p>
													<div className="mt-3 flex flex-wrap gap-2">
														{entry.source_awards.map((award) => (
															<span key={`${entry.id}-${award}`} className="app-awards-pill inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
																<Award className="h-3 w-3" />
																{award}
															</span>
														))}
													</div>
												</Link>
											);
										})}
									</div>
								</div>
							))}

							{sections.length === 0 && items.length === 0 && (
								<div className="app-awards-panel rounded-2xl border p-6 text-sm">
									Nenhuma premiação encontrada no momento.
								</div>
							)}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
