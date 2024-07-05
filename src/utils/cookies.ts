import type { Request } from "express";

import { Buffer } from "node:buffer";
import crypto from "node:crypto";

export type DecryptCookieOptions = { hashKey?: boolean };

export class DecryptCookieError extends Error {
	type: "invalid_key" | "no_cookie" | "invalid_cookie";
	internal?: string | Error;

	constructor(
		type: "invalid_key" | "no_cookie" | "invalid_cookie",
		internal?: string | Error,
	) {
		super(`Failed to get encrypted cookie: ${type}`);

		this.type = type;
		this.internal = internal;
	}

	toString() {
		return `DecryptCookieError: ${this.type}${this.internal?.toString() || ""}`;
	}
}

export const decryptCookie = (
	name: string,
	req: Request,
	secret: string,
	option: DecryptCookieOptions,
) => {
	const key = (() => {
		if (option?.hashKey) {
			const cipher = crypto.createHash("sha256");
			cipher.update(secret);
			return cipher.digest();
		}

		const key = Buffer.from(secret, "hex");
		if (key.length * 8 !== 256) {
			throw new DecryptCookieError("invalid_key");
		}
		return key;
	})();

	const cookie = req.cookies;
	if (!(name in cookie)) {
		throw new DecryptCookieError("no_cookie");
	}

	const params = cookie[name].split(".");
	if (params.length !== 3) {
		throw new DecryptCookieError("invalid_cookie");
	}

	const authTag = Buffer.from(params[1], "hex");
	if (authTag.length !== 16) {
		throw new DecryptCookieError("invalid_cookie", "authTag");
	}

	const iv = Buffer.from(params[2], "hex");
	if (iv.length !== 16) {
		throw new DecryptCookieError("invalid_cookie", "iv");
	}

	try {
		const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);

		const decrypted =
			decipher.update(params[0], "hex", "utf8") + decipher.final("utf8");
		return decrypted;
	} catch (error) {
		throw new DecryptCookieError("invalid_cookie", error);
	}
};

export type EncryptCookieOptions = { hashKey?: boolean };

export class EncryptCookieError extends Error {
	type: "invalid_key" | "encrypt_failed";
	internal?: string | Error;

	constructor(
		type: "invalid_key" | "encrypt_failed",
		internal?: string | Error,
	) {
		super(`Failed to get encrypted cookie: ${type}`);

		this.type = type;
		this.internal = internal;
	}

	toString() {
		return `EncryptCookieError: ${this.type}${this.internal?.toString() || ""}`;
	}
}

export const encryptCookie = (
	value: string,
	secret: string,
	option?: EncryptCookieOptions,
) => {
	const key = (() => {
		if (option?.hashKey) {
			const cipher = crypto.createHash("sha256");
			cipher.update(secret);
			return cipher.digest();
		}

		const key = Buffer.from(secret, "hex");
		if (key.length * 8 !== 256) {
			return new EncryptCookieError("invalid_key");
		}
		return key;
	})();

	if (key instanceof EncryptCookieError) {
		return key;
	}

	try {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
		const encrypted =
			cipher.update(value, "utf-8", "hex") + cipher.final("hex");
		const authTag = cipher.getAuthTag().toString("hex");

		return `${encrypted}.${authTag}.${iv.toString("hex")}`;
	} catch (error) {
		return new EncryptCookieError("encrypt_failed", error);
	}
};
