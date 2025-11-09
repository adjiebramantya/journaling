import Link from "next/link";
import { createServerClientWithCookies } from "../../lib/supabaseServer";
import SignOutButton from "../auth/SignOutButton";
import NavLinks from "./NavLinks";
import LocaleSwitcher from "./LocaleSwitcher";
import { Messages, createTranslator } from "../../i18n/request";

interface AppHeaderProps {
	locale: string;
	messages: Messages;
}

export default async function AppHeader({ locale, messages }: AppHeaderProps) {
	const supabase = await createServerClientWithCookies();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const tNav = createTranslator(messages, "nav");

	const links = [
		{ href: `/${locale}`, label: tNav("home") },
		{ href: `/${locale}/journal`, label: tNav("journal") },
		{ href: `/${locale}/weekly`, label: tNav("weekly") },
	];

	return (
		<header className='fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-zinc-950/70 backdrop-blur'>
			<div className='mx-auto w-full max-w-6xl px-4 py-4 sm:px-8 lg:px-10'>
				<div className='flex items-center justify-between gap-3 sm:gap-4'>
					<Link
						href={`/${locale}`}
						className='text-sm font-semibold uppercase tracking-[0.35em] text-white/80'>
						JournaIA
					</Link>

					<div className='flex items-center gap-2 sm:gap-4'>
						<div className='hidden items-center gap-3 sm:flex'>
							<NavLinks links={links} />
						</div>
						<LocaleSwitcher />
						{user ? (
							<>
								<div className='hidden sm:block'>
									<SignOutButton />
								</div>
								<div className='sm:hidden'>
									<SignOutButton variant='compact' />
								</div>
							</>
						) : (
							<>
								<div className='hidden items-center gap-3 text-sm sm:flex'>
									<Link
										href={`/${locale}/login`}
										className='rounded-full border border-white/20 px-4 py-1.5 text-white/80 transition hover:border-white/50 hover:bg-white/10'>
										{tNav("login")}
									</Link>
									<Link
										href={`/${locale}/signup`}
										className='rounded-full bg-white px-4 py-1.5 text-zinc-900 transition hover:bg-zinc-200'>
										{tNav("signup")}
									</Link>
								</div>
								<div className='flex items-center gap-2 text-xs sm:hidden'>
									<Link
										href={`/${locale}/login`}
										className='rounded-full border border-white/20 px-3 py-1.5 text-white/80 transition hover:border-white/50 hover:bg-white/10'>
										{tNav("login")}
									</Link>
									<Link
										href={`/${locale}/signup`}
										className='rounded-full bg-white px-3 py-1.5 text-zinc-900 transition hover:bg-zinc-200'>
										{tNav("signup")}
									</Link>
								</div>
							</>
						)}
					</div>
				</div>

				<div className='mt-3 sm:hidden'>
					<NavLinks links={links} />
				</div>
			</div>
		</header>
	);
}
