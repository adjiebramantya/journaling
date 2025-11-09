import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { id as localeId, enUS } from "date-fns/locale";
import { getMessages, createTranslator } from "../../../i18n/request";
import { createServerClientWithCookies } from "../../../lib/supabaseServer";
import NewJournalForm from "../../../components/journal/NewJournalForm";
import JournalTimeline, {
	JournalEntryWithSummary,
} from "../../../components/journal/JournalTimeline";
import MoodTracker, {
	MoodTrackerDatum,
} from "../../../components/journal/MoodTracker";
import DeleteAccountButton from "../../../components/account/DeleteAccountButton";
import { MOOD_OPTIONS, type MoodValue } from "../../../lib/moods";

export const revalidate = 0;

export default async function JournalPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const supabase = await createServerClientWithCookies();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(`/${locale}/login?redirectTo=/journal`);
	}

	const { data: entries, error } = await supabase
		.from("journals")
		.select(
			"id, title, content, mood, created_at, journal_summaries (summary, ai_suggestion, created_at)"
		)
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	const timelineEntries: JournalEntryWithSummary[] = (entries ?? []).map(
		(entry) => {
			const summaryData = Array.isArray(entry.journal_summaries)
				? entry.journal_summaries[0] ?? null
				: entry.journal_summaries ?? null;

			return {
				id: entry.id,
				title: entry.title,
				content: entry.content,
				mood: entry.mood,
				created_at: entry.created_at,
				journal_summaries: summaryData
					? {
							summary: summaryData.summary,
							ai_suggestion: summaryData.ai_suggestion,
							created_at: summaryData.created_at,
					  }
					: null,
			};
		}
	);

	const localeMap = {
		id: localeId,
		en: enUS,
	} as const;

	const selectedLocale =
		localeMap[locale as keyof typeof localeMap] ?? localeId;

	const moodKeys = MOOD_OPTIONS.map((mood) => mood.value);

	const moodTotals = moodKeys.reduce<Record<MoodValue, number>>((acc, mood) => {
		acc[mood] = 0;
		return acc;
	}, {} as Record<MoodValue, number>);

	timelineEntries.forEach((entry) => {
		const mood = entry.mood as MoodValue | null;
		if (!mood || !(mood in moodTotals)) return;
		moodTotals[mood] += 1;
	});

	const today = new Date();
	const oldestEntryIso = timelineEntries.at(-1)?.created_at;
	const oldestEntryDate = oldestEntryIso ? parseISO(oldestEntryIso) : today;
	const startWindow = subDays(today, 13);
	const chartStart =
		oldestEntryDate < startWindow ? startWindow : oldestEntryDate;

	const days = eachDayOfInterval({
		start: chartStart,
		end: today,
	});

	const dayIndexMap = new Map<string, number>();
	const moodChartData = days.map((day, index) => {
		const key = format(day, "yyyy-MM-dd");
		dayIndexMap.set(key, index);

		const datum: MoodTrackerDatum = {
			date: key,
			label: format(day, "d MMM", { locale: selectedLocale }),
		};

		moodKeys.forEach((mood) => {
			datum[mood] = 0;
		});

		return datum;
	});

	timelineEntries.forEach((entry) => {
		const mood = entry.mood as MoodValue | null;
		if (!mood) return;
		const createdDate = entry.created_at
			? format(parseISO(entry.created_at), "yyyy-MM-dd")
			: "";
		const index = dayIndexMap.get(createdDate);
		if (index === undefined) return;
		const currentValue = moodChartData[index][mood] ?? 0;
		moodChartData[index][mood] = currentValue + 1;
	});

	const messages = await getMessages(locale);
	const t = createTranslator(messages);
	const deleteAccount = createTranslator(messages, "account.delete");
	const localized = (path: string) => `/${locale}${path}`;

	return (
		<div className='relative min-h-screen overflow-hidden bg-linear-to-br from-zinc-950 via-slate-900 to-black text-white'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]' />
			<div className='absolute right-16 top-24 hidden h-48 w-48 rounded-full bg-purple-400/30 blur-[140px] lg:block' />
			<main className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20'>
				<header className='space-y-4'>
					<span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-white/70'>
						{t("journal.badge")}
					</span>
					<h1 className='text-3xl font-semibold sm:text-5xl'>
						{t("journal.title")}
					</h1>
					<p className='max-w-2xl text-base text-white/70 sm:text-lg'>
						{t("journal.description")}
					</p>
				</header>

				<section className='grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]'>
					<NewJournalForm />
					<div className='flex flex-col gap-4'>
						<div className='rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6'>
							<h2 className='text-lg font-semibold text-white'>
								{t("journal.stats.title")}
							</h2>
							<p className='mt-2 text-sm text-white/60'>
								{t("journal.stats.description")}
							</p>
							<div className='mt-6 grid gap-4'>
								<div className='rounded-2xl border border-white/10 bg-black/30 p-4'>
									<p className='text-xs uppercase tracking-wide text-white/50'>
										{t("journal.stats.entries")}
									</p>
									<p className='mt-2 text-3xl font-semibold text-white'>
										{timelineEntries.length}
									</p>
								</div>
								<div className='rounded-2xl border border-white/10 bg-black/30 p-4'>
									<p className='text-xs uppercase tracking-wide text-white/50'>
										{t("journal.stats.summaries")}
									</p>
									<p className='mt-2 text-3xl font-semibold text-white'>
										{
											timelineEntries.filter(
												(entry) => entry.journal_summaries?.summary
											).length
										}
									</p>
									<p className='mt-1 text-xs text-white/50'>
										{t("journal.stats.note")}
									</p>
								</div>
								<div className='rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-4 text-white'>
									<p className='text-xs uppercase tracking-wide text-emerald-100'>
										{t("journal.stats.weeklyTitle")}
									</p>
									<p className='mt-2 text-sm text-emerald-50'>
										{t("journal.stats.weeklyDescription")}
									</p>
									<Link
										href={localized("/weekly")}
										className='mt-4 inline-flex items-center justify-center rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-200'>
										{t("journal.stats.weeklyButton")}
									</Link>
								</div>
							</div>
						</div>
						<MoodTracker data={moodChartData} totals={moodTotals} />
					</div>
				</section>

				<section className='pb-16'>
					<div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h2 className='text-2xl font-semibold text-white'>
								{t("journal.timeline.title")}
							</h2>
							<p className='text-sm text-white/60'>
								{t("journal.timeline.description")}
							</p>
						</div>
					</div>
					<JournalTimeline entries={timelineEntries} locale={locale} />
				</section>

				<section className='pb-20'>
					<div className='rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-white backdrop-blur sm:p-8'>
						<div className='space-y-3'>
							<h2 className='text-lg font-semibold text-red-100'>
								{deleteAccount("cardTitle")}
							</h2>
							<p className='text-sm text-red-100/80'>
								{deleteAccount("cardDescription")}
							</p>
						</div>
						<div className='mt-5'>
							<DeleteAccountButton />
						</div>
					</div>
				</section>

				{error && (
					<p className='rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
						{t("weekly.errors.load", { message: error.message })}
					</p>
				)}
			</main>
		</div>
	);
}
