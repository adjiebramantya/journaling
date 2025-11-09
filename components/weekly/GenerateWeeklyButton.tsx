"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "../../i18n/client";

export default function GenerateWeeklyButton() {
	const t = useTranslations("weekly.generate");
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleGenerate = async () => {
		setError(null);
		setLoading(true);

		const response = await fetch("/api/weekly/generate", {
			method: "POST",
			credentials: "include",
			headers: {
				"x-locale": locale,
			},
		});

		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			setError(payload?.error ?? t("error"));
			setLoading(false);
			return;
		}

		startTransition(() => {
			const weeklyPath = `/${locale}/weekly`;
			if (pathname === weeklyPath) {
				router.refresh();
			} else {
				router.push(weeklyPath);
			}
		});
		setLoading(false);
	};

	return (
		<div className='flex flex-col items-start gap-2'>
			<button
				onClick={handleGenerate}
				disabled={loading || isPending}
				className='inline-flex w-full items-center justify-center rounded-full bg-indigo-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'>
				{loading || isPending ? t("loading") : t("button")}
			</button>
			{error && (
				<span className='text-xs font-medium text-red-300'>{error}</span>
			)}
		</div>
	);
}
