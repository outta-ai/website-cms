import type { Request, Response } from "express";
import type { JWTVerifyResult } from "jose";
import payload from "payload";

import z from "zod";
import { createPublicToken } from "./utils";

const GoogleUserInfoResponse = z
	.object({
		id: z.string(),
		email: z.string(),
	})
	.passthrough();

export async function google(
	req: Request,
	res: Response,
	token: JWTVerifyResult<{ provider: string; token: string }>,
) {
	const googleToken = token.payload.token;

	const userInfo = await (async () => {
		try {
			const response = await fetch(
				"https://www.googleapis.com/userinfo/v2/me",
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${googleToken}`,
					},
				},
			);

			return GoogleUserInfoResponse.parse(await response.json());
		} catch (error) {
			return null;
		}
	})();

	if (!userInfo) {
		return res.status(400).send({
			result: false,
			error: "Failed to get user info",
		});
	}

	const memberByID = await payload.find({
		collection: "members",
		where: {
			googleId: {
				equals: userInfo.id,
			},
		},
	});

	if (memberByID.totalDocs === 1) {
		// @ts-ignore: Type error occurs here on build, since Member is generated build time
		return res.status(200).send(await createPublicToken(memberByID.docs[0]));
	}

	if (memberByID.totalDocs > 1) {
		console.error(
			"Multiple users found with the same Google ID",
			userInfo.id,
			memberByID.docs,
		);

		return res.status(500).send({
			result: false,
			error: "Internal Server Error occurred",
		});
	}

	const memberByEmail = await payload.find({
		collection: "members",
		where: {
			email: {
				equals: userInfo.email,
			},
		},
	});

	if (memberByEmail.totalDocs === 1) {
		// @ts-ignore: Type error occurs here on build, since Member is generated build time
		return res.status(200).send(await createPublicToken(memberByEmail.docs[0]));
	}

	if (memberByEmail.totalDocs > 1) {
		console.error(
			"Multiple users found with the same email",
			userInfo.email,
			memberByEmail.docs,
		);

		return res.status(500).send({
			result: false,
			error: "Internal Server Error occurred",
		});
	}

	return res.status(401).send({
		result: false,
		error: "User not found",
	});
}
