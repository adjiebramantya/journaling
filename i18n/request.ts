import { locales, defaultLocale, Locale } from "./routing";
import { createTranslator, Messages } from "./utils";

function normalizeLocale(locale: string): Locale {
	return locales.includes(locale as Locale)
		? (locale as Locale)
		: defaultLocale;
}

export async function getMessages(locale: string): Promise<Messages> {
	const target = normalizeLocale(locale);
	const module = await import(`../messages/${target}.json`);
	return module.default;
}

export async function getTranslator(locale: string, namespace?: string) {
	const messages = await getMessages(locale);
	return createTranslator(messages, namespace);
}

export { createTranslator } from "./utils";
export type { Messages } from "./utils";
