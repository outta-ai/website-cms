import type { CollectionConfig } from "payload/types";

const Members: CollectionConfig = {
	slug: "members",
	access: {
		read: () => true,
	},
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name"],
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
	],
};

export default Members;
