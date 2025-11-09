"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type NavLinksProps = {
	links: { href: string; label: string }[];
};

export default function NavLinks({ links }: NavLinksProps) {
	const pathname = usePathname();

	return (
		<nav className='flex items-center gap-2 overflow-x-auto text-xs text-white/70 md:gap-3 md:text-sm'>
			{links.map((link) => {
				const segments = link.href.split("/").filter(Boolean);
				const isRootLink = segments.length <= 1; // only locale segment
				const isActive = isRootLink
					? pathname === link.href
					: pathname === link.href || pathname.startsWith(`${link.href}/`);

				return (
					<Link
						key={link.href}
						href={link.href}
						className={clsx(
							"whitespace-nowrap rounded-full px-3 py-1.5 transition md:px-4",
							isActive
								? "bg-white text-zinc-900"
								: "hover:bg-white/10 hover:text-white"
						)}>
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
}
