"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "moviedatax-theme";

const applyTheme = (theme: ThemeMode) => {
	document.documentElement.setAttribute("data-theme", theme);
};

export default function ThemeToggle() {
	const [theme, setTheme] = useState<ThemeMode>(() => {
		if (typeof window === "undefined") {
			return "dark";
		}
		const stored = window.localStorage.getItem(STORAGE_KEY);
		return stored === "light" ? "light" : "dark";
	});

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const toggleTheme = () => {
		const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
		setTheme(nextTheme);
		applyTheme(nextTheme);
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
	};

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
			className="fixed right-3 top-3 z-70 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-rose-300/70 hover:text-rose-200 sm:right-4 sm:top-4 sm:px-4 sm:text-xs"
		>
			{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
			{theme === "dark" ? "Claro" : "Escuro"}
		</button>
	);
}
