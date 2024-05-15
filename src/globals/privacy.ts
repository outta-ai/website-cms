import type { GlobalConfig } from "payload/types";

const Privacy: GlobalConfig = {
	label: "개인정보취급방침",
	slug: "privacy",
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
			label: "개인정보취급방침",
		},
	],
};

export default Privacy;
