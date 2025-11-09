import "../../app/globals.css";
import type { Metadata } from "next";
import { TranslationProvider } from "../../i18n/client";
import { getMessages, createTranslator } from "../../i18n/request";
import AppHeader from "../../components/layout/AppHeader";
import { routing, defaultLocale, Locale } from "../../i18n/routing";

export const metadata: Metadata = {
	title: "JournaIA",
	description: "AI-assisted journaling for daily reflection",
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const normalizedLocale = routing.locales.includes(locale as Locale)
		? (locale as Locale)
		: defaultLocale;

	const messagesPromise = getMessages(normalizedLocale);
	const [messages] = await Promise.all([messagesPromise]);
	const footer = createTranslator(messages, "footer");
	const year = new Date().getFullYear();

	return (
		<TranslationProvider locale={normalizedLocale} messages={messages}>
			<div className='min-h-screen bg-zinc-950 text-white'>
				<AppHeader locale={normalizedLocale} messages={messages} />
				<div className='pt-20 pb-16'>{children}</div>
				<footer className='border-t border-white/10 bg-zinc-950/80 py-6 text-sm text-white/60'>
					<div className='mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-6 text-center sm:flex-row sm:justify-between sm:text-left'>
						<span>{footer("rights", { year })}</span>
						<span className='text-white/70'>{footer("credit")}</span>
					</div>
				</footer>
			</div>
		</TranslationProvider>
	);
}
