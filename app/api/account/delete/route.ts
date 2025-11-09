import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "../../../../lib/supabaseRoute";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export async function DELETE(req: NextRequest) {
	const { supabase, response: supabaseResponse } =
		createSupabaseRouteClient(req);
	const {
		data: { user },
		error: sessionError,
	} = await supabase.auth.getUser();

	if (sessionError || !user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = user.id;

	const { data: journalRows, error: journalsQueryError } = await supabase
		.from("journals")
		.select("id")
		.eq("user_id", userId);

	if (journalsQueryError) {
		return NextResponse.json(
			{ error: journalsQueryError.message },
			{ status: 500 }
		);
	}

	if (journalRows && journalRows.length > 0) {
		const journalIds = journalRows.map((row) => row.id);
		const { error: summariesDeleteError } = await supabase
			.from("journal_summaries")
			.delete()
			.in("journal_id", journalIds);

		if (summariesDeleteError) {
			return NextResponse.json(
				{ error: summariesDeleteError.message },
				{ status: 500 }
			);
		}
	}

	const { error: weeklyDeleteError } = await supabase
		.from("weekly_summaries")
		.delete()
		.eq("user_id", userId);

	if (weeklyDeleteError) {
		return NextResponse.json(
			{ error: weeklyDeleteError.message },
			{ status: 500 }
		);
	}

	const { error: journalsDeleteError } = await supabase
		.from("journals")
		.delete()
		.eq("user_id", userId);

	if (journalsDeleteError) {
		return NextResponse.json(
			{ error: journalsDeleteError.message },
			{ status: 500 }
		);
	}

	const { error: profileDeleteError } = await supabase
		.from("profiles")
		.delete()
		.eq("id", userId);

	if (profileDeleteError) {
		return NextResponse.json(
			{ error: profileDeleteError.message },
			{ status: 500 }
		);
	}

	await supabase.auth.signOut();

	const adminClient = getSupabaseAdminClient();

	if (!adminClient) {
		return NextResponse.json(
			{ error: "Missing Supabase service role key on the server." },
			{ status: 500 }
		);
	}

	const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
		userId
	);

	if (deleteUserError) {
		return NextResponse.json(
			{ error: deleteUserError.message },
			{ status: 500 }
		);
	}

	const jsonResponse = NextResponse.json({ success: true }, { status: 200 });

	supabaseResponse.cookies.getAll().forEach((cookie) => {
		jsonResponse.cookies.set(cookie);
	});

	return jsonResponse;
}
