import express from "express";
import payload from "payload";

import cookieParser from "cookie-parser";
import cors from "cors";

import outtaAuth from "./api/auth";
import outtaUser from "./api/user";

require("dotenv").config();

(async () => {
	const app = express();
	app.use(cookieParser());
	app.use(
		cors({
			credentials: true,
			origin: (_, callback) => callback(null, true),
		}),
	);

	if (!process.env.PAYLOAD_SECRET) {
		throw new Error("PAYLOAD_SECRET is required");
	}

	outtaAuth.config();

	// Initialize Payload
	await payload.init({
		secret: process.env.PAYLOAD_SECRET,
		express: app,
		onInit: async () => {
			payload.logger.info(
				`Payload Admin URL: ${process.env.BASE_URL}${payload.getAdminURL()}`,
			);
			payload.logger.info("Payload HMR URL: http://localhost:3002");
		},
	});

	// Add your own express routes here
	app.use("/outta/auth", outtaAuth.router);
	app.use("/outta/user", outtaUser.router);

	// Redirect root to Admin panel
	app.get("/", (_, res) => res.redirect("/admin"));
	app.listen(process.env.PORT || 3001);
})();
