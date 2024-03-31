import type { CollectionConfig } from "payload/types";

const Admins: CollectionConfig = {
	slug: "admins",
	auth: true,
	admin: {
		useAsTitle: "email",
		group: "Users",
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
	],
};

export default Admins;
