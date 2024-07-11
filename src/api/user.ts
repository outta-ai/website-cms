import { Router } from "express";

import cookieParser from "cookie-parser";
import cors from "cors";

import payload from "payload";

import { checkAuth } from "../utils/auth";

const router = Router();
router.use(cookieParser());
router.use(
	cors({
		credentials: true,
		origin: (_, callback) => callback(null, true),
	}),
);

router.get("/me", async (req, res) => {
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
	return res.status(200).send({
		result: true,
		data: authResult.data.member,
	});
});

router.get("/me/projects", async (req, res) => {
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

	const projects = await payload.find({
		collection: "projects",
		where: {
			or: [
				{
					"admins.admin.id": {
						equals: authResult.data.member.id,
					},
				},
				{
					"members.member.id": {
						equals: authResult.data.member.id,
					},
				},
			],
		},
	});

	const data = projects.docs.map((project) => ({
		id: project.id,
		name: project.name,
		category: project.category,
		link: project.link,
		admin:
			project.admins?.some((admin) => {
				if (typeof admin === "string" || typeof admin.admin === "string") {
					return false;
				}
				return admin.admin?.id === authResult.data.member.id;
			}) ?? false,
	}));

	return res.status(200).send({
		result: true,
		data,
	});
});

export default { router };
