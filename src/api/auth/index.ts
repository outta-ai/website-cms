import { Router } from "express";
import * as providers from "./providers";

const router = Router();

router.get("/outta/auth/:provider", async (req, res) => {
	console.log(req.cookies);
	const provider = req.params.provider;

	if (provider in providers) {
		return providers[provider].signIn(req, res);
	}

	return res.status(400).send({
		result: false,
		error: {
			code: "unsupported_provider",
			message: `Unsupported Provider "${provider}"`,
		},
	});
});

router.get("/outta/auth/:provider/callback", async (req, res) => {
	const provider = req.params.provider;

	if (provider in providers) {
		return providers[provider].callback(req, res);
	}

	return res.status(400).send({
		result: false,
		error: {
			code: "unsupported_provider",
			message: `Unsupported Provider "${provider}"`,
		},
	});
});

router.get("/outta/auth/refresh", async (req, res) => {});

const config = () => {
	for (const provider in providers) {
		providers[provider].config();
	}
};

export default { config, router };
