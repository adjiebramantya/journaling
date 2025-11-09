export const MOOD_OPTIONS = [
	{ value: "senang", labelKey: "happy", color: "#FACC15" },
	{ value: "tenang", labelKey: "calm", color: "#38BDF8" },
	{ value: "bersemangat", labelKey: "energized", color: "#FB7185" },
	{ value: "cemas", labelKey: "anxious", color: "#F97316" },
	{ value: "sedih", labelKey: "sad", color: "#6366F1" },
	{ value: "lelah", labelKey: "tired", color: "#A855F7" },
] as const;

export type MoodValue = (typeof MOOD_OPTIONS)[number]["value"];

export const MOOD_LABEL_KEY_MAP: Record<MoodValue, string> =
	MOOD_OPTIONS.reduce((acc, mood) => {
		acc[mood.value] = mood.labelKey;
		return acc;
	}, {} as Record<MoodValue, string>);

export const MOOD_COLOR_MAP: Record<MoodValue, string> = MOOD_OPTIONS.reduce(
	(acc, mood) => {
		acc[mood.value] = mood.color;
		return acc;
	},
	{} as Record<MoodValue, string>
);
