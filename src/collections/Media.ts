import type { CollectionConfig } from "payload/types";

const Media: CollectionConfig = {
	slug: "media",
	upload: {
		staticURL: "/media",
		staticDir: "/media/",
	},
	fields: [{ name: "alt", type: "text" }],
	access: {
		read: () => true,
	},
};

export default Media;
