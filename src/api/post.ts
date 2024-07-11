import express, { Router } from "express";

import cookieParser from "cookie-parser";
import cors from "cors";

import type { PayloadRequest } from "payload/types";

import payload from "payload";
import type { Post } from "payload/generated-types";
import { z } from "zod";
import { checkAuth } from "../utils/auth";

type Comment = Post["comments"] extends (infer T)[] | null | undefined
	? T
	: never;

const router = Router();

router.use(cookieParser());
router.use(express.json());
router.use(
	cors({
		credentials: true,
		origin: (_, callback) => callback(null, true),
	}),
);

const PatchCommentRequest = z.object({
	content: z.string(),
});

router.patch("/:pid/comment/:cid", async (req, res) => {
	if (!process.env.PAYLOAD_SECRET) {
		return res.status(500).send({
			result: false,
			error: {
				code: "no_secret",
				message: "No Secret",
			},
		});
	}

	const secret = process.env.PUBLIC_TOKEN_SECRET;
	if (!secret) {
		return res.status(500).send({
			result: false,
			error: {
				code: "no_secret",
				message: "No Secret",
			},
		});
	}

	const authResult = await checkAuth(req, secret);
	if (!authResult.result) {
		if (authResult.error.code === "no_secret") {
			return res.status(500).send(authResult);
		}
		if (authResult.error.code === "no_token") {
			return res.status(401).send(authResult);
		}
		if (authResult.error.code === "invalid_token") {
			return res.status(403).send(authResult);
		}
		return res.status(500).send(authResult);
	}

	const parseResult = PatchCommentRequest.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).send({
			result: false,
			error: {
				code: "invalid_request",
				message: "Invalid Request",
				details: parseResult.error.errors,
			},
		});
	}
	const body = parseResult.data;

	if (typeof payload.db.beginTransaction === "undefined") {
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "Internal Error",
			},
		});
	}

	const payloadReq = {} as PayloadRequest;
	payloadReq.transactionID = (await payload.db.beginTransaction()) ?? undefined;
	try {
		const post = await payload.findByID({
			req: payloadReq,
			collection: "posts",
			id: req.params.pid,
		});

		const comment = post.comments?.find((c) => c.id === req.params.cid);
		if (!comment) {
			throw res.status(404).send({
				result: false,
				error: {
					code: "not_found",
					message: "Comment not found",
				},
			});
		}

		const author =
			typeof comment.author === "string" ? comment.author : comment.author?.id;
		if (author !== authResult.data.member.id) {
			throw res.status(403).send({
				result: false,
				error: {
					code: "forbidden",
					message: "Forbidden",
				},
			});
		}

		const updatedComment: Comment = {
			...comment,
			content: body.content,
			updatedAt: new Date().toISOString(),
		};

		await payload.update({
			req: payloadReq,
			collection: "posts",
			id: req.params.pid,
			data: {
				comments: post.comments?.map((c) =>
					c.id === req.params.cid ? updatedComment : c,
				),
			},
		});

		if (payloadReq.transactionID) {
			await payload.db.commitTransaction?.(payloadReq.transactionID);
		}
	} catch (e) {
		if (payloadReq.transactionID) {
			await payload.db.rollbackTransaction?.(payloadReq.transactionID);
		}

		if (e instanceof Response) {
			return e;
		}

		console.error(e);
		return res.status(500).send({
			result: false,
			error: {
				code: "internal_error",
				message: "Internal Error",
			},
		});
	}
});
