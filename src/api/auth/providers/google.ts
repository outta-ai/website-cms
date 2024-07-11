import crypto from "node:crypto";

import type { Request, Response } from "express";
import { z } from "zod";

import payload from "payload";
import { createToken, type RefreshTokenPayload } from "..";
import { createCodeChallenge, getCodeChallenge } from "../../../utils/auth";
import { EncryptCookieError } from "../../../utils/cookies";

const GoogleTokenResponse = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	token_type: z.string(),
	scope: z.string(),
	refresh_token: z.string().optional(),
});

const GoogleUserInfoResponse = z
	.object({
		id: z.string(),
		email: z.string(),
	})
	.passthrough();

export function config() {
	if (!process.env.BASE_URL) {
		throw new Error("Missing BASE_URL");
	}

	if (!process.env.TOKEN_SECRET) {
		throw new Error("Missing TOKEN_SECRET");
	}

	if (!process.env.PUBLIC_TOKEN_SECRET) {
		throw new Error("Missing PUBLIC_TOKEN_SECRET");
	}

	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");
	if (secret.length * 8 !== 256) {
		throw new Error(
			`Invalid PUBLIC_TOKEN_SECRET: expected 256 bits, found ${
				secret.length * 8
			} bits`,
		);
	}

	if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
		throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID");
	}

	if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
		throw new Error("Missing GOOGLE_OAUTH_CLIENT_SECRET");
	}

	return {
		baseUrl: process.env.BASE_URL,
		secret: {
			private: process.env.TOKEN_SECRET,
			public: process.env.PUBLIC_TOKEN_SECRET,
		},
		clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
		clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
	};
}

export async function signIn(req: Request, res: Response) {
	const configs = config();
	const state = crypto.randomUUID();

	const challenge = createCodeChallenge(req, res, configs.secret.private);
	if (challenge instanceof EncryptCookieError) {
		console.error(challenge);
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "An internal server error occurred while getting sign-in URL",
			},
		});
	}

	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.append("client_id", configs.clientId);
	url.searchParams.append(
		"redirect_uri",
		`${process.env.BASE_URL}/outta/auth/google/callback`,
	);
	url.searchParams.append("response_type", "code");
	url.searchParams.append("scope", "openid email profile");
	// url.searchParams.append("code_challenge", challenge);
	// url.searchParams.append("code_challenage_method", "S256");
	url.searchParams.append("state", `${state}-google`);
	url.searchParams.append("access_type", "offline");

	res.cookie("OUTTA_OAUTH_STATE", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});

	res.status(200).send({
		result: true,
		data: url.toString(),
	});
}

export async function callback(req: Request, res: Response) {
	const configs = config();

	if (
		!req.cookies ||
		!("OUTTA_OAUTH_STATE" in req.cookies) ||
		!req.cookies.OUTTA_OAUTH_STATE
	) {
		return res.status(400).send({
			result: false,
			error: {
				code: "no_state",
				message: "No state found",
			},
		});
	}
	const state = req.cookies.OUTTA_OAUTH_STATE;

	const url = new URL(req.url, process.env.BASE_URL);
	if (url.searchParams.get("state") !== `${state}-google`) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_state",
				message: "Invalid state",
			},
		});
	}

	const code = url.searchParams.get("code");
	if (!code) {
		return res.status(400).send({
			result: false,
			error: {
				code: "no_code",
				message: "No code found",
			},
		});
	}

	const verifier = getCodeChallenge(req, res, configs.secret.private);
	if (!verifier) {
		return res.status(400).send({
			result: false,
			error: {
				code: "no_code_verifier",
				message: "No code verifier found",
			},
		});
	}

	if (verifier instanceof Error) {
		console.error(verifier);
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message:
					"An internal server error occurred while getting code verifier",
			},
		});
	}

	const params = new URLSearchParams();
	params.append("code", code);
	params.append("client_id", configs.clientId);
	params.append("client_secret", configs.clientSecret);
	params.append(
		"redirect_uri",
		`${process.env.BASE_URL}/outta/auth/google/callback`,
	);
	params.append("grant_type", "authorization_code");
	// params.append("code_verifier", verifier);

	const tokenResponse = await fetchGoogleToken(params);

	if (!tokenResponse) {
		console.error("No token response");
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "An internal server error occurred while getting token",
			},
		});
	}

	const tokenText = await tokenResponse.text();
	const tokenData = (() => {
		try {
			const data = JSON.parse(tokenText);
			return GoogleTokenResponse.parse(data);
		} catch (error) {
			console.error(error);
			return null;
		}
	})();

	if (!tokenData) {
		console.error("Wrong token response", tokenText);
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const userInfoResponse = await fetchGoogleUserInfo(tokenData.access_token);

	if (!userInfoResponse) {
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const userInfoText = await userInfoResponse.text();
	const userInfoData = (() => {
		try {
			const data = JSON.parse(userInfoText);
			return GoogleUserInfoResponse.parse(data);
		} catch (error) {
			console.error(error);
			return null;
		}
	})();

	if (!userInfoData) {
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const memberByID = await payload.find({
		collection: "members",
		where: {
			googleId: {
				equals: userInfoData.id,
			},
		},
	});

	const memberByEmail = await payload.find({
		collection: "members",
		where: {
			email: {
				equals: userInfoData.email,
			},
		},
	});

	if (memberByID.totalDocs > 1) {
		console.error(
			"Multiple users found with the same Google ID",
			userInfoData.id,
		);
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "Internal Server Error occurred",
			},
		});
	}

	if (memberByEmail.totalDocs > 1) {
		console.error(
			"Multiple users found with the same email",
			userInfoData.email,
		);
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "Internal Server Error occurred",
			},
		});
	}

	if (memberByID.totalDocs === 0 && memberByEmail.totalDocs === 0) {
		return res.status(401).send({
			result: false,
			error: {
				code: "no_user",
				message: "No user found",
			},
		});
	}

	const member =
		memberByID.totalDocs === 1 ? memberByID.docs[0] : memberByEmail.docs[0];

	if (memberByID.totalDocs !== 1) {
		await payload.update({
			collection: "members",
			id: member.id,
			data: {
				googleId: userInfoData.id,
			},
		});
	}

	const { access_token, refresh_token } = await createToken(
		configs.secret.public,
		member,
		tokenData.refresh_token
			? {
					provider: "google",
					token: tokenData.refresh_token,
				}
			: undefined,
	);

	res.cookie("OUTTA_OAUTH_STATE", "", { maxAge: 0 });
	res.cookie("OUTTA_OAUTH_CODE_VERIFIER", "", { maxAge: 0 });
	res.cookie("OUTTA_REDIRECT_URI", "", { maxAge: 0 });

	res.cookie("OUTTA_ACCESS_TOKEN", access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 1 * 60 * 60 * 1000,
	});

	refresh_token &&
		res.cookie("OUTTA_REFRESH_TOKEN", refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 2 * 7 * 24 * 60 * 60 * 1000,
		});

	const redirect_uri = req.cookies.OUTTA_REDIRECT_URI;
	return res.redirect(redirect_uri);
}

export async function refresh(
	_req: Request,
	res: Response,
	tokenPayload: z.infer<typeof RefreshTokenPayload>,
) {
	const configs = config();

	const params = new URLSearchParams();
	params.append("client_id", configs.clientId);
	params.append("client_secret", configs.clientSecret);
	params.append("refresh_token", tokenPayload.authentication.token);
	params.append("grant_type", "refresh_token");

	const tokenResponse = await fetchGoogleToken(params);

	if (!tokenResponse) {
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "An internal server error occurred while getting token",
			},
		});
	}

	const tokenText = await tokenResponse.text();
	const tokenData = (() => {
		try {
			const data = JSON.parse(tokenText);
			return GoogleTokenResponse.parse(data);
		} catch (error) {
			console.error(error);
			return null;
		}
	})();

	if (!tokenData) {
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const userInfoResponse = await fetchGoogleUserInfo(tokenData.access_token);

	if (!userInfoResponse) {
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const userInfoText = await userInfoResponse.text();
	const userInfoData = (() => {
		try {
			const data = JSON.parse(userInfoText);
			return GoogleUserInfoResponse.parse(data);
		} catch (error) {
			console.error(error);
			return null;
		}
	})();

	if (!userInfoData) {
		return res.status(502).send({
			result: false,
			error: {
				code: "invalid_response",
				message: "Invalid response from Google",
			},
		});
	}

	const member = await payload.find({
		collection: "members",
		where: {
			googleId: {
				equals: userInfoData.id,
			},
		},
	});

	if (member.totalDocs === 0) {
		return res.status(401).send({
			result: false,
			error: {
				code: "no_user",
				message: "No user found",
			},
		});
	}

	if (member.docs[0].id !== tokenPayload.member) {
		return res.status(403).send({
			result: false,
			error: {
				code: "invalid_user",
				message: "Invalid user",
			},
		});
	}

	const { access_token, refresh_token } = await createToken(
		configs.secret.public,
		member.docs[0],
		tokenData.refresh_token
			? {
					provider: "google",
					token: tokenData.refresh_token,
				}
			: undefined,
	);

	res.cookie("OUTTA_ACCESS_TOKEN", access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 1 * 60 * 60 * 1000,
	});

	refresh_token &&
		res.cookie("OUTTA_REFRESH_TOKEN", refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 2 * 7 * 24 * 60 * 60 * 1000,
		});

	return res.status(200).send({ result: true });
}

async function fetchGoogleToken(params: URLSearchParams) {
	try {
		return await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});
	} catch (error) {
		console.error(error);
		return null;
	}
}

async function fetchGoogleUserInfo(token: string) {
	try {
		return await fetch("https://www.googleapis.com/userinfo/v2/me", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	} catch (error) {
		console.error(error);
		return null;
	}
}
