"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clapperboard, TrendingUp, Users } from "lucide-react";

type PopularPersonSpot = {
	id: number;
	name: string;
	known_for_department?: string;
	popularity?: number;
	profile_path?: string;
	known_for_titles: string[];
};

type PopularPeopleResponse = {
	page: number;
	total_pages: number;
	total_results: number;
	results: PopularPersonSpot[];
};

const imageBase = "https://image.tmdb.org/t/p";

export default function PeoplePage() {
	const router = useRouter();
	const [page, setPage] = useState(1);

	const [people, setPeople] = useState<PopularPersonSpot[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [totalResults, setTotalResults] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const readPageFromUrl = () => {
			const params = new URLSearchParams(window.location.search);
			const rawPage = Number(params.get("page") ?? 1);
			const resolved = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
			setPage(resolved);
		};

		readPageFromUrl();
		window.addEventListener("popstate", readPageFromUrl);
		return () => window.removeEventListener("popstate", readPageFromUrl);
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);

		const loadPeople = async () => {
			try {
				const response = await fetch(`/api/imdb/popular-people?page=${page}&limit=18`, {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error("Falha ao carregar atores");
				}
				const data = (await response.json()) as PopularPeopleResponse;
				if (controller.signal.aborted) {
					return;
				}
				setPeople(data.results ?? []);
				setTotalPages(Math.max(1, data.total_pages ?? 1));
				setTotalResults(data.total_results ?? 0);
			} catch {
				if (!controller.signal.aborted) {
					setPeople([]);
					setTotalPages(1);
					setTotalResults(0);
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		loadPeople();
		return () => controller.abort();
	}, [page]);

	const goToPage = (nextPage: number) => {
		setPage(nextPage);
		router.push(`/people?page=${nextPage}`);
	};

	return (
		<main className="app-people-page min-h-screen text-white">
			<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
				<div className="app-people-hero-bg absolute inset-0" />
				<div className="app-people-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />

				<div className="relative mx-auto max-w-6xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => router.push("/")}
								className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</button>
							<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
								<Users className="h-4 w-4" />
								Atores
							</span>
						</div>
						<p className="text-sm text-white/60">{totalResults} perfis encontrados</p>
					</div>
					<h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
						Atores populares
					</h1>
					<p className="mt-2 text-sm text-white/60">
						Página {page} de {totalPages}
					</p>
				</div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-6xl">
					<div className="mb-6 flex items-center justify-end gap-2">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => goToPage(page - 1)}
							className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ChevronLeft className="h-4 w-4" />
							Anterior
						</button>
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => goToPage(page + 1)}
							className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
						>
							Próxima
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>

					{loading ? (
						<div className="app-people-panel rounded-2xl border p-6 text-sm">
							Carregando atores...
						</div>
					) : (
						<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{people.map((person) => {
								const profile = person.profile_path
									? `${imageBase}/w500${person.profile_path}`
									: "/placeholders/person-fallback.svg";

								return (
									<Link
										key={`person-${person.id}`}
										href={`/person/${person.id}`}
										className="app-people-card group block w-64 shrink-0 snap-start rounded-3xl border p-4 transition duration-300 hover:-translate-y-1 sm:w-auto"
									>
										<div className="flex gap-3">
											<div className="app-people-poster relative h-28 w-20 overflow-hidden rounded-2xl">
												<Image
													alt={person.name}
													src={profile}
													fill
													sizes="80px"
													className="object-cover transition duration-300 group-hover:scale-105"
												/>
											</div>
											<div className="flex-1">
												<p className="app-people-name text-sm font-semibold transition sm:text-base">{person.name}</p>
												<p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
													{person.known_for_department ?? "Atuação"}
												</p>
												<div className="mt-2 flex flex-wrap gap-1.5">
													<span className="app-people-chip inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold sm:text-xs">
														<TrendingUp className="h-3 w-3" />
														{person.popularity?.toFixed(1) ?? "-"}
													</span>
													<span className="app-people-chip inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold sm:text-xs">
														<Clapperboard className="h-3 w-3" />
														{person.known_for_titles.length} títulos
													</span>
												</div>
											</div>
										</div>
										<div className="mt-3 flex flex-wrap gap-1.5">
											{person.known_for_titles.length > 0 ? (
												person.known_for_titles.map((knownTitle) => (
													<span
														key={`${person.id}-${knownTitle}`}
														className="app-people-chip rounded-full border px-2 py-1 text-[11px] sm:text-xs"
													>
														{knownTitle}
													</span>
												))
											) : (
												<span className="text-xs text-white/50">Sem títulos conhecidos</span>
											)}
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
