import { Router } from "express";

import { jwtVerify, SignJWT } from "jose";
import type { Member } from "payload/generated-types";
import { z } from "zod";
import * as providers from "./providers";

export type RefreshTokenPayload = {
	member: string;
	authentication: { provider: string; token: string };
};

const router = Router();

const SignInBody = z.object({
	returnUrl: z.string(),
});

router.post("/:provider", async (req, res) => {
	const parseResult = SignInBody.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_body",
				message: "Invalid Body",
			},
		});
	}

	if (!req.headers.origin) {
		return res.status(400).send({
			result: false,
			error: {
				code: "no_origin",
				message: "No Origin",
			},
		});
	}

	try {
		const returnUrl = new URL(parseResult.data.returnUrl);
		const origin = new URL(req.headers.origin);

		if (returnUrl.origin !== origin.origin) {
			return res.status(400).send({
				result: false,
				error: {
					code: "invalid_return_url",
					message: "Invalid Return URL",
				},
			});
		}
	} catch (error) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_return_url",
				message: "Invalid Return URL",
			},
		});
	}

	const provider = req.params.provider;

	if (provider in providers) {
		return providers[provider].signIn(req, res);
	}

	return res.status(400).send({
		result: false,
		error: {
			code: "unsupported_provider",
			message: `Unsupported Provider "${provider}"`,
		},
	});
});

router.get("/:provider/callback", async (req, res) => {
	const provider = req.params.provider;

	if (provider in providers) {
		return providers[provider].callback(req, res);
	}

	return res.status(400).send({
		result: false,
		error: {
			code: "unsupported_provider",
			message: `Unsupported Provider "${provider}"`,
		},
	});
});

router.get("/refresh", async (req, res) => {
	if (
		!("OUTTA_REFRESH_TOKEN" in req.cookies) ||
		!req.cookies.OUTTA_REFRESH_TOKEN
	) {
		return res.status(400).send({
			result: false,
			error: {
				code: "no_refresh_token",
				message: "No Refresh Token",
			},
		});
	}

	const secret = Buffer.from(process.env.PUBLIC_TOKEN_REFRESH, "hex");
	const refreshToken = await (() => {
		try {
			return jwtVerify<RefreshTokenPayload>(
				req.cookies.OUTTA_REFRESH_TOKEN,
				secret,
				{
					algorithms: ["HS256"],
					subject: "auth.refresh",
					audience: "outta.ai/client",
					issuer: "api.outta.ai",
				},
			);
		} catch (error) {
			return null;
		}
	})();

	if (!refreshToken) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_refresh_token",
				message: "Invalid Refresh Token",
			},
		});
	}

	const provider = refreshToken.payload.authentication.provider;
	if (provider in providers) {
		return providers[provider].refresh(req, res, refreshToken.payload);
	}

	return res.status(400).send({
		result: false,
		error: {
			code: "invalid_refresh_token",
			message: "Invalid Refresh Token",
		},
	});
});

const config = () => {
	for (const provider in providers) {
		try {
			providers[provider].config();
		} catch (error) {
			throw new Error(`Failed to configure provider "${provider}": ${error}`);
		}
	}
};

export default { config, router };

export async function createToken(
	member: Member,
	refreshPayload?: Record<string, unknown>,
) {
	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");

	const access_token = await new SignJWT({
		member: {
			id: member.id,
			name: member.name,
		},
		authentication: {
			provider: "google",
		},
	})
		.setProtectedHeader({ alg: "HS256" })
		.setAudience("outta.ai/client")
		.setIssuer("api.outta.ai")
		.setExpirationTime("1hr")
		.setSubject("auth.access")
		.sign(secret);

	const refresh_token = refreshPayload
		? await new SignJWT({
				member: { id: member.id },
				authenticaiton: refreshPayload,
			})
				.setProtectedHeader({ alg: "HS256" })
				.setAudience("outta.ai/client")
				.setIssuer("api.outta.ai")
				.setExpirationTime("2w")
				.setSubject("auth.refresh")
				.sign(secret)
		: null;

	return { access_token, refresh_token };
}
