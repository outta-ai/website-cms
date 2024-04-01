import type { GlobalConfig } from "payload/types";

const WebsiteMain: GlobalConfig = {
	label: "메인 페이지",
	slug: "website-main",
	admin: {
		group: "Website",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "collapsible",
			label: "About Us",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "group",
					name: "about",
					label: "About Us",
					fields: [
						{
							type: "richText",
							name: "summary",
							label: "Summary",
							required: true,
						},
						{
							type: "richText",
							name: "description",
							label: "Description",
							required: true,
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "Core Values",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					name: "values",
					label: "Core Values",
					labels: {
						singular: "Core Value",
						plural: "Core Values",
					},
					type: "array",
					fields: [
						{
							name: "keyword",
							label: "Keyword",
							type: "text",
						},
						{
							name: "description",
							label: "Description",
							type: "textarea",
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "How We Do",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					name: "methods",
					label: "How We Do",
					type: "group",
					fields: [
						{
							type: "text",
							name: "summary",
							label: "Summary",
							required: true,
						},
						{
							type: "richText",
							name: "description",
							label: "Description",
							required: true,
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "Summary",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					name: "sumamry",
					label: "Summary",
					type: "group",
					fields: [
						{
							name: "contents",
							label: "Contents",
							type: "richText",
							required: true,
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "History",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					name: "history",
					label: "History",
					type: "array",
					fields: [
						{
							name: "year",
							type: "date",
							required: true,
						},
						{
							name: "title",
							type: "text",
							required: true,
						},
						{
							name: "description",
							type: "textarea",
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "Leaders",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					name: "board_members",
					label: "Board Members",
					labels: {
						singular: "Board Member",
						plural: "Board Members",
					},
					type: "array",
					fields: [
						{
							name: "member",
							type: "relationship",
							relationTo: "members",
							required: true,
						},
						{
							name: "position",
							type: "text",
							required: true,
						},
						{
							name: "description",
							label: "Description",
							type: "array",
							fields: [
								{
									name: "description",
									type: "text",
								},
							],
						},
					],
				},
				{
					name: "executive_members",
					label: "Executives",
					labels: {
						singular: "Executive",
						plural: "Executives",
					},
					type: "array",
					fields: [
						{
							name: "member",
							type: "relationship",
							relationTo: "members",
							required: true,
						},
						{
							name: "position",
							type: "text",
							required: true,
						},
						{
							name: "description",
							label: "Description",
							type: "array",
							fields: [
								{
									name: "description",
									type: "text",
								},
							],
						},
					],
				},
			],
		},
	],
};

export default WebsiteMain;
