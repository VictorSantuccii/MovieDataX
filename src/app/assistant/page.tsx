"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bot, Clapperboard, Send, Sparkles, Tv } from "lucide-react";

type ChatRole = "user" | "assistant";

type Recommendation = {
	id?: number;
	media_type: "movie" | "tv";
	title: string;
	reason: string;
	overview?: string;
	poster_path?: string;
	release_date?: string;
	first_air_date?: string;
	vote_average?: number;
	vote_count?: number;
	popularity?: number;
	source?: "tmdb-context" | "ai-expanded";
};

type ChatMessage = {
	id: string;
	role: ChatRole;
	content: string;
	recommendations?: Recommendation[];
};

type ChatbotResponse = {
	reply: string;
	recommendations: Recommendation[];
};

const imageBase = "https://image.tmdb.org/t/p";
const ASSISTANT_HISTORY_KEY = "moviedatax-axel-assistant-history";

const initialMessages: ChatMessage[] = [
	{
		id: "m0",
		role: "assistant",
		content:
			"Eu sou Axel 🎬, o chatbot cinéfilo do MovieDataX. Me diga seu gosto (gênero, clima, duração, ano) e eu sugiro filmes e séries com recomendações inteligentes.",
	},
];

export default function AssistantPage() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const canSend = input.trim().length > 0 && !loading;

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(ASSISTANT_HISTORY_KEY);
			if (!stored) {
				return;
			}
			const parsed = JSON.parse(stored) as ChatMessage[];
			if (!Array.isArray(parsed) || parsed.length === 0) {
				return;
			}
			setMessages(parsed);
		} catch {
			// Ignore invalid local history.
		}
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(messages));
		} catch {
			// Ignore storage errors.
		}
	}, [messages]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, loading]);

	const suggestionChips = useMemo(
		() => [
			"Quero um filme de ficção científica com nota alta",
			"Indique séries curtas e inteligentes",
			"Quero algo parecido com thriller psicológico",
			"Recomende filmes recentes e populares",
		],
		[]
	);

	const handleSend = async (event?: FormEvent) => {
		event?.preventDefault();
		const userText = input.trim();
		if (!userText || loading) {
			return;
		}

		setError(null);
		setLoading(true);
		setInput("");

		const userMessage: ChatMessage = {
			id: `u-${Date.now()}`,
			role: "user",
			content: userText,
		};

		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);

		try {
			const response = await fetch("/api/imdb/chatbot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: userText,
					history: nextMessages.map((message) => ({
						role: message.role,
						content: message.content,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error("Falha ao obter recomendações");
			}

			const data = (await response.json()) as ChatbotResponse;
			setMessages((previous) => [
				...previous,
				{
					id: `a-${Date.now()}`,
					role: "assistant",
					content: data.reply,
					recommendations: data.recommendations ?? [],
				},
			]);
		} catch {
			setError("Não consegui gerar recomendações agora. Tente novamente em instantes.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-[#0b0b0f] text-white">
			<section className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-16">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b1a1a,transparent_55%),radial-gradient(circle_at_20%_30%,#2b1f0a,transparent_55%),radial-gradient(circle_at_80%_10%,#11202f,transparent_45%),linear-gradient(180deg,#0b0b0f_0%,#0f111a_40%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-20 h-40 bg-linear-to-r from-rose-600/25 via-red-500/15 to-amber-400/10 blur-3xl" />

				<div className="relative mx-auto max-w-6xl">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
						<Bot className="h-4 w-4" />
						Axel • Chatbot cinéfilo
					</div>
					<h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">Axel: recomendações inteligentes de filmes e séries</h1>
					<p className="mt-3 max-w-3xl text-sm text-white/65 sm:text-base">
						Converse com a IA para receber indicações personalizadas com base em dados recentes do TMDB. Este assistente recomenda apenas conteúdo de cinema e TV.
					</p>
				</div>
			</section>

			<section className="px-6 pb-20 sm:px-10 lg:px-16">
				<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
						<div className="space-y-4">
							{messages.map((message) => (
								<div key={message.id} className={`rounded-2xl border px-4 py-3 ${message.role === "assistant" ? "border-white/10 bg-white/5" : "border-rose-300/40 bg-rose-500/15"}`}>
									<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">
										{message.role === "assistant" ? "Axel 🎬" : "Você"}
									</p>
									<p className="mt-2 text-sm leading-relaxed text-white/85">{message.content}</p>

									{message.recommendations && message.recommendations.length > 0 && (
										<div className="mt-4 grid gap-3 sm:grid-cols-2">
											{message.recommendations.map((recommendation) => {
												const poster = recommendation.poster_path
													? `${imageBase}/w500${recommendation.poster_path}`
													: "/placeholders/title-fallback.svg";
												const year = recommendation.release_date?.slice(0, 4) ?? recommendation.first_air_date?.slice(0, 4) ?? "-";
												return (
														<div
														key={`${message.id}-${recommendation.media_type}-${recommendation.id}`}
															className="rounded-2xl border border-white/10 bg-white/5 p-3"
													>
														<div className="flex gap-3">
															<div className="relative h-28 w-20 overflow-hidden rounded-xl bg-white/10">
																<Image alt={recommendation.title} src={poster} fill sizes="80px" className="object-cover" />
															</div>
															<div className="flex-1">
																<p className="text-sm font-semibold text-white">{recommendation.title}</p>
																<p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{recommendation.media_type === "movie" ? "Filme" : "Série"} • {year}</p>
																<p className="mt-2 text-xs text-white/70 line-clamp-2">{recommendation.reason}</p>
																{recommendation.id ? (
																	<Link
																		href={`/title/${recommendation.media_type}/${recommendation.id}?type=${recommendation.media_type}&page=1`}
																		className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-200 transition hover:text-rose-100"
																	>
																		Ver detalhes <ArrowUpRight className="h-3 w-3" />
																	</Link>
																) : (
																	<p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
																		Sugestão expandida da IA
																	</p>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>

						{error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

						<form onSubmit={handleSend} className="mt-6 flex flex-col gap-2 sm:flex-row">
							<input
								type="text"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder="Ex: Quero uma série de suspense com alta nota e poucos episódios"
								className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus:outline-none"
							/>
							<button
								type="submit"
								disabled={!canSend}
								className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
							>
								<Send className="h-4 w-4" />
								{loading ? "Enviando" : "Enviar"}
							</button>
						</form>
					</div>

					<div className="space-y-4">
						<div className="hidden rounded-3xl border border-white/10 bg-white/5 p-5 sm:block">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200">Perguntas rápidas</p>
							<div className="mt-4 flex flex-wrap gap-2">
								{suggestionChips.map((chip) => (
									<button
										key={chip}
										type="button"
										onClick={() => setInput(chip)}
										className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/75 transition hover:border-rose-300/60 hover:text-white"
									>
										{chip}
									</button>
								))}
							</div>
						</div>

						<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200">Escopo da IA</p>
							<ul className="mt-3 space-y-2 text-sm text-white/75">
								<li className="flex items-start gap-2"><Clapperboard className="mt-0.5 h-4 w-4 text-rose-200" />Recomenda apenas filmes e séries/TV.</li>
								<li className="flex items-start gap-2"><Tv className="mt-0.5 h-4 w-4 text-rose-200" />Usa contexto com dados recentes do TMDB.</li>
								<li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-rose-200" />Explica rapidamente o motivo de cada indicação.</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
