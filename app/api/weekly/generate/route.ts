import { NextRequest, NextResponse } from "next/server";
import { addDays, endOfWeek, formatISO, startOfWeek } from "date-fns";
import { createSupabaseRouteClient } from "../../../../lib/supabaseRoute";
import { openai } from "../../../../lib/openai";

const WEEK_OPTIONS = { weekStartsOn: 1 as const }; // Monday

const MESSAGES = {
	id: {
		unauthorized: "Kamu perlu masuk untuk melanjutkan.",
		checkFailure: "Gagal memeriksa rekap minggu ini.",
		fetchFailure: "Gagal mengambil jurnal untuk minggu ini.",
		noEntries: "Belum ada jurnal yang ditulis minggu ini.",
		summaryFailure: "Gagal menghasilkan rekap mingguan.",
		saveFailure: "Gagal menyimpan rekap mingguan.",
	},
	en: {
		unauthorized: "You need to sign in to continue.",
		checkFailure: "Failed to check this week's recap.",
		fetchFailure: "Couldn't fetch journals for this week.",
		noEntries: "No journal entries were written this week.",
		summaryFailure: "Failed to generate the weekly recap.",
		saveFailure: "Failed to save the weekly recap.",
	},
} as const;

const PROMPTS = {
	id: {
		system:
			"Kamu adalah analis journaling yang reflektif dan hangat dalam bahasa Indonesia. Olahlah kumpulan jurnal mingguan untuk menghasilkan ringkasan 3-5 kalimat dan satu rekomendasi konkret yang bisa dilakukan minggu depan. Jawab hanya dalam JSON tanpa blok kode dengan field `summary` dan `suggestion`, keduanya bahasa Indonesia.",
		user: (
			weekStart: string,
			weekEnd: string,
			entriesText: string
		) => `Ringkasan mingguan untuk rentang ${weekStart} hingga ${weekEnd}.

Kumpulan entri:
${entriesText}`,
	},
	en: {
		system:
			"You are a thoughtful, encouraging journaling analyst speaking English. Review the week's entries and produce a summary of 3-5 sentences plus one concrete recommendation for next week. Respond ONLY as JSON without code fences using the keys `summary` and `suggestion`, both in English.",
		user: (
			weekStart: string,
			weekEnd: string,
			entriesText: string
		) => `Weekly recap covering ${weekStart} through ${weekEnd}.

Entries:
${entriesText}`,
	},
} as const;

export async function POST(req: NextRequest) {
	const locale = (req.headers.get("x-locale") ?? "id") as "id" | "en";
	const messages = MESSAGES[locale] ?? MESSAGES.id;
	const promptLocale = PROMPTS[locale] ?? PROMPTS.id;

	const { supabase, response: supabaseResponse } =
		createSupabaseRouteClient(req);

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json(
			{ error: messages.unauthorized },
			{ status: 401, statusText: "Unauthorized" }
		);
	}

	if (!process.env.OPENAI_API_KEY) {
		return NextResponse.json(
			{
				error:
					"OPENAI_API_KEY belum dikonfigurasi. Tambahkan ke environment sebelum membuat rekap.",
			},
			{ status: 500 }
		);
	}

	const today = new Date();
	const weekStart = startOfWeek(today, WEEK_OPTIONS);
	const weekEnd = endOfWeek(today, WEEK_OPTIONS);
	const weekEndExclusive = addDays(weekEnd, 1);

	const weekStartIso = weekStart.toISOString().slice(0, 10);
	const weekEndIso = weekEnd.toISOString().slice(0, 10);

	const { data: existingRecap, error: recapError } = await supabase
		.from("weekly_summaries")
		.select("summary, ai_suggestion, week_start, week_end")
		.eq("user_id", user.id)
		.eq("week_start", weekStartIso)
		.eq("week_end", weekEndIso)
		.maybeSingle();

	if (recapError && recapError.code !== "PGRST116") {
		return NextResponse.json({ error: messages.checkFailure }, { status: 500 });
	}

	if (existingRecap) {
		const jsonResponse = NextResponse.json(
			{
				summary: existingRecap.summary,
				suggestion: existingRecap.ai_suggestion,
				weekStart: existingRecap.week_start,
				weekEnd: existingRecap.week_end,
				fromCache: true,
			},
			{ status: 200 }
		);

		supabaseResponse.cookies.getAll().forEach((cookie) => {
			jsonResponse.cookies.set(cookie);
		});

		return jsonResponse;
	}

	const { data: journals, error: journalError } = await supabase
		.from("journals")
		.select("title, content, mood, created_at")
		.eq("user_id", user.id)
		.gte("created_at", formatISO(weekStart))
		.lt("created_at", formatISO(weekEndExclusive))
		.order("created_at", { ascending: true });

	if (journalError) {
		return NextResponse.json({ error: messages.fetchFailure }, { status: 500 });
	}

	if (!journals || journals.length === 0) {
		return NextResponse.json({ error: messages.noEntries }, { status: 400 });
	}

	const entriesText = journals
		.map((entry, index) => {
			const label = locale === "en" ? "Entry" : "Entri";
			const titleLabel = locale === "en" ? "Title" : "Judul";
			const moodLabel = locale === "en" ? "Mood" : "Mood";
			const contentLabel = locale === "en" ? "Content" : "Isi";
			const dateLabel = locale === "en" ? "Date" : "Tanggal";
			const untitled = locale === "en" ? "Untitled" : "Tanpa judul";
			const unspecified =
				locale === "en" ? "Not specified" : "Tidak disebutkan";

			return `${label} ${index + 1}
${dateLabel}: ${entry.created_at}
${titleLabel}: ${entry.title ?? untitled}
${moodLabel}: ${entry.mood ?? unspecified}
${contentLabel}:
${entry.content}`;
		})
		.join("\n\n---\n\n");

	let summary = "";
	let suggestion = "";

	try {
		const aiResponse = await openai.responses.create({
			model: "gpt-4o-mini",
			input: [
				{ role: "system", content: promptLocale.system },
				{
					role: "user",
					content: promptLocale.user(
						weekStart.toISOString(),
						weekEnd.toISOString(),
						entriesText
					),
				},
			],
		});

		let output = aiResponse.output_text ?? "";
		output = output
			.replace(/```json\b([\s\S]*?)```/gi, "$1")
			.replace(/```([\s\S]*?)```/g, "$1")
			.trim();

		const parsed = JSON.parse(output);
		summary = parsed.summary ?? "";
		suggestion = parsed.suggestion ?? "";
	} catch (error) {
		console.error("OpenAI weekly summary error", error);
		return NextResponse.json(
			{ error: messages.summaryFailure },
			{ status: 500 }
		);
	}

	const upsertResult = await supabase.from("weekly_summaries").upsert(
		{
			user_id: user.id,
			week_start: weekStartIso,
			week_end: weekEndIso,
			summary,
			ai_suggestion: suggestion,
		},
		{ onConflict: "user_id, week_start, week_end" }
	);

	if (upsertResult.error) {
		return NextResponse.json({ error: messages.saveFailure }, { status: 500 });
	}

	const jsonResponse = NextResponse.json(
		{ summary, suggestion, weekStart: weekStartIso, weekEnd: weekEndIso },
		{ status: 200 }
	);

	supabaseResponse.cookies.getAll().forEach((cookie) => {
		jsonResponse.cookies.set(cookie);
	});

	return jsonResponse;
}
