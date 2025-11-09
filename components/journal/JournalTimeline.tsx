"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { enUS, id as localeId } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "../../i18n/client";
import type { MoodTrackerDatum } from "./MoodTracker";
import { MOOD_LABEL_KEY_MAP, type MoodValue } from "../../lib/moods";

export type JournalEntryWithSummary = {
	id: string;
	title: string | null;
	content: string;
	mood: string | null;
	created_at: string;
	journal_summaries: {
		summary: string | null;
		ai_suggestion: string | null;
		created_at: string;
	} | null;
};

interface JournalTimelineProps {
	entries: JournalEntryWithSummary[];
	locale?: string;
}

export default function JournalTimeline({
	entries,
	locale = "id",
}: JournalTimelineProps) {
	const router = useRouter();
	const t = useTranslations("journal.timeline");
	const common = useTranslations("common");
	const moodT = useTranslations("moods");
	const currentLocale = useLocale();

	const localeMap = {
		id: localeId,
		en: enUS,
	} as const;

	const selectedLocale =
		localeMap[locale as keyof typeof localeMap] ?? localeId;

	const sortedEntries = useMemo(
		() =>
			[...entries].sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			),
		[entries]
	);

	if (sortedEntries.length === 0) {
		return (
			<div className='rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/70 backdrop-blur sm:p-10'>
				<h3 className='text-xl font-semibold text-white'>{t("emptyTitle")}</h3>
				<p className='mt-2 text-sm text-white/60'>{t("emptyDescription")}</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{sortedEntries.map((entry) => {
				const summary = entry.journal_summaries;
				const createdAt = format(
					new Date(entry.created_at),
					"EEEE, d MMMM yyyy",
					{
						locale: selectedLocale,
					}
				);

				return (
					<article
						key={entry.id}
						className='relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur sm:p-8'>
						<div className='absolute inset-y-0 left-0 w-1 bg-linear-to-b from-emerald-300 via-blue-300 to-purple-300 opacity-60' />
						<div className='pl-6'>
							<div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/50'>
								<span>{createdAt}</span>
								{entry.mood && (
									<>
										<span className='h-1 w-1 rounded-full bg-white/40' />
										{(() => {
											const moodKey = entry.mood as MoodValue | null;
											const label = moodKey
												? moodT(MOOD_LABEL_KEY_MAP[moodKey])
												: common("noData");
											return (
												<span>
													{t("moodLabel")}: {label}
												</span>
											);
										})()}
									</>
								)}
							</div>

							<h3 className='mt-3 text-2xl font-semibold text-white'>
								{entry.title || common("noData")}
							</h3>

							<p className='mt-4 whitespace-pre-wrap text-sm text-white/75'>
								{entry.content}
							</p>

							{summary ? (
								<div className='mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 md:grid-cols-2'>
									<div className='rounded-xl border border-white/10 bg-white/5 p-4'>
										<p className='text-xs font-semibold uppercase tracking-wide text-emerald-200'>
											{t("summaryTitle")}
										</p>
										<p className='mt-2 text-sm text-white/80'>
											{summary.summary}
										</p>
									</div>
									<div className='rounded-xl border border-white/10 bg-white/5 p-4'>
										<p className='text-xs font-semibold uppercase tracking-wide text-blue-200'>
											{t("suggestionTitle")}
										</p>
										<p className='mt-2 text-sm text-white/80'>
											{summary.ai_suggestion ?? common("noData")}
										</p>
									</div>
								</div>
							) : (
								<div className='mt-6 flex items-center justify-between rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/60'>
									<span>{t("missing")}</span>
									<button
										onClick={async () => {
											await fetch(`/api/journals/${entry.id}/summarize`, {
												method: "POST",
												credentials: "include",
												headers: {
													"x-locale": currentLocale,
												},
											});
											router.refresh();
										}}
										className='rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10'>
										{t("generate")}
									</button>
								</div>
							)}
						</div>
					</article>
				);
			})}
		</div>
	);
}
