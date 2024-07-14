import type { Block } from "payload/types";
import { TiptapEditor } from "../components/TiptapEditor";

export const NoticeBlock: Block = {
	slug: "notice",
	interfaceName: "NoticeBlock",
	fields: [
		{
			type: "richText",
			name: "content",
			label: "공지",
			admin: { components: TiptapEditor },
		},
	],
};
