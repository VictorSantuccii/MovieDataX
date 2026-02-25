"use client";

import { motion, type Variants } from "framer-motion";
import {
	Clapperboard,
	Film,
	Flame,
	ListVideo,
	Popcorn,
	Search,
	Sparkles,
	Star,
	Ticket,
	TrendingUp,
} from "lucide-react";

const heroStats = [
	{ label: "Filmes indexados", value: "180k+", icon: Film },
	{ label: "Listas criadas", value: "42k", icon: ListVideo },
	{ label: "Notas da comunidade", value: "9.4", icon: Star },
];

const highlights = [
	{
		title: "Radar inteligente",
		description:
			"Descubra tendencias e joias escondidas com recomendacoes que aprendem com seu gosto.",
		icon: Sparkles,
	},
	{
		title: "Dados em tempo real",
		description:
			"Painel vivo com notas, bilheteria e audiencia em uma unica tela elegante.",
		icon: TrendingUp,
	},
	{
		title: "Colecoes pessoais",
		description:
			"Organize maratonas, listas e playlists de filmes para cada momento.",
		icon: Ticket,
	},
];

const trending = [
	{
		title: "Orbitas do Amanhecer",
		tag: "Sci-fi",
		rating: "8.7",
		glow: "from-amber-200/30 via-orange-200/10 to-transparent",
	},
	{
		title: "Vermelho Neon",
		tag: "Thriller",
		rating: "9.1",
		glow: "from-rose-200/30 via-fuchsia-200/10 to-transparent",
	},
	{
		title: "Atlantis 2099",
		tag: "Aventura",
		rating: "8.9",
		glow: "from-cyan-200/30 via-sky-200/10 to-transparent",
	},
];

const container: Variants = {
	hidden: { opacity: 0, y: 18 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.12 },
	},
};

const item: Variants = {
	hidden: { opacity: 0, y: 16 },
	show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_45%),radial-gradient(circle_at_top_right,#dbeafe,transparent_50%),radial-gradient(circle_at_30%_60%,#fde68a,transparent_45%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_40%,#fef2f2_100%)] text-slate-900">
			<motion.section
				className="relative overflow-hidden px-6 pb-20 pt-20 sm:px-10 lg:px-16"
				variants={container}
				initial="hidden"
				animate="show"
			>
				<div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
				<div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
				<div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />

				<motion.div className="relative mx-auto max-w-6xl" variants={item}>
					<div className="flex flex-col gap-6">
						<span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 shadow-sm">
							<Flame className="h-4 w-4" />
							Central premium de cinema
						</span>
						<h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
							MovieDataX, a central que transforma dados em escolhas certeiras.
						</h1>
						<p className="max-w-2xl text-base text-slate-600 sm:text-lg">
							Explore filmes, trilhas, bilheterias e avaliacoes em um painel vivo e elegante.
							Tudo com curadoria inteligente, filtros precisos e uma experiencia cinematografica.
						</p>
					</div>

					<motion.div
						className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
						variants={item}
					>
						<div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-lg shadow-amber-200/40 backdrop-blur">
							<Search className="h-5 w-5 text-amber-500" />
							<input
								className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
								placeholder="Busque por filme, diretor, genero..."
								type="text"
							/>
							<span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
								Enter
							</span>
						</div>
						<button className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800">
							<Popcorn className="h-4 w-4" />
							Criar lista
						</button>
					</motion.div>
				</motion.div>

				<motion.div
					className="relative mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
					variants={container}
				>
					{heroStats.map(({ label, value, icon: Icon }) => (
						<motion.div
							key={label}
							className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/60 p-6 shadow-xl shadow-amber-100/60 backdrop-blur"
							variants={item}
						>
							<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
								<Icon className="h-5 w-5" />
							</span>
							<div>
								<p className="text-2xl font-semibold text-slate-900">{value}</p>
								<p className="text-sm text-slate-500">{label}</p>
							</div>
						</motion.div>
					))}
				</motion.div>
			</motion.section>

			<section className="relative px-6 pb-24 sm:px-10 lg:px-16">
				<div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
					<motion.div
						className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-2xl shadow-rose-100/60 backdrop-blur"
						variants={container}
						initial="hidden"
						whileInView="show"
						viewport={{ once: true, amount: 0.2 }}
					>
						<motion.div className="flex items-center gap-3" variants={item}>
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-500">
								<Clapperboard className="h-5 w-5" />
							</span>
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">
								Destaques
							</p>
						</motion.div>
						<motion.h2
							className="mt-4 text-3xl font-semibold text-slate-900"
							variants={item}
						>
							Uma visao completa do cinema, do hype ao catalogo escondido.
						</motion.h2>
						<motion.p className="mt-4 text-sm text-slate-600" variants={item}>
							Acompanhe tendencias globais, novos lancamentos e colecoes tematicas com um
							painel que mistura dados e estetica. Tudo para voce decidir o que assistir
							em segundos.
						</motion.p>

						<div className="mt-8 grid gap-5">
							{highlights.map(({ title, description, icon: Icon }) => (
								<motion.div
									key={title}
									className="flex gap-4 rounded-2xl border border-white/60 bg-white/80 p-4"
									variants={item}
								>
									<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
										<Icon className="h-5 w-5" />
									</span>
									<div>
										<h3 className="text-base font-semibold text-slate-900">{title}</h3>
										<p className="text-sm text-slate-600">{description}</p>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>

					<motion.div
						className="flex flex-col gap-6"
						variants={container}
						initial="hidden"
						whileInView="show"
						viewport={{ once: true, amount: 0.2 }}
					>
						<motion.div
							className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-2xl shadow-sky-100/50 backdrop-blur"
							variants={item}
						>
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">
									Radar ao vivo
								</p>
								<Sparkles className="h-5 w-5 text-sky-500" />
							</div>
							<div className="mt-6 space-y-4">
								{trending.map((movie) => (
									<div
										key={movie.title}
										className={`rounded-2xl border border-white/70 bg-linear-to-r ${movie.glow} px-4 py-3`}
									>
										<div className="flex items-center justify-between">
											<div>
												<p className="text-base font-semibold text-slate-900">
													{movie.title}
												</p>
												<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
													{movie.tag}
												</p>
											</div>
											<span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
												<Star className="h-3 w-3" />
												{movie.rating}
											</span>
										</div>
									</div>
								))}
							</div>
						</motion.div>

						<motion.div
							className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-2xl shadow-amber-100/60 backdrop-blur"
							variants={item}
						>
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
									Jornada rapida
								</p>
								<Film className="h-5 w-5 text-amber-500" />
							</div>
							<div className="mt-6 space-y-4">
								{[
									"Descubra o mood da semana",
									"Compare notas, streams e bilheteria",
									"Crie sua maratona com um clique",
								].map((step, index) => (
									<div key={step} className="flex items-center gap-3">
										<span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
											0{index + 1}
										</span>
										<p className="text-sm text-slate-600">{step}</p>
									</div>
								))}
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>
		</main>
	);
}
