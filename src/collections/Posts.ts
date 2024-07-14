import type {
	Access,
	CollectionConfig,
	FieldAccess,
	Where,
} from "payload/types";
import { TiptapEditor } from "../components/TiptapEditor";
import { checkAuth } from "../utils/auth";
import { checkBoardAccess, checkBoardAdminAccess } from "./Boards";

export const checkPostAccess =
	(action: "read" | "update" | "create" | "delete"): Access & FieldAccess =>
	async ({ req, id }) => {
		const { payload, user } = req;

		if (user) return true;

		const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
		if (!authResult.result) return false;

		if (id) {
			const post = await payload.findByID({
				collection: "posts",
				id,
			});

			const boardId =
				typeof post.board === "string" ? post.board : post.board?.id;

			const result = await checkBoardAccess({ req, id: boardId });

			if (typeof result !== "boolean" || !result) {
				return false;
			}

			if (action === "read" || action === "create") {
				return result;
			}

			const adminAccess = await checkBoardAdminAccess({ req, id: boardId });
			if (typeof adminAccess !== "boolean") {
				return false;
			}

			const author =
				typeof post.author === "string" ? post.author : post.author?.id;
			return author === authResult.data.member.id || adminAccess;
		}

		const filteredList = !id && req.query.where && action === "read";
		if (filteredList) {
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
					return checkBoardAccess({ req, id: boardId });
				}),
			);

			if (promises.length === 0) {
				return true;
			}

			return (
				promises.every((result) => result.status === "fulfilled") &&
				promises.some((result) => result.status === "fulfilled" && result.value)
			);
		}

		const createNew = !id && action === "create";
		if (createNew) {
			const boardId = req.body.board;

			if (!boardId) return false;

			const result = await checkBoardAccess({ req, id: boardId });

			return result as boolean;
		}

		return false;
	};

const Posts: CollectionConfig = {
	slug: "posts",
	access: {
		read: checkPostAccess("read"),
		create: checkPostAccess("create"),
		update: checkPostAccess("update"),
		delete: ({ req }) => !!req.user,
	},
	hooks: {
		beforeValidate: [
			async ({ req, operation, data }) => {
				if (req.user) return data;

				if (operation === "create") {
					const authResult = await checkAuth(
						req,
						process.env.PUBLIC_TOKEN_SECRET,
					);
					if (!authResult.result) return data;
					return { ...data, author: authResult.data.member.id };
				}

				return data;
			},
		],
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
			type: "date",
			name: "deletedAt",
			label: "삭제일",
		},
	],
};

export default Posts;
