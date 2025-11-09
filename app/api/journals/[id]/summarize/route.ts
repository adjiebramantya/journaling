import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "../../../../../lib/supabaseRoute";
import { openai } from "../../../../../lib/openai";

const MESSAGES = {
	id: {
		unauthorized: "Kamu perlu masuk untuk melanjutkan.",
		notFound: "Jurnal tidak ditemukan",
		summaryFailure: "Gagal menghasilkan ringkasan AI.",
		saveFailure: "Gagal menyimpan ringkasan.",
	},
	en: {
		unauthorized: "You need to sign in to continue.",
		notFound: "Journal not found",
		summaryFailure: "Failed to generate AI summary.",
		saveFailure: "Failed to save summary.",
	},
} as const;

const PROMPTS = {
	id: {
		system:
			"Kamu adalah mentor journaling yang empatik dan berbicara dalam bahasa Indonesia. Ringkaslah isi jurnal secara singkat (maksimal 120 kata) dan berikan satu saran yang spesifik serta dapat segera dilakukan. Jawab HANYA dalam format JSON tanpa blok kode, dengan key `summary` dan `suggestion`, keduanya dalam bahasa Indonesia.",
		user: (journal: any) => `Judul jurnal: ${journal.title ?? "Tanpa judul"}
Mood (opsional): ${journal.mood ?? "Tidak disebutkan"}
Dibuat pada (UTC): ${journal.created_at}

Isi:
${journal.content}`,
	},
	en: {
		system:
			"You are an empathetic journaling coach speaking English. Summarise the journal entry concisely (up to 120 words) and provide one actionable suggestion grounded in the entry. Respond ONLY as JSON without code fences, using the keys `summary` and `suggestion`, both in English.",
		user: (journal: any) => `Journal title: ${journal.title ?? "Untitled"}
Mood (optional): ${journal.mood ?? "Not specified"}
Created at (UTC): ${journal.created_at}

Entry:
${journal.content}`,
	},
} as const;

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const locale = (req.headers.get("x-locale") ?? "id") as "id" | "en";
	const { supabase, response: supabaseResponse } =
		createSupabaseRouteClient(req);

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		const message = MESSAGES[locale] ?? MESSAGES.id;
		return NextResponse.json(
			{ error: message.unauthorized },
			{ status: 401, statusText: "Unauthorized" }
		);
	}

	const { data: journal, error: journalError } = await supabase
		.from("journals")
		.select(
			"id, title, content, mood, created_at, journal_summaries (summary, ai_suggestion)"
		)
		.eq("id", id)
		.eq("user_id", user.id)
		.single();

	if (journalError || !journal) {
		const message = MESSAGES[locale] ?? MESSAGES.id;
		return NextResponse.json(
			{ error: message.notFound },
			{ status: 404, statusText: "Not Found" }
		);
	}

	if (!process.env.OPENAI_API_KEY) {
		return NextResponse.json(
			{
				error:
					"OPENAI_API_KEY is not set. Please configure it to enable AI summaries.",
			},
			{ status: 500, statusText: "OpenAI key missing" }
		);
	}

	const promptLocale = PROMPTS[locale] ?? PROMPTS.id;
	const prompt = [
		{
			role: "system" as const,
			content: promptLocale.system,
		},
		{
			role: "user" as const,
			content: promptLocale.user(journal),
		},
	];

	let summaryText = "";
	let suggestionText = "";

	try {
		const aiResponse = await openai.responses.create({
			model: "gpt-4o-mini",
			input: prompt,
		});

		let rawOutput = aiResponse.output_text ?? "";
		rawOutput = rawOutput
			.replace(/```json\b([\s\S]*?)```/gi, "$1")
			.replace(/```([\s\S]*?)```/g, "$1")
			.trim();

		try {
			const parsed = JSON.parse(rawOutput);
			summaryText = parsed.summary ?? "";
			suggestionText = parsed.suggestion ?? "";
		} catch (parseError) {
			summaryText = rawOutput.trim();
			suggestionText = "";
		}
	} catch (error) {
		console.error("OpenAI summarization error:", error);
		const message = MESSAGES[locale] ?? MESSAGES.id;
		return NextResponse.json(
			{ error: message.summaryFailure },
			{ status: 500 }
		);
	}

	const upsertResult = await supabase.from("journal_summaries").upsert(
		{
			journal_id: journal.id,
			summary: summaryText,
			ai_suggestion: suggestionText,
		},
		{ onConflict: "journal_id" }
	);

	if (upsertResult.error) {
		const message = MESSAGES[locale] ?? MESSAGES.id;
		return NextResponse.json({ error: message.saveFailure }, { status: 500 });
	}

	const jsonResponse = NextResponse.json(
		{ summary: summaryText, suggestion: suggestionText },
		{ status: 200 }
	);

	supabaseResponse.cookies.getAll().forEach((cookie) => {
		jsonResponse.cookies.set(cookie);
	});

	return jsonResponse;
}
