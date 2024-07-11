import type {
	Access,
	CollectionConfig,
	FieldAccess,
	Where,
} from "payload/types";
import { TiptapEditor } from "../components/TiptapEditor";
import { checkBoardAccess, checkBoardAdminAccess } from "./Boards";

const checkPostAccess =
	(action: "read" | "update" | "create" | "delete"): Access & FieldAccess =>
	async ({ req, id }) => {
		const { payload, user } = req;

		if (user) return true;

		if (id) {
			const post = await payload.findByID({
				collection: "posts",
				id,
			});

			const boardId =
				typeof post.board === "string" ? post.board : post.board?.id;

			const result = await checkBoardAccess({ req, id: boardId });

			if (typeof result !== "boolean") {
				return false;
			}

			if (action === "read") {
				return result;
			}

			const adminAccess = await checkBoardAdminAccess({ req, id: boardId });
			if (typeof adminAccess !== "boolean") {
				return false;
			}

			return post.author === user?.id || adminAccess;
		}

		if (!id && req.query.where) {
			const where = req.query.where as Where;
			const limit = Number(req.query.limit);
			const page = Number(req.query.page);

			const posts = await payload.find({
				collection: "posts",
				where,
				limit: Number.isNaN(limit) ? undefined : limit,
				page: Number.isNaN(page) ? undefined : page,
			});

			const promises = await Promise.allSettled(
				posts.docs.map((post) => {
					const boardId =
						typeof post.board === "string" ? post.board : post.board?.id;
					const check =
						action === "read" ? checkBoardAccess : checkBoardAdminAccess;
					return check({ req, id: boardId });
				}),
			);

			if (action === "read") {
				return (
					promises.every((result) => result.status === "fulfilled") &&
					promises.some(
						(result) => result.status === "fulfilled" && result.value,
					)
				);
			}
		}

		return false;
	};

const Posts: CollectionConfig = {
	slug: "posts",
	access: {
		read: checkPostAccess("read"),
		create: checkPostAccess("create"),
		update: checkPostAccess("update"),
		delete: checkPostAccess("delete"),
	},
	labels: {
		singular: "유저 게시물",
		plural: "유저 게시물",
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["board", "title", "createdAt", "updatedAt", "author"],
		group: "User Contents",
	},
	fields: [
		{
			type: "text",
			name: "title",
			label: "제목",
			required: true,
		},
		{
			type: "richText",
			name: "content",
			label: "내용",
			admin: {
				components: TiptapEditor,
			},
		},
		{
			type: "relationship",
			name: "author",
			label: "작성자",
			relationTo: "members",
			required: true,
		},
		{
			type: "relationship",
			name: "board",
			label: "게시판",
			relationTo: "boards",
			required: true,
		},
		{
			type: "array",
			name: "comments",
			label: "댓글",
			fields: [
				{
					type: "textarea",
					name: "content",
					label: "내용",
				},
				{
					type: "relationship",
					name: "author",
					label: "작성자",
					relationTo: "members",
					required: true,
				},
				{
					type: "date",
					name: "createdAt",
					label: "작성일",
					required: true,
					defaultValue: () => new Date(),
					admin: {
						date: {
							pickerAppearance: "dayAndTime",
						},
					},
				},
				{
					type: "date",
					name: "updatedAt",
					label: "최종 수정일",
					required: true,
					defaultValue: () => new Date(),
					admin: {
						date: {
							pickerAppearance: "dayAndTime",
						},
					},
				},
			],
		},
	],
};

export default Posts;
