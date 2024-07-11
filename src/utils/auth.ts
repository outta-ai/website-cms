import crypto from "node:crypto";

import type { Request, Response } from "express";

export type AccessTokenPayload = {
	member: {
		id: string;
		name: string;
	};
	authentication: {
		provider: string;
	};
};

import { jwtVerify } from "jose";
import {
	DecryptCookieError,
	EncryptCookieError,
	decryptCookie,
	encryptCookie,
	type DecryptCookieOptions,
} from "./cookies";

type CodeChallengeOptions = {
	name: string;
};

export function createCodeChallenge(
	_req: Request,
	res: Response,
	secret: string,
	options?: CodeChallengeOptions,
) {
	const verifier = crypto.randomBytes(48).toString("hex");
	const challenge = crypto
		.createHash("sha256")
		.update(verifier)
		.digest("base64url");

	const encrypted = encryptCookie(verifier, secret);
	if (encrypted instanceof EncryptCookieError) {
		return encrypted;
	}

	res.cookie(options?.name || "OUTTA_OAUTH_CODE_VERIFIER", encrypted, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});

	return challenge;
}

export class GetCodeChallengeError extends Error {
	type: "no_code_verifier";

	constructor(type: "no_code_verifier") {
		super(`Failed to get code verifier: ${type}`);

		this.type = type;
	}
}

export function getCodeChallenge(
	req: Request,
	_res: Response,
	secret: string,
	options?: CodeChallengeOptions & DecryptCookieOptions,
) {
	const name = options?.name || "OUTTA_OAUTH_CODE_VERIFIER";
	if (!req.cookies || !(name in req.cookies) || !req.cookies[name]) {
		return null;
	}

	try {
		return decryptCookie(name, req, secret, options ?? {});
	} catch (e) {
		if (e instanceof DecryptCookieError) {
			return e;
		}
		return new Error(`Unknown Error: ${e}`);
	}
}

type CheckAuthResult =
	| {
			result: true;
			data: AccessTokenPayload;
	  }
	| {
			result: false;
			error: {
				code: "no_secret" | "no_token" | "invalid_token";
				message: string;
			};
	  };

export async function checkAuth(
	req: Request,
	secret: string | undefined,
): Promise<CheckAuthResult> {
	if (!secret) {
		console.error("No secret provided for cookie encryption");
		return {
			result: false,
			error: {
				code: "no_secret",
				message: "No Secret",
			},
		};
	}

	const key = Buffer.from(secret, "hex");

	if (!req.cookies || !req.cookies.OUTTA_ACCESS_TOKEN) {
		return {
			result: false,
			error: {
				code: "no_token",
				message: "No Token",
			},
		};
	}

	const token = await (async () => {
		try {
			return await jwtVerify<AccessTokenPayload>(
				req.cookies.OUTTA_ACCESS_TOKEN,
				key,
				{
					algorithms: ["HS256"],
					subject: "auth.access",
					issuer: "api.outta.ai",
					audience: "outta.ai/client",
				},
			);
		} catch (e) {
			return null;
		}
	})();

	if (!token) {
		return {
			result: false,
			error: {
				code: "invalid_token",
				message: "Invalid Token",
			},
		};
	}

	const payload: AccessTokenPayload = {
		member: token.payload.member,
		authentication: token.payload.authentication,
	};

	return {
		result: true,
		data: payload,
	};
}
