import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
	console.warn(
		"Warning: OPENAI_API_KEY is not set. AI summarization features will be disabled."
	);
}

export const openai = new OpenAI({
	apiKey,
});
