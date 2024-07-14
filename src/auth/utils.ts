import crypto from "node:crypto";

import { SignJWT } from "jose";
import type { Member } from "payload/generated-types";

export async function createPublicToken(member: Member) {
	if (!process.env.PUBLIC_TOKEN_SECRET) {
		throw new Error("PUBLIC_TOKEN_SECRET is not defined");
	}

	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");
	const access_token = await new SignJWT({
		member: member.id,
		nonce: crypto.randomUUID(),
	})
		.setAudience("outta.ai/client")
		.setIssuer("api.outta.ai")
		.setExpirationTime("1hr")
		.setProtectedHeader({ alg: "HS256" })
		.setSubject("auth.access")
		.sign(secret);

	const refresh_token = await new SignJWT({
		member: member.id,
		nonce: crypto.randomUUID(),
	})
		.setAudience("outta.ai/server")
		.setIssuer("api.outta.ai")
		.setExpirationTime("7d")
		.setProtectedHeader({ alg: "HS256" })
		.setSubject("auth.refresh")
		.sign(secret);

	return { result: true, token: { access_token, refresh_token } };
}
