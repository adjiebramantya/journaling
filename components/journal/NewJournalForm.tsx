"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabaseClient";
import { MOOD_OPTIONS, type MoodValue } from "../../lib/moods";
import { useTranslations, useLocale } from "../../i18n/client";

export default function NewJournalForm() {
	const t = useTranslations("journal.form");
	const moodT = useTranslations("moods");
	const router = useRouter();
	const supabase = useMemo(() => createClient(), []);
	const locale = useLocale();

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [mood, setMood] = useState<MoodValue | null>(null);
	const [loading, setLoading] = useState(false);
	const [summarizing, setSummarizing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser();

		if (!content.trim()) {
			setError(t("errors.noContent"));
			return;
		}

		if (sessionError || !user) {
			setError(t("errors.noSession"));
			return;
		}

		setError(null);
		setInfo(null);
		setLoading(true);

		const { data, error: insertError } = await supabase
			.from("journals")
			.insert({
				title: title.trim() || null,
				content: content.trim(),
				mood: mood ?? null,
				user_id: user.id,
			})
			.select("id")
			.single();

		if (insertError || !data?.id) {
			setError(insertError?.message ?? t("errors.save"));
			setLoading(false);
			return;
		}

		setLoading(false);
		setSummarizing(true);

		try {
			const response = await fetch(`/api/journals/${data.id}/summarize`, {
				method: "POST",
				credentials: "include",
				headers: {
					"x-locale": locale,
				},
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				throw new Error(payload?.error ?? t("errors.summary"));
			}

			setInfo(t("info.success"));
		} catch (summarizeError: unknown) {
			const message =
				summarizeError instanceof Error
					? summarizeError.message
					: t("errors.summary");
			setError(message);
		} finally {
			setSummarizing(false);
			setTitle("");
			setContent("");
			setMood(null);
			router.refresh();
		}
	};

	return (
		<div className='rounded-3xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur sm:p-6'>
			<div className='mb-6 space-y-2'>
				<h2 className='text-2xl font-semibold'>{t("title")}</h2>
				<p className='text-sm text-white/60'>{t("subtitle")}</p>
			</div>

			<form onSubmit={handleSubmit} className='grid gap-6'>
				<label className='grid gap-2 text-sm text-white/70'>
					{t("titleLabel")}
					<input
						type='text'
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder={t("titlePlaceholder")}
						className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-300/40'
					/>
				</label>

				<div className='grid gap-3'>
					<span className='text-sm text-white/70'>{t("moodLabel")}</span>
					<div className='flex flex-wrap gap-2'>
						{MOOD_OPTIONS.map((option) => {
							const selected = mood === option.value;
							return (
								<button
									key={option.value}
									type='button'
									onClick={() =>
										setMood((prev) =>
											prev === option.value ? null : option.value
										)
									}
									className={`rounded-full border px-3 py-1.5 text-sm transition ${
										selected
											? "border-emerald-300 bg-emerald-300 text-zinc-900"
											: "border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10"
									}`}>
									{moodT(option.labelKey)}
								</button>
							);
						})}
					</div>
				</div>

				<label className='grid gap-2 text-sm text-white/70'>
					{t("contentLabel")}
					<textarea
						value={content}
						onChange={(event) => setContent(event.target.value)}
						rows={8}
						placeholder={t("contentPlaceholder")}
						className='resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-300/40'
					/>
				</label>

				{error && (
					<p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>
						{error}
					</p>
				)}
				{info && (
					<p className='rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100'>
						{info}
					</p>
				)}

				<div className='flex flex-wrap items-center gap-3'>
					<button
						type='submit'
						disabled={loading || summarizing}
						className='inline-flex items-center justify-center rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60'>
						{loading
							? t("saving")
							: summarizing
							? t("summarizing")
							: t("submit")}
					</button>
					<span className='text-xs text-white/50'>{t("hint")}</span>
				</div>
			</form>
		</div>
	);
}
