import type {
	Access,
	CollectionConfig,
	FieldAccess,
	Where,
} from "payload/types";
import { checkAuth } from "../utils/auth";
import { checkPostAccess } from "./Posts";

const checkCommentAccess =
	(action: "read" | "update" | "create" | "delete"): Access & FieldAccess =>
	async ({ req, id }) => {
		const { payload, user } = req;

		if (user) return true;

		const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
		if (!authResult.result) return false;

		if (id) {
			const comment = await payload.findByID({
				collection: "comments",
				id,
			});

			if (comment.deletedAt) return false;

			const postId =
				typeof comment.post === "string" ? comment.post : comment.post?.id;
			const result = await checkPostAccess("read")({ req, id: postId });

			if (typeof result !== "boolean" || !result) {
				return false;
			}

			if (action === "read") {
				return result;
			}

			const author =
				typeof comment.author === "string"
					? comment.author
					: comment.author?.id;
			return author === authResult.data.member.id;
		}

		if (!id && req.query.where && action === "read") {
			const where = req.query.where as Where;
			const limit = Number(req.query.limit);
			const page = Number(req.query.page);

			const comments = await payload.find({
				collection: "comments",
				where,
				limit: Number.isNaN(limit) ? undefined : limit,
				page: Number.isNaN(page) ? undefined : page,
			});

			const promises = await Promise.allSettled(
				comments.docs.map(async (comment) => {
					const postId =
						typeof comment.post === "string" ? comment.post : comment.post?.id;

					return checkPostAccess("read")({ req, id: postId });
				}),
			);

			if (promises.length === 0) {
				return true;
			}

			const result =
				promises.every((result) => result.status === "fulfilled") &&
				promises.some(
					(result) => result.status === "fulfilled" && result.value,
				);

			return result;
		}

		return false;
	};

const checkCommentWriteAccess: Access = async ({ req, id }) => {
	const { user } = req;

	if (user) return true;

	const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
	if (!authResult.result) return false;

	if (id) {
		return false;
	}

	const postId = req.body.post;
	if (!postId) {
		return false;
	}

	return checkPostAccess("read")({ req, id: postId });
};

const Comments: CollectionConfig = {
	slug: "comments",
	access: {
		read: checkCommentAccess("read"),
		create: checkCommentWriteAccess,
		update: checkCommentAccess("update"),
		delete: ({ req }) => !!req.user,
	},
	hooks: {
		beforeOperation: [
			async ({ req, operation, args }) => {
				if (req.user) return args;

				if (operation === "read" || operation === "count") {
					args.where = { ...args.where, deletedAt: { exists: false } };
				}

				if (operation === "create") {
					const authResult = await checkAuth(
						req,
						process.env.PUBLIC_TOKEN_SECRET,
					);
					if (!authResult.result) return args;
					args.author = authResult.data.member.id;
				}

				return args;
			},
		],
	},
	labels: {
		singular: "유저 댓글",
		plural: "유저 댓글",
	},
	admin: {
		group: "User Contents",
	},
	fields: [
		{
			type: "textarea",
			name: "content",
			label: "내용",
		},
		{
			type: "relationship",
			name: "author",
			relationTo: "members",
			label: "작성자",
			required: true,
		},
		{
			type: "relationship",
			name: "post",
			relationTo: "posts",
			label: "게시물",
			required: true,
		},
		{
			type: "date",
			name: "deletedAt",
			label: "삭제일",
		},
	],
};

export default Comments;
