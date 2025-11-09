import Link from "next/link";
import { getMessages, createTranslator } from "../../i18n/request";
import { createServerClientWithCookies } from "../../lib/supabaseServer";
import { MOOD_LABEL_KEY_MAP, type MoodValue } from "../../lib/moods";

export const revalidate = 0;

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const supabase = await createServerClientWithCookies();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const messages = await getMessages(locale);
	const t = createTranslator(messages);
	const landing = createTranslator(messages, "landing");
	const features = createTranslator(messages, "landing.features");
	const statsCard = createTranslator(messages, "landing.statsCard");
	const footerPrompt = createTranslator(messages, "landing.footerPrompt");
	const cta = createTranslator(messages, "landing.cta");

	let totalEntries = 0;
	let summarizedEntries = 0;
	let topMoodKey: string | null = null;
	let latestWeeklySuggestion: string | null = null;

	if (user) {
		const moodCounts: Record<MoodValue, number> = {
			senang: 0,
			tenang: 0,
			bersemangat: 0,
			cemas: 0,
			sedih: 0,
			lelah: 0,
		};

		const { data: overviewEntries } = await supabase
			.from("journals")
			.select(
				"id, mood, created_at, journal_summaries (summary, ai_suggestion)"
			)
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.limit(30);

		if (overviewEntries) {
			totalEntries = overviewEntries.length;
			overviewEntries.forEach((entry) => {
				const mood = entry.mood as MoodValue | null;
				if (mood && mood in moodCounts) {
					moodCounts[mood] += 1;
				}

				const summaryData = Array.isArray(entry.journal_summaries)
					? entry.journal_summaries[0]
					: entry.journal_summaries;

				if (summaryData?.summary) {
					summarizedEntries += 1;
					if (!latestWeeklySuggestion && summaryData.ai_suggestion) {
						latestWeeklySuggestion = summaryData.ai_suggestion;
					}
				}
			});

			const sortedMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
			if (sortedMood[0] && sortedMood[0][1] > 0) {
				topMoodKey = sortedMood[0][0];
			}
		}

		const { data: weeklySummary } = await supabase
			.from("weekly_summaries")
			.select("summary, ai_suggestion")
			.eq("user_id", user.id)
			.order("week_start", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (weeklySummary?.ai_suggestion) {
			latestWeeklySuggestion = weeklySummary.ai_suggestion;
		} else if (weeklySummary?.summary && !latestWeeklySuggestion) {
			latestWeeklySuggestion = weeklySummary.summary;
		}
	} else {
		totalEntries = 12;
		summarizedEntries = 12;
		topMoodKey = "tenang";
		latestWeeklySuggestion = statsCard("noRecommendation");
	}

	const progressRate = totalEntries
		? Math.round((summarizedEntries / totalEntries) * 100)
		: 0;

	const topMoodDisplay = topMoodKey
		? t(MOOD_LABEL_KEY_MAP[topMoodKey as MoodValue])
		: t("common.noData");

	const weeklySuggestionDisplay =
		latestWeeklySuggestion ?? statsCard("noRecommendation");

	const localized = (path: string) => `/${locale}${path}`;

	return (
		<div className='relative min-h-screen overflow-hidden bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]' />
			<main className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-14 px-4 py-16 sm:gap-16 sm:px-6 sm:py-20 md:px-10 lg:px-16 lg:py-24'>
				<header className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
					<div className='space-y-4'>
						<span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80'>
							{landing("badge")}
						</span>
						<h1 className='text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
							{landing("title")}
						</h1>
						<p className='max-w-2xl text-base text-white/70 sm:text-lg'>
							{landing("description")}
						</p>
						<div className='flex flex-wrap gap-3'>
							{user ? (
								<>
									<Link
										href={localized("/journal")}
										className='inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200'>
										{cta("dashboard")}
									</Link>
									<Link
										href={localized("/weekly")}
										className='inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5'>
										{cta("weekly")}
									</Link>
								</>
							) : (
								<>
									<Link
										href={localized("/signup")}
										className='inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200'>
										{cta("signup")}
									</Link>
									<Link
										href={localized("/login")}
										className='inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5'>
										{cta("login")}
									</Link>
								</>
							)}
						</div>
					</div>
				</header>

				<section className='grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8 md:grid-cols-2 lg:p-10'>
					<div className='space-y-6'>
						<h2 className='text-2xl font-semibold text-white sm:text-3xl'>
							{features("title")}
						</h2>
						<ul className='space-y-4 text-sm text-white/70 sm:text-base'>
							<li className='flex items-start gap-3'>
								<span className='mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400' />
								<div>
									<p className='font-medium text-white'>
										{features("privacy.title")}
									</p>
									<p>{features("privacy.description")}</p>
								</div>
							</li>
							<li className='flex items-start gap-3'>
								<span className='mt-1 inline-block h-2 w-2 rounded-full bg-blue-400' />
								<div>
									<p className='font-medium text-white'>
										{features("summary.title")}
									</p>
									<p>{features("summary.description")}</p>
								</div>
							</li>
							<li className='flex items-start gap-3'>
								<span className='mt-1 inline-block h-2 w-2 rounded-full bg-rose-400' />
								<div>
									<p className='font-medium text-white'>
										{features("mood.title")}
									</p>
									<p>{features("mood.description")}</p>
								</div>
							</li>
							<li className='flex items-start gap-3'>
								<span className='mt-1 inline-block h-2 w-2 rounded-full bg-violet-400' />
								<div>
									<p className='font-medium text-white'>
										{features("weekly.title")}
									</p>
									<p>{features("weekly.description")}</p>
								</div>
							</li>
						</ul>
					</div>
					<div className='flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-lg sm:p-8'>
						<div className='space-y-4'>
							<h3 className='text-xl font-semibold text-white'>
								{statsCard("title")}
							</h3>
							<p className='text-sm text-white/70'>
								{statsCard("description")}
							</p>
						</div>
						<div className='grid gap-3'>
							<div className='rounded-xl border border-white/10 bg-white/5 p-4'>
								<p className='text-xs uppercase tracking-wide text-white/50'>
									{statsCard("statsTitle")}
								</p>
								<div className='mt-3 grid gap-2 text-white sm:grid-cols-3'>
									<div>
										<p className='text-3xl font-semibold'>{totalEntries}</p>
										<p className='text-xs text-white/60'>
											{statsCard("entries")}
										</p>
									</div>
									<div>
										<p className='text-3xl font-semibold'>
											{summarizedEntries}
										</p>
										<p className='text-xs text-white/60'>
											{statsCard("summaries")}
										</p>
									</div>
									<div>
										<p className='text-3xl font-semibold'>{progressRate}%</p>
										<p className='text-xs text-white/60'>
											{statsCard("progress")}
										</p>
									</div>
								</div>
							</div>
							<div className='grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4'>
								<div className='flex items-center justify-between text-xs uppercase tracking-wide text-white/50'>
									<span>{statsCard("dominantMood")}</span>
									<span>{topMoodDisplay}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-white/50'>
										{statsCard("latestRecommendation")}
									</p>
									<p className='mt-2 text-sm text-white/80'>
										{weeklySuggestionDisplay}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{!user && (
					<footer className='flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-6 py-5 text-center text-white/70 sm:flex-row sm:justify-between sm:px-8 sm:py-6 sm:text-left'>
						<div>
							<p className='text-sm font-semibold uppercase tracking-wide text-white/60'>
								{footerPrompt("title")}
							</p>
							<p className='text-base text-white/80'>
								{footerPrompt("description")}
							</p>
						</div>
						<Link
							href={localized("/signup")}
							className='inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200'>
							{footerPrompt("action")}
						</Link>
					</footer>
				)}
			</main>
		</div>
	);
}
