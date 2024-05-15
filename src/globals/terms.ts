import type { GlobalConfig } from "payload/types";

const Terms: GlobalConfig = {
	label: "이용약관",
	slug: "terms",
	admin: {
		group: "Website",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "textarea",
			name: "contents",
			label: "이용약관",
		},
	],
};

export default Terms;
