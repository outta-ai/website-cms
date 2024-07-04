import type { Request } from "express";

export function config() {
	if (!process.env.BASE_URL) {
		throw new Error("Missing BASE_URL");
	}

	if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
		throw new Error("Missing GOOGLE_CLIENT_ID");
	}

	if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
		throw new Error("Missing GOOGLE_CLIENT_SECRET");
	}
}

export async function signIn(req: Request, res: Response) {
	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.append("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID);
	url.searchParams.append(
		"redirect_uri",
		`${process.env.BASE_URL}/outta/auth/google/callback`,
	);
}

export async function callback(req: Request, res: Response) {}
