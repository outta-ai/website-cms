import type { CollectionConfig } from "payload/types";

const LabPosts: CollectionConfig = {
	slug: "lab-posts",
	labels: {
		singular: "게시물",
		plural: "게시판",
	},
	admin: {
		useAsTitle: "title",
		group: "AI 연구소",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "text",
			name: "title",
			label: "제목",
			required: true,
		},
		{
			type: "text",
			name: "category",
			label: "분류",
			required: true,
		},
		{
			type: "richText",
			name: "content",
			label: "내용",
			required: true,
		},
		{
			type: "array",
			name: "attachments",
			label: "첨부파일",
			fields: [
				{
					type: "upload",
					name: "file",
					label: "파일",
					relationTo: "attachments",
					required: true,
				},
			],
		},
	],
};

export default LabPosts;
