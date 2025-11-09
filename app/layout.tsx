import type { Metadata } from "next";
import "./globals.css";

const title = "JournaIA";
const description = "AI-assisted journaling for daily reflection";
const iconPath = "/journaia-icon.svg";

export const metadata: Metadata = {
	title,
	description,
	icons: {
		icon: iconPath,
		shortcut: iconPath,
		apple: iconPath,
	},
	openGraph: {
		title,
		description,
		url: "https://journaia.app",
		type: "website",
		images: [{ url: iconPath }],
	},
	twitter: {
		card: "summary",
		title,
		description,
		images: [iconPath],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body>{children}</body>
		</html>
	);
}
