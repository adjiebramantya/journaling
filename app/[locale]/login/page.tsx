"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "../../../i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";

export default function LoginPage() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const supabase = createClient();
	const t = useTranslations("login");

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const { error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (signInError) {
			setError(signInError.message ?? t("error"));
			setLoading(false);
			return;
		}

		setLoading(false);
		const target = redirectTo
			? `/${locale}${redirectTo}`
			: `/${locale}/journal`;
		router.replace(target);
		router.refresh();
	};

	return (
		<div className='relative min-h-screen overflow-hidden bg-linear-to-br from-zinc-950 via-slate-900 to-zinc-950 text-white'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]' />
			<div className='absolute top-12 right-16 hidden h-24 w-24 rounded-full bg-emerald-400/30 blur-3xl lg:block' />
			<main className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-20'>
				<section className='flex flex-1 flex-col gap-6 text-white'>
					<span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-white/70'>
						JournaIA
					</span>
					<h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>
						{t("title")}
					</h1>
					<p className='max-w-xl text-base text-white/70 sm:text-lg'>
						{t("heroDescription")}
					</p>
					<div className='rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur'>
						<p className='text-sm font-medium uppercase tracking-wide text-white/50'>
							{t("subtitle")}{" "}
							<Link
								href={`/${locale}/signup`}
								className='font-semibold text-white underline underline-offset-4'>
								{t("switch")}
							</Link>
						</p>
					</div>
				</section>

				<section className='flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur'>
					<form onSubmit={handleSubmit} className='grid gap-5'>
						<label className='grid gap-2 text-sm text-white/70'>
							{t("email")}
							<input
								type='email'
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								autoComplete='email'
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-300/40'
							/>
						</label>

						<label className='grid gap-2 text-sm text-white/70'>
							{t("password")}
							<input
								type='password'
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
								autoComplete='current-password'
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-300/40'
							/>
						</label>

						{error && (
							<p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>
								{error}
							</p>
						)}

						<button
							type='submit'
							disabled={loading}
							className='inline-flex items-center justify-center rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60'>
							{loading ? t("loading") : t("submit")}
						</button>
					</form>

					<p className='text-center text-xs text-white/50'>{t("policy")}</p>
				</section>
			</main>
		</div>
	);
}
