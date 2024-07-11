import type { Block } from "payload/types";

export const BoardBlock: Block = {
	slug: "board",
	interfaceName: "BoardBlock",
	fields: [
		{
			type: "relationship",
			relationTo: "boards",
			name: "board",
			label: "게시판",
			required: true,
		},
	],
	custom: {},
};
