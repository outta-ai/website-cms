import type { GlobalConfig } from "payload/types";

const WebsiteLab: GlobalConfig = {
	label: "AI 연구소",
	slug: "website-lab",
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

export default WebsiteLab;
