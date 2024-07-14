import cors from "cors";
import { json, Router } from "express";
import { jwtVerify, SignJWT } from "jose";
import type { Member } from "payload/generated-types";
import { z } from "zod";

import cookieParser from "cookie-parser";
import * as providers from "./providers";

export const RefreshTokenPayload = z.object({
	member: z.string(),
	authentication: z.object({ provider: z.string(), token: z.string() }),
});

const router = Router();
router.use(json());
router.use(cookieParser());
router.use(
	cors({
		credentials: true,
		origin: (_, callback) => callback(null, true),
	}),
);

const SignInBody = z.object({
	returnUrl: z.string(),
});

router.post("/logout", async (req, res) => {
	const url = new URL(`${process.env.BASE_URL}${req.url}`);

	if (url.searchParams.get("token") !== req.headers["x-outta-token"]) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_token",
				message: "Invalid Token",
			},
		});
	}

	res.clearCookie("OUTTA_ACCESS_TOKEN");
	res.clearCookie("OUTTA_REFRESH_TOKEN");
	res.clearCookie("OUTTA_REDIRECT_URI");

	return res.status(200).send();
});

router.post("/:provider", async (req, res) => {
	const parseResult = SignInBody.safeParse(req.body);
	if (!parseResult.success) {
		console.error(req.body);
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

	res.cookie("OUTTA_REDIRECT_URI", parseResult.data.returnUrl, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});

	const provider = req.params.provider;

	if (provider in providers) {
		return providers[provider as keyof typeof providers].signIn(req, res);
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
		return providers[provider as keyof typeof providers].callback(req, res);
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
	if (!process.env.PUBLIC_TOKEN_SECRET) {
		console.error("No PUBLIC_TOKEN_SECRET");
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "Internal Server Error",
			},
		});
	}

	if (
		!req.cookies ||
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

	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");
	const refreshToken = await (async () => {
		try {
			const token = await jwtVerify<z.infer<typeof RefreshTokenPayload>>(
				req.cookies.OUTTA_REFRESH_TOKEN,
				secret,
				{
					algorithms: ["HS256"],
					subject: "auth.refresh",
					audience: "outta.ai/client",
					issuer: "api.outta.ai",
				},
			);

			return {
				...token,
				payload: RefreshTokenPayload.passthrough().parse(token.payload),
			};
		} catch (error) {
			console.error(error);
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
		return providers[provider as keyof typeof providers].refresh(
			req,
			res,
			refreshToken.payload,
		);
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
			providers[provider as keyof typeof providers].config();
		} catch (error) {
			throw new Error(`Failed to configure provider "${provider}": ${error}`);
		}
	}
};

export async function createToken(
	secret: string,
	member: Member,
	refreshPayload?: Record<string, unknown>,
) {
	const key = Buffer.from(secret, "hex");

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
		.sign(key);

	const refresh_token = refreshPayload
		? await new SignJWT({
				member: member.id,
				authentication: refreshPayload,
			})
				.setProtectedHeader({ alg: "HS256" })
				.setAudience("outta.ai/client")
				.setIssuer("api.outta.ai")
				.setExpirationTime("2w")
				.setSubject("auth.refresh")
				.sign(key)
		: null;

	return { access_token, refresh_token };
}

export default { config, router };
