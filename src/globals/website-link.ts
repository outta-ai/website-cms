import type { GlobalConfig } from "payload/types";

const Link: GlobalConfig = {
	label: "Linktree",
	slug: "links",
	admin: {
		group: "Website",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "array",
			name: "sites",
			labels: {
				singular: "사이트",
				plural: "사이트",
			},
			fields: [
				{
					type: "text",
					name: "title",
					label: "제목",
					required: true,
				},
				{
					type: "text",
					name: "path",
					label: "경로",
					required: true,
				},
				{
					type: "array",
					name: "links",
					labels: {
						singular: "링크",
						plural: "링크",
					},
					fields: [
						{
							type: "text",
							name: "title",
							label: "제목",
							required: true,
						},
						{
							type: "text",
							name: "url",
							label: "URL",
							required: true,
						},
					],
				},
			],
		},
	],
};

export default Link;
