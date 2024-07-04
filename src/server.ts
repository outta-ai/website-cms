import express from "express";
import payload from "payload";

import cookieParser from "cookie-parser";
import { Effect } from "effect";

import outtaAuth from "./api/auth";

require("dotenv").config();
// app.post("/api/outta/login", async (req, res) => {
// 	if (!process.env.TOKEN_SECRET) {
// 		res.status(500).send("Internal Server Error");
// 		return;
// 	}
// 	const secret = Buffer.from(process.env.TOKEN_SECRET, "hex");
// 	const verifyResult = await (async () => {
// 		try {
// 			return await jose.jwtVerify<{ provider: string; token: string }>(
// 				req.headers.authorization,
// 				secret,
// 				{
// 					algorithms: ["HS256"],
// 					subject: "auth.user",
// 					audience: "api.outta.ai",
// 					issuer: "outta.ai/server",
// 				},
// 			);
// 		} catch {
// 			return null;
// 		}
// 	})();

// 	if (!verifyResult) {
// 		return res.status(401).send({
// 			result: false,
// 			error: "Invalid Token",
// 		});
// 	}

// 	if (verifyResult.payload.provider === "google") {
// 		return google(req, res, verifyResult);
// 	}

// 	return res.status(400).send({
// 		result: false,
// 		error: "Unsupported Provider",
// 	});
// });

// app.post("/api/outta/refresh", async (req, res) => {
// 	if (!process.env.TOKEN_SECRET) {
// 		res.status(500).send("Internal Server Error");
// 		return;
// 	}
// 	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");
// 	const verifyResult = await (async () => {
// 		try {
// 			return await jose.jwtVerify<{ member: string }>(
// 				req.headers.authorization,
// 				secret,
// 				{
// 					algorithms: ["HS256"],
// 					subject: "auth.refresh",
// 					audience: "outta.ai/server",
// 					issuer: "api.outta.ai",
// 				},
// 			);
// 		} catch {
// 			return null;
// 		}
// 	})();

// 	if (!verifyResult) {
// 		return res.status(401).send({
// 			result: false,
// 			error: "Invalid Token",
// 		});
// 	}

// 	try {
// 		const member = await payload.findByID({
// 			collection: "members",
// 			id: verifyResult.payload.member,
// 		});

// 		return res.status(200).send(await createPublicToken(member));
// 	} catch (error) {
// 		return res.status(404).send({
// 			result: false,
// 			error: "Member not found",
// 		});
// 	}
// });

// app.get("/api/outta/me", async (req, res) => {
// 	if (!process.env.TOKEN_SECRET) {
// 		res.status(500).send("Internal Server Error");
// 		return;
// 	}
// 	const secret = Buffer.from(process.env.PUBLIC_TOKEN_SECRET, "hex");
// 	const verifyResult = await (async () => {
// 		try {
// 			return await jose.jwtVerify<{ member: string }>(
// 				req.headers.authorization,
// 				secret,
// 				{
// 					algorithms: ["HS256"],
// 					subject: "auth.access",
// 					audience: "outta.ai/client",
// 					issuer: "api.outta.ai",
// 				},
// 			);
// 		} catch (error) {
// 			console.error(error);
// 			return null;
// 		}
// 	})();

// 	if (!verifyResult) {
// 		return res.status(401).send({
// 			result: false,
// 			error: "Invalid Token",
// 		});
// 	}

// 	try {
// 		const member = await payload.findByID({
// 			collection: "members",
// 			id: verifyResult.payload.member,
// 		});

// 		console.log(member);

// 		return res.status(200).send({
// 			result: true,
// 			data: member,
// 		});
// 	} catch (error) {
// 		return res.status(404).send({
// 			result: false,
// 			error: "Member not found",
// 		});
// 	}
// });

const main = Effect.tryPromise(async () => {
	const app = express();

	// Initialize Payload
	await payload.init({
		secret: process.env.PAYLOAD_SECRET,
		express: app,
		onInit: async () => {
			payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
		},
	});

	app.use(cookieParser());

	// Add your own express routes here
	app.use(outtaAuth.router);
	outtaAuth.config();

	// Redirect root to Admin panel
	app.get("/", (_, res) => res.redirect("/admin"));
	app.listen(process.env.PORT || 3000);
});

Effect.runPromiseExit(main).then(console.log, console.error);
