import type { GlobalConfig } from "payload/types";

const Information: GlobalConfig = {
	label: "단체 정보",
	slug: "info",
	admin: {
		group: "Website",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "collapsible",
			label: "기본 정보",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "text",
					name: "name",
					label: "단체 이름",
					required: true,
				},
				{
					type: "text",
					name: "address",
					label: "주소",
					required: true,
				},
				{
					type: "text",
					name: "registrationNumber",
					label: "사업자등록번호 또는 고유번호",
				},
				{
					type: "text",
					name: "email",
					label: "이메일",
					required: true,
				},
				{
					type: "relationship",
					name: "manager",
					label: "개인정보관리자",
					relationTo: "members",
					required: true,
				},
			],
		},
		{
			type: "collapsible",
			label: "이용약관",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "textarea",
					name: "terms",
					label: "이용약관",
				},
			],
		},
		{
			type: "collapsible",
			label: "개인정보취급방침",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "textarea",
					name: "privacy",
					label: "개인정보취급방침",
				},
			],
		},
		{
			type: "collapsible",
			label: "하단 링크",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "array",
					name: "bottom",
					label: "하단 링크",
					fields: [
						{
							type: "text",
							name: "name",
							label: "링크 이름",
							required: true,
						},
						{
							type: "text",
							name: "url",
							label: "링크 URL",
							required: true,
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "소셜 링크",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "array",
					name: "social",
					label: "소셜 링크",
					fields: [
						{
							type: "text",
							name: "name",
							label: "링크 이름",
							required: true,
						},
						{
							type: "text",
							name: "url",
							label: "링크 URL",
							required: true,
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "관련 사이트",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "array",
					name: "external",
					label: "외부 링크",
					fields: [
						{
							type: "text",
							name: "name",
							label: "링크 이름",
							required: true,
						},
						{
							type: "text",
							name: "url",
							label: "링크 URL",
							required: true,
						},
					],
				},
			],
		},
	],
};

export default Information;
