export default function Footer() {
	return (
		<footer className="relative overflow-hidden border-t border-white/10 bg-[#090a10]">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_120%,rgba(244,63,94,0.22),transparent_45%),radial-gradient(circle_at_85%_-20%,rgba(59,130,246,0.2),transparent_40%)]" />
			<div className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-5 sm:px-10 lg:px-16">
				<p className="text-center text-sm font-semibold text-white/85 sm:text-base">
					Víctor Santucci | MovieDataX - 2026 ®
				</p>
			</div>
		</footer>
	);
}
