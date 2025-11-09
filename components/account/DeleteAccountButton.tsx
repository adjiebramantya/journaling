"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "../../i18n/client";

export default function DeleteAccountButton() {
	const t = useTranslations("account.delete");
	const locale = useLocale();
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = async () => {
		setLoading(true);
		setError(null);

		const response = await fetch("/api/account/delete", {
			method: "DELETE",
			credentials: "include",
		});

		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			setError(payload?.error ?? t("error"));
			setLoading(false);
			return;
		}

		setLoading(false);
		setOpen(false);
		router.replace(`/${locale}`);
		router.refresh();
	};

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='inline-flex items-center justify-center rounded-full border border-red-300/60 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/10'>
				{t("button")}
			</button>

			{open && (
				<>
					<div className='fixed inset-0 z-40 bg-black/70 backdrop-blur-sm' />
					<div className='fixed inset-0 z-50 flex min-h-full items-center justify-center px-4 py-12 sm:py-20'>
						<button
							type='button'
							className='absolute inset-0 h-full w-full cursor-default bg-transparent'
							onClick={() => {
								if (!loading) {
									setOpen(false);
									setError(null);
								}
							}}
							aria-label={t("cancel")}
						/>
						<div className='relative z-10 w-full max-w-md rounded-3xl border border-red-400/30 bg-zinc-950/95 p-6 text-white shadow-2xl sm:p-6'>
							<div className='space-y-3'>
								<h3 className='text-xl font-semibold text-red-100'>
									{t("modalTitle")}
								</h3>
								<p className='text-sm text-red-100/80'>
									{t("modalDescription")}
								</p>
								{error && (
									<p className='rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>
										{error}
									</p>
								)}
							</div>
							<div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
								<button
									type='button'
									onClick={() => {
										if (!loading) {
											setOpen(false);
											setError(null);
										}
									}}
									className='inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10 sm:min-w-[120px]'>
									{t("cancel")}
								</button>
								<button
									type='button'
									onClick={handleConfirm}
									disabled={loading}
									className='inline-flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[160px]'>
									{loading ? t("loading") : t("confirm")}
								</button>
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}
