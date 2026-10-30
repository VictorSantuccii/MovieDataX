"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clapperboard, TrendingUp, Users } from "lucide-react";

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
			<section className="relative overflow-hidden px-6 pb-8 pt-8 sm:px-10 lg:px-16">
				<div className="app-people-hero-bg absolute inset-0" />
				<div className="app-people-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />

				<div className="relative mx-auto max-w-7xl">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-3">
							<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
								<Users className="h-4 w-4" />
								Atores
							</span>
						</div>
					</div>
					<div className="mx-auto mt-8 max-w-3xl text-center">
						<div className="mb-3 flex items-center justify-center gap-3">
							<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
							<span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200/80">
								Elenco em destaque
							</span>
							<span className="h-px w-10 bg-rose-400/70 sm:w-16" />
						</div>
						<h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
							Atores
						</h1>
						<p className="mt-2 text-sm leading-6 text-white/55 sm:text-base">
							Conheça os nomes que estão em evidência no cinema e nas séries.
						</p>
						<p className="mt-3 text-xs uppercase tracking-[0.24em] text-white/45">
							Página {page} de {totalPages}
						</p>
					</div>
				</div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto max-w-7xl">
					<div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-200/75">
							Perfis populares
						</p>
						<div className="flex items-center gap-2">
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
					</div>

					{loading ? (
						<div className="app-people-panel rounded-2xl border p-6 text-sm">
							Carregando atores...
						</div>
					) : (
						<div className="grid items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
							{people.map((person, index) => {
								const profile = person.profile_path
									? `${imageBase}/w500${person.profile_path}`
									: "/placeholders/person-fallback.svg";

								return (
									<Link
										key={`person-${person.id}`}
										href={`/person/${person.id}`}
										className="app-people-card group block overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1"
									>
										<div className="app-people-poster relative aspect-[5/4] overflow-hidden">
												<Image
													alt={person.name}
													src={profile}
													fill
													sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 640px) 25vw, 50vw"
													className="object-cover object-top transition duration-500 group-hover:scale-105"
												/>
												<div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
												<span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80">
													#{String(index + 1).padStart(2, "0")}
												</span>
											</div>
											<div className="space-y-2.5 p-3">
												<div>
													<p className="app-people-name line-clamp-1 text-sm font-semibold transition sm:text-base">{person.name}</p>
													<p className="mt-1 line-clamp-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
														{person.known_for_department ?? "Atuação"}
													</p>
												</div>
												<div className="grid grid-cols-2 gap-1.5">
													<span className="app-people-chip inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold">
														<TrendingUp className="h-3 w-3" />
														{person.popularity?.toFixed(1) ?? "-"}
													</span>
													<span className="app-people-chip inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold">
														<Clapperboard className="h-3 w-3" />
														{person.known_for_titles.length} títulos
													</span>
												</div>
										</div>
										<div className="flex flex-wrap gap-1 border-t border-white/10 px-3 pb-3 pt-2.5">
											{person.known_for_titles.length > 0 ? (
												person.known_for_titles.map((knownTitle) => (
													<span
														key={`${person.id}-${knownTitle}`}
														className="app-people-chip max-w-full truncate rounded-full border px-2 py-1 text-[10px]"
													>
														{knownTitle}
													</span>
												))
											) : (
												<span className="text-xs text-white/50">Sem títulos conhecidos</span>
											)}
										</div>
										<div className="px-3 pb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-rose-200/75">
											Ver perfil completo
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
