"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	MOOD_COLOR_MAP,
	MOOD_LABEL_KEY_MAP,
	MOOD_OPTIONS,
	type MoodValue,
} from "../../lib/moods";
import { useTranslations } from "../../i18n/client";

export type MoodTrackerDatum = {
	date: string;
	label: string;
} & Partial<Record<MoodValue, number>>;

interface MoodTrackerProps {
	data: MoodTrackerDatum[];
	totals: Record<MoodValue, number>;
}

const moodKeys = MOOD_OPTIONS.map((option) => option.value);

function MoodTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: any[];
	label?: string;
}) {
	const t = useTranslations("moods");

	if (!active || !payload || payload.length === 0) {
		return null;
	}

	return (
		<div className='rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur'>
			<p className='text-xs font-semibold uppercase tracking-wide text-white/60'>
				{label}
			</p>
			<ul className='mt-3 space-y-2'>
				{payload
					.filter((item) => item.value)
					.map((item) => (
						<li key={item.dataKey} className='flex items-center gap-3'>
							<span
								className='inline-block h-2 w-2 rounded-full'
								style={{ backgroundColor: item.color }}
							/>
							<span className='text-white/80'>
								{t(MOOD_LABEL_KEY_MAP[item.dataKey as MoodValue])}
							</span>
							<span className='ml-auto text-white'>{item.value}</span>
						</li>
					))}
			</ul>
		</div>
	);
}

export default function MoodTracker({ data, totals }: MoodTrackerProps) {
	const t = useTranslations("journal.moodTracker");
	const moodT = useTranslations("moods");
	const common = useTranslations("common");

	const totalEntries = moodKeys.reduce(
		(acc, mood) => acc + (totals[mood] ?? 0),
		0
	);

	const dominantMood =
		totalEntries === 0
			? null
			: moodKeys
					.map((key) => ({
						value: key,
						count: totals[key] ?? 0,
					}))
					.sort((a, b) => b.count - a.count)[0];

	const hasData = data.some((item) =>
		moodKeys.some((key) => Number(item[key] ?? 0) > 0)
	);

	return (
		<div className='rounded-3xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur sm:p-6'>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h2 className='text-lg font-semibold text-white'>{t("title")}</h2>
					<p className='text-sm text-white/60'>{t("subtitle")}</p>
				</div>
				<div className='rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm text-white/80'>
					<p className='text-xs uppercase tracking-wide text-white/50'>
						{t("dominant")}
					</p>
					<p className='mt-2 text-base font-semibold text-white'>
						{dominantMood && dominantMood.count > 0
							? `${moodT(MOOD_LABEL_KEY_MAP[dominantMood.value])} (${
									dominantMood.count
							  }x)`
							: common("noData")}
					</p>
				</div>
			</div>

			<div className='mt-6 space-y-3'>
				<p className='text-xs uppercase tracking-wide text-white/50'>
					{t("legend")}
				</p>
				<div className='flex flex-wrap gap-3 text-xs text-white/70'>
					{MOOD_OPTIONS.map((mood) => (
						<span
							key={mood.value}
							className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1'>
							<span
								className='h-2 w-2 rounded-full'
								style={{ backgroundColor: MOOD_COLOR_MAP[mood.value] }}
							/>
							{moodT(mood.labelKey)}
							<span className='text-white/50'>
								{(totals[mood.value] ?? 0).toString()}x
							</span>
						</span>
					))}
				</div>
			</div>

			<div className='mt-6 h-60 sm:h-64'>
				{hasData ? (
					<ResponsiveContainer width='100%' height='100%'>
						<AreaChart data={data}>
							<defs>
								{moodKeys.map((key) => (
									<linearGradient
										key={key}
										id={`color-${key}`}
										x1='0'
										y1='0'
										x2='0'
										y2='1'>
										<stop
											offset='5%'
											stopColor={MOOD_COLOR_MAP[key]}
											stopOpacity={0.6}
										/>
										<stop
											offset='95%'
											stopColor={MOOD_COLOR_MAP[key]}
											stopOpacity={0}
										/>
									</linearGradient>
								))}
							</defs>

							<CartesianGrid
								strokeDasharray='3 3'
								stroke='rgba(255,255,255,0.08)'
							/>
							<XAxis
								dataKey='label'
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#A1A1AA", fontSize: 12 }}
							/>
							<YAxis
								allowDecimals={false}
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#A1A1AA", fontSize: 12 }}
							/>
							<Tooltip content={<MoodTooltip />} />

							{moodKeys.map((key) => (
								<Area
									key={key}
									type='monotone'
									dataKey={key}
									stackId='1'
									stroke={MOOD_COLOR_MAP[key]}
									fill={`url(#color-${key})`}
									fillOpacity={1}
									strokeWidth={2}
									isAnimationActive={false}
								/>
							))}
						</AreaChart>
					</ResponsiveContainer>
				) : (
					<div className='flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-center text-sm text-white/60'>
						<p>{t("empty")}</p>
					</div>
				)}
			</div>
		</div>
	);
}
