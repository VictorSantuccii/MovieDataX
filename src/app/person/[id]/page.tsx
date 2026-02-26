import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

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
		const profile = person.profile_path ? `${imageBase}/w500${person.profile_path}` : undefined;
		const knownCast = (person.combined_credits?.cast ?? [])
			.filter((entry) => Boolean(entry.title ?? entry.name))
			.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
			.slice(0, 12);

		return (
			<main className="min-h-screen bg-[#0b0b0f] text-white">
				<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
					<div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
						<div>
							<Link
								href="/people"
								className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 transition hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</Link>
							<div className="relative h-96 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/50">
								{profile ? (
									<Image
										alt={person.name}
										src={profile}
										fill
										sizes="260px"
										className="object-cover"
									/>
								) : (
									<div className="flex h-full items-center justify-center text-sm text-white/70">
										Sem foto disponível
									</div>
								)}
							</div>
						</div>
						<div className="space-y-6">
							<div>
								<h1 className="text-3xl font-semibold sm:text-4xl">{person.name}</h1>
								<p className="mt-2 text-sm uppercase tracking-[0.22em] text-white/60">
									{person.known_for_department ?? "Atuação"}
								</p>
							</div>

							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								<div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Popularidade</p>
									<p className="mt-1 text-sm text-white">{person.popularity?.toFixed(1) ?? "-"}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Nascimento</p>
									<p className="mt-1 text-sm text-white">{person.birthday ?? "-"}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
									<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Local de nascimento</p>
									<p className="mt-1 text-sm text-white">{person.place_of_birth ?? "-"}</p>
								</div>
							</div>

							<div className="rounded-2xl border border-white/10 bg-black/30 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">Biografia</p>
								<p className="mt-2 text-sm leading-relaxed text-white/85">
									{person.biography?.trim() || "Biografia indisponível."}
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="px-6 pb-20 sm:px-10 lg:px-16">
					<div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-5">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
							Títulos conhecidos
						</p>
						<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{knownCast.length > 0 ? (
								knownCast.map((credit) => (
									<div
										key={`${credit.media_type}-${credit.id}-${credit.character ?? credit.job ?? ""}`}
										className="rounded-xl border border-white/10 bg-black/30 px-3 py-3"
									>
										<p className="text-sm font-semibold text-white">{credit.title ?? credit.name ?? "-"}</p>
										<p className="mt-1 text-xs text-white/70">
											{credit.character ?? credit.job ?? "Sem personagem informado"}
										</p>
										<p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
											<Star className="h-3 w-3" />
											{credit.vote_average?.toFixed(1) ?? "-"}
										</p>
									</div>
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
