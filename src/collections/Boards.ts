import type { Access, CollectionConfig, FieldAccess } from "payload/types";
import { TiptapEditor } from "../components/TiptapEditor";
import { checkAuth } from "../utils/auth";

export const checkBoardAccess: Access & FieldAccess = async ({ req, id }) => {
	const { payload, user } = req;

	if (user) return true;

	if (!id) return false;

	const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
	if (!authResult.result) return false;

	const projects = await payload.find({
		collection: "projects",
		where: {
			"blocks.board": {
				equals: id,
			},
		},
	});

	if (projects.totalDocs === 0) {
		return false;
	}

	return projects.docs.some(
		(project) =>
			project.members?.find((member) =>
				typeof member.member === "string"
					? member.member === authResult.data.member.id
					: member.member?.id === authResult.data.member.id,
			) ||
			project.admins?.find((admin) =>
				typeof admin.admin === "string"
					? admin.admin === authResult.data.member.id
					: admin.admin?.id === authResult.data.member.id,
			),
	);
};

export const checkBoardAdminAccess: Access & FieldAccess = async ({
	req,
	id,
}) => {
	const { payload, user } = req;

	if (user) return true;

	if (!id) return false;

	const authResult = await checkAuth(req, process.env.PUBLIC_TOKEN_SECRET);
	if (!authResult.result) return false;

	const projects = await payload.find({
		collection: "projects",
		where: {
			"blocks.board": {
				equals: id,
			},
		},
	});

	if (projects.totalDocs === 0) {
		return false;
	}

	return projects.docs.some((project) =>
		project.admins?.find((admin) =>
			typeof admin.admin === "string"
				? admin.admin === authResult.data.member.id
				: admin.admin?.id === authResult.data.member.id,
		),
	);
};

const Boards: CollectionConfig = {
	slug: "boards",
	access: {
		read: () => true,
		create: () => true,
		update: () => true,
		delete: () => true,
	},
	labels: {
		singular: "유저 게시판",
		plural: "유저 게시판",
	},
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "title", "createdAt", "updatedAt"],
		group: "User Contents",
	},
	fields: [
		{
			type: "text",
			name: "title",
			label: "이름 (사용자 표시용)",
			required: true,
		},
		{
			type: "text",
			name: "name",
			label: "이름 (내부 확인용)",
			required: true,
		},
		{
			type: "richText",
			name: "description",
			label: "설명",
			admin: {
				components: TiptapEditor,
			},
		},
	],
};

export default Boards;
