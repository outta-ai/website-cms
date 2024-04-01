// biome-ignore lint/style/useNodejsImportProtocol: This should import path from "path" to avoid issues with browser bundles
import path from "path";

import { buildConfig } from "payload/config";

import { viteBundler } from "@payloadcms/bundler-vite";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";

import Admins from "./collections/Admins";
import Media from "./collections/Media";
import Members from "./collections/Members";

import WebsiteLab from "./globals/website-lab";
import WebsiteMain from "./globals/website-main";
import WebsitePlayground from "./globals/website-playground";

export default buildConfig({
	db: mongooseAdapter({
		url: process.env.MONGODB_URI,
	}),
	editor: slateEditor({}),
	admin: {
		user: Admins.slug,
		// bundler: webpackBundler(),
		bundler: viteBundler({}),
		css: path.resolve(__dirname, "styles/admin.css"),
	},
	collections: [Members, Admins, Media],
	globals: [WebsiteMain, WebsiteLab, WebsitePlayground],
	typescript: {
		outputFile: path.resolve(__dirname, "payload-types.ts"),
	},
	plugins: [],
});
