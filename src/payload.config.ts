import path from "path";

import { buildConfig } from "payload/config";

import { viteBundler } from "@payloadcms/bundler-vite";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";

import Admins from "./collections/Admins";
import Attachments from "./collections/Attachments";
import Boards from "./collections/Boards";
import LabPosts from "./collections/LabPosts";
import Media from "./collections/Media";
import Members from "./collections/Members";
import Posts from "./collections/Posts";
import Projects from "./collections/Projects";

import Comments from "./collections/Comments";
import Information from "./globals/info";
import WebsiteLab from "./globals/website-lab";
import Link from "./globals/website-link";
import WebsiteMain from "./globals/website-main";
import WebsitePlayground from "./globals/website-playground";

export default buildConfig({
	db: mongooseAdapter({
		url: process.env.MONGODB_URI || "",
		transactionOptions: {},
	}),
	editor: slateEditor({}),
	admin: {
		user: Admins.slug,
		// bundler: webpackBundler(),
		bundler: viteBundler({}),
		vite: (config) => ({
			...config,
			server: {
				...config.server,
				hmr: {
					port: 3002,
				},
			},
		}),
		css: path.resolve(__dirname, "styles/admin.css"),
	},
	collections: [
		Members,
		Admins,
		Media,
		Attachments,
		LabPosts,
		Projects,
		Boards,
		Posts,
		Comments,
	],
	globals: [WebsiteMain, WebsiteLab, WebsitePlayground, Information, Link],
	typescript: {
		outputFile: path.resolve(__dirname, "payload-types.ts"),
	},
});
