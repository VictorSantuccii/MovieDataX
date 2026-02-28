"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type TitleKeyboardNavProps = {
	previousHref?: string;
	nextHref?: string;
};

export default function TitleKeyboardNav({ previousHref, nextHref }: TitleKeyboardNavProps) {
	const router = useRouter();

	useEffect(() => {
		const isTypingElement = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) {
				return false;
			}
			const tag = target.tagName.toLowerCase();
			return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (isTypingElement(event.target)) {
				return;
			}

			if (event.key === "ArrowLeft" && previousHref) {
				event.preventDefault();
				router.push(previousHref);
				return;
			}

			if (event.key === "ArrowRight" && nextHref) {
				event.preventDefault();
				router.push(nextHref);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [nextHref, previousHref, router]);

	return null;
}
