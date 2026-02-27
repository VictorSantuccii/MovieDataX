"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, Menu, Search, Trophy, Users, X } from "lucide-react";

type MenuItem = {
	label: string;
	href: string;
	icon: ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
	{ label: "Início", href: "/", icon: Home },
	{ label: "Categorias", href: "/#categorias-destaque", icon: Clapperboard },
	{ label: "Títulos", href: "/titles", icon: Clapperboard },
	{ label: "Busca", href: "/search?q=", icon: Search },
	{ label: "Atores", href: "/people", icon: Users },
	{ label: "Premiações", href: "/awards", icon: Trophy },
];

export default function SidebarMenu() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	const resolvedItems = useMemo(
		() =>
			menuItems.map((item) => ({
				...item,
				active:
					item.href === "/"
						? pathname === "/"
						: item.href.startsWith("/#")
							? pathname === "/"
							: pathname.startsWith(item.href.split("?")[0]),
			})),
		[pathname]
	);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Abrir menu"
				className="app-floating-button fixed left-3 top-3 z-70 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-rose-300/70 hover:text-rose-200 sm:left-4 sm:top-4 sm:px-4 sm:text-xs"
			>
				<Menu className="h-4 w-4" />
				Menu
			</button>

			{open && (
				<div className="fixed inset-0 z-80">
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="app-sidebar-overlay absolute inset-0 bg-black/70 backdrop-blur-[1px]"
						aria-label="Fechar menu"
					/>

					<aside className="app-sidebar-panel absolute left-0 top-0 h-full w-[88vw] max-w-sm border-r border-white/10 bg-[#0b0d14] p-5 shadow-2xl shadow-black/60">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">Navegação</p>
								<h2 className="mt-2 text-2xl font-semibold text-white">MovieDataX</h2>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:text-white"
								aria-label="Fechar menu"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<nav className="space-y-2">
							{resolvedItems.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.href + item.label}
										href={item.href}
										onClick={() => setOpen(false)}
										className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
											item.active
												? "app-nav-active border border-rose-300/40 bg-rose-500/20 text-rose-100"
												: "border border-white/10 bg-white/5 text-white/75 hover:text-white"
										}`}
									>
										<Icon className="h-4 w-4" />
										{item.label}
									</Link>
								);
							})}
						</nav>
					</aside>
				</div>
			)}
		</>
	);
}
