"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

type TitleGalleryProps = {
	title: string;
	images: string[];
};

export default function TitleGallery({ title, images }: TitleGalleryProps) {
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const hasActive = activeIndex !== null;
	const nextImage = () => {
		if (activeIndex === null) {
			return;
		}
		setActiveIndex((activeIndex + 1) % images.length);
	};

	const previousImage = () => {
		if (activeIndex === null) {
			return;
		}
		setActiveIndex((activeIndex - 1 + images.length) % images.length);
	};

	useEffect(() => {
		if (!hasActive) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setActiveIndex(null);
				return;
			}

			if (event.key === "ArrowLeft") {
				event.preventDefault();
				setActiveIndex((current) => {
					if (current === null) {
						return current;
					}
					return (current - 1 + images.length) % images.length;
				});
				return;
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				setActiveIndex((current) => {
					if (current === null) {
						return current;
					}
					return (current + 1) % images.length;
				});
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [hasActive, images.length]);

	if (!images.length) {
		return null;
	}

	return (
		<div className="app-title-panel rounded-2xl border border-white/10 bg-white/5 p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">Fotos do título</p>
					<p className="mt-2 text-sm text-white/70">Clique para abrir e expandir cada foto.</p>
				</div>
				<button
					type="button"
					onClick={() => setOpen((state) => !state)}
					className="app-title-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:text-white"
				>
					<Images className="h-4 w-4" />
					{open ? "Ocultar fotos" : `Ver fotos (${images.length})`}
				</button>
			</div>

			{open && (
				<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{images.map((imageUrl, index) => (
						<button
							key={imageUrl}
							type="button"
							onClick={() => setActiveIndex(index)}
							className="app-title-row overflow-hidden rounded-xl border border-white/10 bg-black/25 transition hover:-translate-y-0.5 hover:border-rose-300/50"
						>
							<div className="relative aspect-video">
								<Image
									alt={`${title} - foto ${index + 1}`}
									src={imageUrl}
									fill
									sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 96vw"
									className="object-cover"
								/>
							</div>
						</button>
					))}
				</div>
			)}

			{hasActive && (
				<div className="fixed inset-0 z-90 flex items-center justify-center p-4">
					<button
						type="button"
						onClick={() => setActiveIndex(null)}
						className="absolute inset-0 bg-black/85"
						aria-label="Fechar visualização"
					/>
					<div className="relative z-10 w-full max-w-6xl">
						<button
							type="button"
							onClick={() => setActiveIndex(null)}
							className="absolute right-2 top-2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 transition hover:text-white"
							aria-label="Fechar"
						>
							<X className="h-5 w-5" />
						</button>

						<div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40">
							<div className="relative h-[70vh] min-h-90 w-full">
								<Image
									alt={`${title} - foto ${(activeIndex ?? 0) + 1}`}
									src={images[activeIndex ?? 0]}
									fill
									sizes="100vw"
									className="object-contain"
								/>
							</div>
						</div>

						<div className="mt-3 flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={previousImage}
								className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 transition hover:text-white"
							>
								<ChevronLeft className="h-4 w-4" />
								Anterior
							</button>
							<p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
								Foto {(activeIndex ?? 0) + 1} de {images.length}
							</p>
							<button
								type="button"
								onClick={nextImage}
								className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 transition hover:text-white"
							>
								Próxima
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
