"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "../../../i18n/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";

export default function SignupPage() {
	const router = useRouter();
	const locale = useLocale();
	const supabase = createClient();
	const t = useTranslations("signup");

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setInfo(null);
		setLoading(true);

		const { data, error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo:
					typeof window !== "undefined"
						? `${window.location.origin}/${locale}/login`
						: undefined,
				data: {
					full_name: fullName,
				},
			},
		});

		if (signUpError) {
			setError(signUpError.message ?? t("errors.signup"));
			setLoading(false);
			return;
		}

		if (data.user?.id) {
			await supabase.from("profiles").upsert({
				id: data.user.id,
				full_name: fullName,
			});
		}

		if (!data.session) {
			setInfo(t("info"));
			setLoading(false);
			return;
		}

		setLoading(false);
		router.replace(`/${locale}/journal`);
		router.refresh();
	};

	return (
		<div className='relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.16),transparent_55%)]' />
			<div className='absolute left-12 bottom-16 hidden h-28 w-28 rounded-full bg-indigo-500/30 blur-3xl lg:block' />
			<main className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col-reverse gap-12 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-20'>
				<section className='flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-black/35 p-8 shadow-2xl backdrop-blur'>
					<header className='space-y-2 text-center'>
						<h2 className='text-2xl font-semibold text-white'>{t("title")}</h2>
						<p className='text-sm text-white/60'>
							{t("subtitle")}{" "}
							<Link
								href={`/${locale}/login`}
								className='font-semibold text-white underline underline-offset-4'>
								{t("switch")}
							</Link>
						</p>
					</header>

					<form onSubmit={handleSubmit} className='grid gap-5'>
						<label className='grid gap-2 text-sm text-white/70'>
							{t("fullName")}
							<input
								type='text'
								value={fullName}
								onChange={(event) => setFullName(event.target.value)}
								placeholder={t("fullNamePlaceholder")}
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-indigo-300/80 focus:ring-2 focus:ring-indigo-300/40'
							/>
						</label>

						<label className='grid gap-2 text-sm text-white/70'>
							{t("email")}
							<input
								type='email'
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								autoComplete='email'
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-indigo-300/80 focus:ring-2 focus:ring-indigo-300/40'
							/>
						</label>

						<label className='grid gap-2 text-sm text-white/70'>
							{t("password")}
							<input
								type='password'
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
								minLength={6}
								autoComplete='new-password'
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white outline-none transition focus:border-indigo-300/80 focus:ring-2 focus:ring-indigo-300/40'
							/>
						</label>

						{error && (
							<p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>
								{error}
							</p>
						)}
						{info && (
							<p className='rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80'>
								{info}
							</p>
						)}

						<button
							type='submit'
							disabled={loading}
							className='inline-flex items-center justify-center rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60'>
							{loading ? t("loading") : t("submit")}
						</button>
					</form>

					<p className='text-center text-xs text-white/50'>{t("privacy")}</p>
				</section>

				<section className='flex flex-1 flex-col gap-6 text-white'>
					<span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/70'>
						JournaIA
					</span>
					<h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>
						{t("title")}
					</h1>
					<p className='max-w-xl text-base text-white/70 sm:text-lg'>
						{t("heroDescription")}
					</p>
				</section>
			</main>
		</div>
	);
}
