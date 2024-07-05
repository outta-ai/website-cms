import express from "express";
import payload from "payload";

import outtaAuth from "./api/auth";

require("dotenv").config();

(async () => {
	const app = express();

	outtaAuth.config();

	// Initialize Payload
	await payload.init({
		secret: process.env.PAYLOAD_SECRET,
		express: app,
		onInit: async () => {
			payload.logger.info(
				`Payload Admin URL: ${process.env.BASE_URL}${payload.getAdminURL()}`,
			);
		},
	});

	// Add your own express routes here
	app.use("/outta/auth", outtaAuth.router);

	// Redirect root to Admin panel
	app.get("/", (_, res) => res.redirect("/admin"));
	app.listen(process.env.PORT || 3001);
})();
