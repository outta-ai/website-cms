import crypto from "node:crypto";

import type { Request, Response } from "express";

import {
	decryptCookie,
	DecryptCookieError,
	type DecryptCookieOptions,
	encryptCookie,
	EncryptCookieError,
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
	const verifier = crypto.randomBytes(64).toString("hex");
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
		sameSite: "strict",
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
	if (!(name in req.cookies) || !req.cookies[name]) {
		return null;
	}

	try {
		return decryptCookie(name, req, secret, options);
	} catch (e) {
		if (e instanceof DecryptCookieError) {
			return e;
		}
		return new Error(e);
	}
}
