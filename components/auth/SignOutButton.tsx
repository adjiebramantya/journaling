"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { createClient } from "../../lib/supabaseClient";
import { useTranslations, useLocale } from "../../i18n/client";

type SignOutButtonProps = {
	variant?: "default" | "compact";
};

export default function SignOutButton({
	variant = "default",
}: SignOutButtonProps) {
	const t = useTranslations("auth");
	const locale = useLocale();
	const router = useRouter();
	const supabase = createClient();
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSignOut = async () => {
		setError(null);
		const { error: signOutError } = await supabase.auth.signOut();
		if (signOutError) {
			setError(signOutError.message);
			return;
		}
		startTransition(() => {
			router.replace(`/${locale}/login`);
			router.refresh();
		});
	};

	const isCompact = variant === "compact";

	const containerClass = isCompact
		? "flex items-center gap-2"
		: "flex flex-col items-end gap-1";

	const buttonClass = isCompact
		? "inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
		: "inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60";

	const errorClass = isCompact
		? "text-[10px] font-medium text-red-300"
		: "text-xs font-medium text-red-400";

	return (
		<div className={containerClass}>
			<button
				onClick={handleSignOut}
				disabled={isPending}
				className={buttonClass}>
				{isPending ? t("loggingOut") : t("logout")}
			</button>
			{error && <span className={clsx(errorClass)}>{error}</span>}
		</div>
	);
}
