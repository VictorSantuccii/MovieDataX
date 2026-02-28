import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";

import { discoverTitles, getTitleDetails, getTitleReviews } from "@/lib/imdb";
import TitleGallery from "@/components/title-gallery";
import TitleKeyboardNav from "@/components/title-keyboard-nav";

type PageProps = {
	params: Promise<{
		mediaType: string;
		id: string;
	}>;
	searchParams: Promise<{
		type?: string;
		genre?: string;
		page?: string;
	}>;
};

const imageBase = "https://image.tmdb.org/t/p";

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

const formatDate = (value?: string) => {
	if (!value) {
		return "-";
	}
	return value;
};

export default async function TitleDetailsPage({ params, searchParams }: PageProps) {
	const resolvedParams = await params;
	const resolvedSearch = await searchParams;
	const mediaType = resolvedParams.mediaType === "tv" ? "tv" : "movie";
	const id = Number(resolvedParams.id);
	const queryGenre = resolvedSearch.genre;
	const queryPage = Number(resolvedSearch.page ?? 1);
	const currentPage = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
	const parsedGenre = Number(queryGenre);
	const currentGenre = Number.isFinite(parsedGenre) && parsedGenre > 0 ? parsedGenre : undefined;

	const listBaseQuery =
		currentGenre !== undefined
			? `type=${mediaType}&genre=${currentGenre}&page=${currentPage}`
			: `type=${mediaType}&page=${currentPage}`;

	if (!Number.isFinite(id) || id <= 0) {
		return (
			<main className="app-title-page min-h-screen bg-[#0b0b0f] px-6 py-16 text-white sm:px-10 lg:px-16">
				<div className="app-title-empty mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
					ID inválido.
				</div>
			</main>
		);
	}

	try {
		const [details, reviews, currentList] = await Promise.all([
			getTitleDetails(mediaType, id),
			getTitleReviews(mediaType, id),
			currentGenre !== undefined
				? discoverTitles(mediaType, {
						genreId: currentGenre,
						page: currentPage,
					})
				: Promise.resolve(null),
		]);

		const currentIds = currentList?.results?.map((entry) => entry.id) ?? [];
		const currentIndex = currentIds.indexOf(id);
		const previousId = currentIndex > 0 ? currentIds[currentIndex - 1] : undefined;
		const nextId = currentIndex >= 0 && currentIndex < currentIds.length - 1 ? currentIds[currentIndex + 1] : undefined;
		const previousHref = previousId ? `/title/${mediaType}/${previousId}?${listBaseQuery}` : undefined;
		const nextHref = nextId ? `/title/${mediaType}/${nextId}?${listBaseQuery}` : undefined;

		const name = details.title ?? details.name ?? "-";
		const year = details.release_date?.slice(0, 4) ?? details.first_air_date?.slice(0, 4) ?? "-";
		const runtime = details.runtime
			? `${details.runtime} min`
			: details.episode_run_time?.[0]
				? `${details.episode_run_time[0]} min`
				: "-";
		const poster = details.poster_path ? `${imageBase}/w500${details.poster_path}` : "/placeholders/title-fallback.svg";
		const backdrop = details.backdrop_path
			? `${imageBase}/w1280${details.backdrop_path}`
			: undefined;
		const trailer = details.videos?.results?.find(
			(video) => video.site === "YouTube" && video.type === "Trailer"
		);
		const director = details.credits?.crew?.find((crew) => crew.job === "Director");
		const creator = details.created_by?.[0];
		const cast = details.credits?.cast?.slice(0, 12) ?? [];
		const genres = details.genres ?? [];
		const reviewItems = reviews.results?.slice(0, 6) ?? [];
		const galleryImages = [...(details.images?.backdrops ?? []), ...(details.images?.posters ?? [])].filter(
			(image, index, array) => array.findIndex((entry) => entry.file_path === image.file_path) === index
		);
		const infoItems = [
			{ label: "Tipo", value: mediaType === "movie" ? "Filme" : "Série" },
			{ label: "Ano", value: year },
			{ label: "Duração", value: runtime },
			{ label: "Status", value: details.status ?? "-" },
			{ label: "Lançamento", value: formatDate(details.release_date ?? details.first_air_date) },
			{ label: "Nota", value: details.vote_average?.toFixed(1) ?? "-" },
			{ label: "Votos", value: details.vote_count?.toLocaleString("pt-BR") ?? "-" },
			{ label: "Direção/Criação", value: director?.name ?? creator?.name ?? "-" },
			{ label: "Orçamento", value: mediaType === "movie" ? formatMoney(details.budget) : "-" },
			{ label: "Receita", value: mediaType === "movie" ? formatMoney(details.revenue) : "-" },
			{ label: "Temporadas", value: mediaType === "tv" ? String(details.number_of_seasons ?? "-") : "-" },
			{ label: "Episódios", value: mediaType === "tv" ? String(details.number_of_episodes ?? "-") : "-" },
		];

		return (
			<main className="app-title-page min-h-screen bg-[#0b0b0f] text-white">
				<TitleKeyboardNav previousHref={previousHref} nextHref={nextHref} />
				<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
					<div className="app-title-hero-bg absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
					{backdrop && (
						<Image
							alt={name}
							src={backdrop}
							fill
							sizes="100vw"
							className="app-title-backdrop object-cover opacity-25"
						/>
					)}
					<div className="app-title-hero-overlay absolute inset-0 bg-linear-to-b from-black/65 via-black/55 to-[#0b0b0f]" />

					<div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
						<div>
							<Link
								href={`/titles?${listBaseQuery}`}
								className="app-title-pill mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 transition hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</Link>
							<div className="app-title-poster-shell relative h-96 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/50">
								<Image
									alt={name}
									src={poster}
									fill
									sizes="260px"
									className="app-title-poster-image object-cover"
								/>
							</div>
						</div>

						<div className="space-y-6">
							<div>
								<h1 className="text-3xl font-semibold sm:text-4xl">{name}</h1>
								<p className="mt-2 text-sm text-white/70">{details.tagline ?? ""}</p>
								<div className="mt-4 flex flex-wrap gap-2">
									{genres.map((genre) => (
										<Link
											key={genre.id}
											href={`/titles?type=${mediaType}&genre=${genre.id}&page=1`}
											className="app-title-chip rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200"
										>
											{genre.name}
										</Link>
									))}
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{infoItems.map((info) => (
									<div
										key={info.label}
										className="app-title-info-card rounded-xl border border-white/10 bg-black/30 px-3 py-3"
									>
										<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
											{info.label}
										</p>
										<p className="mt-1 text-sm text-white">{info.value}</p>
									</div>
								))}
							</div>

							<div className="app-title-synopsis rounded-2xl border border-white/10 bg-black/30 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
									Sinopse
								</p>
								<p className="mt-2 text-sm leading-relaxed text-white/85">
									{details.overview ?? "Sem sinopse disponivel."}
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								{previousId ? (
									<Link
										href={previousHref!}
										className="app-title-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 hover:text-white"
									>
										<ChevronLeft className="h-4 w-4" />
										Anterior
									</Link>
								) : (
									<span className="app-title-pill-disabled inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
										<ChevronLeft className="h-4 w-4" />
										Anterior
									</span>
								)}

								<span className="app-title-pill app-title-rating inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
									<Star className="h-4 w-4 text-amber-300" />
									{details.vote_average?.toFixed(1) ?? "-"}
								</span>

								{nextId ? (
									<Link
										href={nextHref!}
										className="app-title-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 hover:text-white"
									>
										Próximo
										<ChevronRight className="h-4 w-4" />
									</Link>
								) : (
									<span className="app-title-pill-disabled inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
										Próximo
										<ChevronRight className="h-4 w-4" />
									</span>
								)}

								{trailer && (
									<Link
										href={`https://www.youtube.com/watch?v=${trailer.key}`}
										target="_blank"
										rel="noreferrer"
										className="app-title-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 hover:text-white"
									>
										<Play className="h-4 w-4 text-rose-300" />
										Ver trailer
									</Link>
								)}
								{details.homepage && (
									<Link
										href={details.homepage}
										target="_blank"
										rel="noreferrer"
										className="app-title-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 hover:text-white"
									>
										Site oficial
									</Link>
								)}
							</div>
						</div>
					</div>
				</section>

				<section className="px-6 pb-20 sm:px-10 lg:px-16">
					<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
						<div className="app-title-panel rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
								Elenco principal
							</p>
							<div className="mt-4 grid gap-2">
								{cast.length > 0 ? (
									cast.map((member) => (
										<Link
											key={member.id}
											href={`/person/${member.id}`}
											className="app-title-row rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:border-rose-300/50"
										>
											<span className="font-semibold text-white">{member.name}</span>
											<span className="text-white/70"> {member.character ? `• ${member.character}` : ""}</span>
										</Link>
									))
								) : (
									<p className="text-sm text-white/70">Sem elenco disponível.</p>
								)}
							</div>
						</div>

						<div className="app-title-panel rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
								Reviews
							</p>
							<p className="mt-1 text-xs text-white/60">
								Total: {reviews.total_results?.toLocaleString("pt-BR") ?? 0}
							</p>
							<div className="mt-4 grid gap-3">
								{reviewItems.length > 0 ? (
									reviewItems.map((review) => (
										<div
											key={review.id}
											className="app-title-row rounded-lg border border-white/10 bg-black/25 px-3 py-3"
										>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
												{review.author}
											</p>
											<p className="mt-2 line-clamp-5 text-sm text-white/85">
												{review.content}
											</p>
										</div>
									))
								) : (
									<p className="text-sm text-white/70">Sem reviews disponíveis.</p>
								)}
							</div>
						</div>
					</div>

					{galleryImages.length > 0 && (
						<div className="mx-auto mt-6 max-w-6xl">
							<TitleGallery
								title={name}
								images={galleryImages.map((image) => `${imageBase}/w1280${image.file_path}`)}
							/>
						</div>
					)}
				</section>
			</main>
		);
	} catch {
		return (
			<main className="app-title-page min-h-screen bg-[#0b0b0f] px-6 py-16 text-white sm:px-10 lg:px-16">
				<div className="app-title-empty mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
					Não foi possível carregar os detalhes do título.
				</div>
			</main>
		);
	}
}
