import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { getPersonDetails } from "@/lib/imdb";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

const imageBase = "https://image.tmdb.org/t/p";

export default async function PersonDetailsPage({ params }: PageProps) {
	const { id: idParam } = await params;
	const id = Number(idParam);

	if (!Number.isFinite(id) || id <= 0) {
		return (
			<main className="min-h-screen bg-[#0b0b0f] px-6 py-16 text-white sm:px-10 lg:px-16">
				<div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
					ID de ator inválido.
				</div>
			</main>
		);
	}

	try {
		const person = await getPersonDetails(id);
		const profile = person.profile_path ? `${imageBase}/w500${person.profile_path}` : "/placeholders/person-fallback.svg";
		const knownCast = (person.combined_credits?.cast ?? [])
			.filter((entry) => Boolean(entry.title ?? entry.name))
			.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
			.slice(0, 12);

		const resolveCreditType = (credit: { media_type?: "movie" | "tv"; first_air_date?: string; release_date?: string }) => {
			if (credit.media_type === "movie" || credit.media_type === "tv") {
				return credit.media_type;
			}
			if (credit.first_air_date) {
				return "tv";
			}
			if (credit.release_date) {
				return "movie";
			}
			return "movie";
		};

		return (
			<main className="app-internal-page min-h-screen text-white">
				<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
					<div className="app-internal-hero-bg absolute inset-0" />
					<div className="app-internal-hero-glow absolute inset-x-0 top-20 h-40 blur-3xl" />
					<div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
						<div>
							<div className="relative h-96 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/50">
								<Image
									alt={person.name}
									src={profile}
									fill
									sizes="260px"
									className="object-cover"
								/>
							</div>
						</div>
						<div className="space-y-6">
							<div>
								<h1 className="text-3xl font-semibold sm:text-4xl">{person.name}</h1>
								<p className="mt-2 text-sm uppercase tracking-[0.22em] text-white/60">
									{person.known_for_department ?? "Atuação"}
								</p>
							</div>

							<div className="app-person-stats grid gap-3 sm:grid-cols-3">
								<div className="app-detail-stat app-detail-stat-featured rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Popularidade</p>
									<p className="mt-2 text-2xl font-bold text-white">{person.popularity?.toFixed(1) ?? "-"}</p>
									<p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-rose-200">Índice TMDB</p>
								</div>
								<div className="app-detail-stat rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Nascimento</p>
									<p className="mt-2 text-base font-semibold text-white">{person.birthday ?? "-"}</p>
									<p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">Data de nascimento</p>
								</div>
								<div className="app-detail-stat rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Local de nascimento</p>
									<p className="mt-2 line-clamp-2 text-base font-semibold text-white">{person.place_of_birth ?? "-"}</p>
									<p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">Origem</p>
								</div>
							</div>

							<div className="app-person-biography rounded-2xl border border-white/10 bg-black/30 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">Biografia</p>
								<p className="mt-2 text-sm leading-relaxed text-white/85">
									{person.biography?.trim() || "Biografia indisponível."}
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="px-6 pb-20 sm:px-10 lg:px-16">
					<div className="app-person-filmography mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-5">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
							Títulos conhecidos
						</p>
						<div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{knownCast.length > 0 ? (
								knownCast.map((credit) => (
									<Link
										key={`${credit.media_type}-${credit.id}-${credit.character ?? credit.job ?? ""}`}
										href={`/title/${resolveCreditType(credit)}/${credit.id}?type=${resolveCreditType(credit)}&page=1`}
										className="app-person-credit group w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-black/30 transition hover:-translate-y-1 hover:border-rose-300/50 sm:w-auto"
									>
										<div className="relative aspect-3/4 overflow-hidden bg-white/10">
											<Image
												alt={credit.title ?? credit.name ?? "-"}
												src={credit.poster_path ? `${imageBase}/w342${credit.poster_path}` : "/placeholders/title-fallback.svg"}
												fill
												sizes="(min-width: 1024px) 30vw, 256px"
												className="object-cover transition duration-500 group-hover:scale-105"
											/>
											<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-3 pb-2 pt-8">
												<span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white">
													<Star className="h-3 w-3 text-amber-300" />
													{credit.vote_average?.toFixed(1) ?? "-"}
												</span>
											</div>
										</div>
										<div className="p-3">
											<p className="line-clamp-1 text-sm font-semibold text-white">{credit.title ?? credit.name ?? "-"}</p>
											<p className="mt-1 line-clamp-1 text-xs text-white/70">
												{credit.character ?? credit.job ?? "Título conhecido"}
											</p>
										</div>
									</Link>
								))
							) : (
								<p className="text-sm text-white/70">Sem títulos conhecidos disponíveis.</p>
							)}
						</div>
					</div>
				</section>
			</main>
		);
	} catch {
		return (
			<main className="min-h-screen bg-[#0b0b0f] px-6 py-16 text-white sm:px-10 lg:px-16">
				<div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
					Não foi possível carregar os detalhes do ator.
				</div>
			</main>
		);
	}
}
