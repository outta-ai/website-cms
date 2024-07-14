import type { CollectionConfig } from "payload/types";

const Members: CollectionConfig = {
	slug: "members",
	access: {
		read: () => true,
	},
	admin: {
		useAsTitle: "adminTitle",
		defaultColumns: ["name", "email"],
		group: "Users",
	},
	fields: [
		{
			type: "text",
			name: "name",
			label: "이름",
			required: true,
		},
		{
			type: "email",
			name: "email",
			label: "이메일",
		},
		{
			type: "text",
			name: "googleId",
			label: "구글 ID",
		},
		{
			type: "array",
			name: "works",
			label: "이력",
			fields: [
				{
					name: "description",
					type: "text",
				},
			],
		},
		{
			type: "upload",
			name: "profile",
			relationTo: "media",
		},
		{
			type: "text",
			name: "adminTitle",
			admin: {
				hidden: true,
			},
			hooks: {
				beforeChange: [
					({ siblingData }) => {
						if ("adminTitle" in siblingData) {
							siblingData.adminTitle = undefined;
						}
					},
				],
				afterRead: [
					({ data }) => {
						return `${data?.name || "(이름 없음)"} (${data?.email || "이메일 없음"})`;
					},
				],
			},
		},
		{
			type: "textarea",
			name: "memo",
			label: "메모",
		},
	],
};

export default Members;
