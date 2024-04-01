import type { GlobalConfig } from "payload/types";

const WebsitePlayground: GlobalConfig = {
	label: "AI Playground",
	slug: "website-playground",
	admin: {
		group: "Website",
	},
	fields: [
		{
			type: "collapsible",
			label: "메인 페이지",
			fields: [
				{
					type: "group",
					name: "index",
					label: "메인 페이지",
					fields: [],
				},
			],
		},
	],
};

export default WebsitePlayground;
