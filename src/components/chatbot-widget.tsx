"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, X } from "lucide-react";

type Recommendation = {
	id?: number;
	media_type: "movie" | "tv";
	title: string;
	reason: string;
	release_date?: string;
	first_air_date?: string;
	vote_average?: number;
	source?: "tmdb-context" | "ai-expanded";
};

type ChatResponse = {
	reply: string;
	recommendations: Recommendation[];
};

type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	recommendations?: Recommendation[];
};

const WIDGET_HISTORY_KEY = "moviedatax-axel-widget-history";
const WIDGET_SUGGESTION_CHIPS = [
	"Filme curto e bom",
	"Série de suspense",
	"Comédia leve",
	"Algo parecido com Duna",
	"Top filmes 2024",
];

export default function ChatbotWidget() {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [input, setInput] = useState("");
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "init",
			role: "assistant",
			content:
				"Olá! Eu sou Axel 🎬, o chatbot cinéfilo. Posso indicar filmes e séries com base no seu gosto.",
		},
	]);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(WIDGET_HISTORY_KEY);
			if (!stored) {
				return;
			}
			const parsed = JSON.parse(stored) as Message[];
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
			window.localStorage.setItem(WIDGET_HISTORY_KEY, JSON.stringify(messages));
		} catch {
			// Ignore storage errors.
		}
	}, [messages]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const container = messagesContainerRef.current;
		if (!container) {
			return;
		}
		container.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});
	}, [messages, open]);

	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading) {
			return;
		}

		const userMessage: Message = {
			id: `u-${Date.now()}`,
			role: "user",
			content: text,
		};

		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);
		setInput("");
		setLoading(true);

		try {
			const response = await fetch("/api/imdb/chatbot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: text,
					history: nextMessages.map((message) => ({
						role: message.role,
						content: message.content,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error("Falha na resposta do assistente");
			}

			const data = (await response.json()) as ChatResponse;
			setMessages((previous) => [
				...previous,
				{
					id: `a-${Date.now()}`,
					role: "assistant",
					content: data.reply,
					recommendations: data.recommendations,
				},
			]);
		} catch {
			setMessages((previous) => [
				...previous,
				{
					id: `e-${Date.now()}`,
					role: "assistant",
					content: "Não consegui responder agora. Tente novamente em instantes.",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen((state) => !state)}
				aria-label="Abrir Axel"
				className="app-floating-button fixed bottom-4 right-4 z-80 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-rose-300/70 hover:text-rose-200 sm:h-13 sm:w-13"
			>
				{open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
			</button>

			{open && (
				<div className="fixed bottom-20 left-2 right-2 z-90 max-h-[78vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] shadow-2xl shadow-black/60 sm:left-auto sm:right-4 sm:w-[min(92vw,380px)] sm:max-h-none">
					<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-200">Axel 🎬</p>
							<p className="text-sm font-semibold text-white">Axel • Indicações rápidas</p>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:text-white"
							aria-label="Fechar Axel"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div ref={messagesContainerRef} className="app-chat-scrollbar max-h-[52vh] space-y-3 overflow-y-auto px-4 py-3 sm:max-h-80">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`rounded-2xl border px-3 py-2 ${
									message.role === "assistant"
										? "border-white/10 bg-white/5"
										: "border-rose-300/40 bg-rose-500/15"
								}`}
							>
								<p className="text-sm text-white/85">{message.content}</p>
								{message.recommendations && message.recommendations.length > 0 && (
									<div className="mt-2 space-y-2">
										{message.recommendations.slice(0, 3).map((recommendation) => {
											const year = recommendation.release_date?.slice(0, 4) ?? recommendation.first_air_date?.slice(0, 4) ?? "-";
											return (
												<div
													key={`${message.id}-${recommendation.media_type}-${recommendation.id}`}
													className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
												>
													<p className="text-xs font-semibold text-white">{recommendation.title}</p>
													<p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
														{recommendation.media_type === "movie" ? "Filme" : "Série"} • {year}
													</p>
													{recommendation.id ? (
														<Link
															href={`/title/${recommendation.media_type}/${recommendation.id}?type=${recommendation.media_type}&page=1`}
															className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:text-rose-100"
														>
															Abrir título
														</Link>
													) : (
														<p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
															Sugestão expandida IA
														</p>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						))}
					</div>

					<div className="border-t border-white/10 p-3">
						<div className="mb-3 hidden flex-wrap gap-2 sm:flex">
							{WIDGET_SUGGESTION_CHIPS.map((chip) => (
								<button
									key={chip}
									type="button"
									onClick={() => setInput(chip)}
									className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/75 transition hover:border-rose-300/60 hover:text-white"
								>
									{chip}
								</button>
							))}
						</div>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										void sendMessage();
									}
								}}
								placeholder="Peça uma indicação..."
								className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none"
							/>
							<button
								type="button"
								onClick={() => void sendMessage()}
								disabled={loading || input.trim().length === 0}
								className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Enviar mensagem"
							>
								{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
