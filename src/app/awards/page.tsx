"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Loader2, Star } from "lucide-react";

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
	source_awards: string[];
};

type AwardsResponse = {
	page: number;
	total_pages: number;
	total_results: number;
	has_more: boolean;
	results: AwardItem[];
};

const imageBase = "https://image.tmdb.org/t/p";

export default function AwardsPage() {
	const router = useRouter();
	const [items, setItems] = useState<AwardItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	useEffect(() => {
		let mounted = true;
		const loadFirstPage = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/imdb/awards?page=1&limit=18");
				if (!response.ok) {
					throw new Error("Falha ao carregar premiações");
				}
				const data = (await response.json()) as AwardsResponse;
				if (!mounted) {
					return;
				}
				setItems(data.results ?? []);
				setPage(data.page ?? 1);
				setTotalPages(Math.max(1, data.total_pages ?? 1));
			} catch {
				if (mounted) {
					setItems([]);
					setPage(1);
					setTotalPages(1);
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

	const loadMore = async () => {
		if (loadingMore || page >= totalPages) {
			return;
		}
		const nextPage = page + 1;
		setLoadingMore(true);
		try {
			const response = await fetch(`/api/imdb/awards?page=${nextPage}&limit=18`);
			if (!response.ok) {
				throw new Error("Falha ao carregar mais premiações");
			}
			const data = (await response.json()) as AwardsResponse;
			setItems((previous) => {
				const seen = new Set(previous.map((item) => `${item.media_type}-${item.id}`));
				const incoming = (data.results ?? []).filter(
					(item) => !seen.has(`${item.media_type}-${item.id}`)
				);
				return [...previous, ...incoming];
			});
			setPage(data.page ?? nextPage);
			setTotalPages(Math.max(1, data.total_pages ?? totalPages));
		} finally {
			setLoadingMore(false);
		}
	};

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-20 h-40 bg-linear-to-r from-rose-600/25 via-red-500/15 to-amber-400/10 blur-3xl" />

				<div className="relative mx-auto max-w-6xl">
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => router.push("/")}
							className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar
						</button>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase text-rose-200">
							<Award className="h-4 w-4" />
							Premiações
						</span>
					</div>
					<h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">Premiações em dados da API</h1>
					<p className="mt-2 text-sm text-white/60">
						Resultados agregados por Oscar, Globo de Ouro, BAFTA, Palma de Ouro e Emmy.
					</p>
				</div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-6xl">
					{loading ? (
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">Carregando premiações...</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{items.map((entry) => {
								const poster = entry.poster_path ? `${imageBase}/w500${entry.poster_path}` : undefined;
								const year = entry.release_date?.slice(0, 4) ?? entry.first_air_date?.slice(0, 4) ?? "-";
								const href = `/title/${entry.media_type}/${entry.id}?type=${entry.media_type}&page=1`;

								return (
									<Link
										key={`${entry.media_type}-${entry.id}`}
										href={href}
										className="block rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-rose-300/50"
									>
										<div className="flex gap-4">
											<div className="relative h-32 w-24 overflow-hidden rounded-2xl bg-white/10">
												{poster ? (
													<Image alt={entry.title} src={poster} fill sizes="96px" className="object-cover" />
												) : (
													<div className="flex h-full items-center justify-center text-xs text-white/50">Sem poster</div>
												)}
											</div>
											<div className="flex-1">
												<p className="text-base font-semibold text-white">{entry.title}</p>
												<p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">{year}</p>
												<p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">
													<Star className="h-3 w-3" />
													{entry.vote_average?.toFixed(1) ?? "-"}
												</p>
											</div>
										</div>
										<p className="mt-3 line-clamp-3 text-sm text-white/70">{entry.overview || "Sem descrição."}</p>
										<div className="mt-3 flex flex-wrap gap-2">
											{entry.source_awards.map((award) => (
												<span key={`${entry.id}-${award}`} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-rose-200">
													{award}
												</span>
											))}
										</div>
									</Link>
								);
							})}

							{items.length === 0 && (
								<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
									Nenhuma premiação encontrada no momento.
								</div>
							)}
						</div>
					)}

					{!loading && page < totalPages && (
						<div className="mt-8 flex justify-center">
							<button
								type="button"
								onClick={loadMore}
								disabled={loadingMore}
								className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-rose-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								{loadingMore ? "Carregando..." : "Mostrar mais premiações"}
							</button>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
