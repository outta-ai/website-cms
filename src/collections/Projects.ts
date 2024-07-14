import type {
	Access,
	CollectionConfig,
	FieldAccess,
	Where,
} from "payload/types";
import { z } from "zod";
import { BoardBlock } from "../blocks/BoardBlock";
import { checkAuth } from "../utils/auth";

const AliasWhereQuery = z.object({
	where: z.object({
		link: z.object({
			equals: z.string(),
		}),
		category: z.object({
			equals: z.string(),
		}),
	}),
});

const createAccess =
	(userType: "member" | "admin"): Access & FieldAccess =>
	async ({ req, id }) => {
		const { payload, query, user } = req;

		// Allow for admin
		if (user) return true;

		const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
		if (!authResult.result) return false;

		const where: Where = {};

		const memberId = authResult.data.member.id;
		if (id) where.id = { equals: id };

		const parseResult = AliasWhereQuery.safeParse(query);
		if (parseResult.success) {
			where.link = parseResult.data.where.link;
			where.category = parseResult.data.where.category;
		}

		where.or = [{ "admins.admin.id": { equals: memberId } }];
		if (userType === "member") {
			where.or.push({ "members.member.id": { equals: memberId } });
		}

		const project = await payload.find({
			collection: "projects",
			where,
		});

		return project.totalDocs > 0;
	};

const Projects: CollectionConfig = {
	slug: "projects",
	access: { read: createAccess("member"), update: createAccess("member") },
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "description", "category"],
		group: "Users",
	},
	fields: [
		{
			type: "text",
			name: "name",
			label: "이름",
			required: true,
		},
		{
			type: "textarea",
			name: "description",
			label: "설명",
		},
		{
			type: "text",
			name: "link",
			label: "링크",
			async validate(value, { data, payload }) {
				if (!value || !payload) {
					return true as const;
				}

				const result = await payload.find({
					collection: "projects",
					where: {
						link: {
							equals: value,
						},
						category: {
							equals: data.category,
						},
						id: { not_equals: data.id },
					},
				});

				if (result.totalDocs > 0) {
					return "이미 존재하는 링크입니다.";
				}

				return true as const;
			},
		},
		{
			type: "select",
			name: "category",
			label: "카테고리",
			required: true,
			options: [
				{ label: "AI 연구소", value: "labs" },
				{ label: "AI Playground", value: "playground" },
				{ label: "OUTTA", value: "outta" },
			],
		},
		{
			type: "array",
			name: "admins",
			label: "관리자",
			fields: [
				{
					type: "relationship",
					name: "admin",
					label: "관리자",
					relationTo: "members",
				},
			],
			access: { read: createAccess("admin") },
		},
		{
			type: "array",
			name: "members",
			label: "멤버",
			fields: [
				{
					type: "relationship",
					name: "member",
					label: "멤버",
					relationTo: "members",
				},
			],
			access: { read: createAccess("admin") },
		},
		{
			type: "blocks",
			name: "blocks",
			label: "컨텐츠",
			blocks: [BoardBlock],
		},
	],
};

export default Projects;
