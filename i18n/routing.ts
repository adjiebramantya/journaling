export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export const routing = {
	locales: [...locales],
	defaultLocale,
};
