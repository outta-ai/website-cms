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
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "works",
			type: "array",
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
