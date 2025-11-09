import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, Locale } from "./i18n/routing";

function getLocaleFromPath(pathname: string): Locale | null {
	const segments = pathname.split("/").filter(Boolean);
	const potential = segments[0];
	if (potential && locales.includes(potential as Locale)) {
		return potential as Locale;
	}
	return null;
}

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.startsWith("/assets") ||
		pathname.match(/\.[^/]+$/)
	) {
		return NextResponse.next();
	}

	const locale = getLocaleFromPath(pathname);

	if (!locale) {
		const segments = pathname.split("/").filter(Boolean);
		if (segments.length > 0) {
			segments.shift();
		}
		const url = req.nextUrl.clone();
		const restPath = segments.join("/");
		url.pathname = restPath
			? `/${defaultLocale}/${restPath}`
			: `/${defaultLocale}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
