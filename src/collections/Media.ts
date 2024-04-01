import crypto from "node:crypto";
import path from "node:path";

import { APIError } from "payload/errors";
import type {
	CollectionAfterDeleteHook,
	CollectionAfterReadHook,
	CollectionBeforeChangeHook,
	CollectionConfig,
	FileData,
	TypeWithID,
} from "payload/types";

import { S3Client } from "@aws-sdk/client-s3";
import { getFiles, type File } from "../utils/getFiles";
import { S3Create, S3Delete, S3Get } from "../utils/s3";

type S3FileData = FileData &
	TypeWithID & {
		object: string;
	};

// Rename Filename before upload
const beforeChange: CollectionBeforeChangeHook<S3FileData> = async ({
	data,
	req,
	originalDoc,
}) => {
	const bucket = process.env.S3_BUCKET;
	const client = new S3Client({
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID,
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
		},
		region: process.env.S3_REGION,
		endpoint: process.env.S3_ENDPOINT,
	});

	const files = getFiles({ data, req });

	if (!files.length) {
		return data;
	}

	if (originalDoc) {
		const originalFiles: string[] = [];

		if (typeof originalDoc.filename === "string") {
			originalFiles.push(originalDoc.object);
		} else if (typeof originalDoc.filename === "object") {
			originalFiles.push(
				...Object.values(originalDoc.sizes).map(
					(resizedFileData) => resizedFileData?.filename,
				),
			);
		}

		const result = await Promise.allSettled(
			originalFiles.map((filename) =>
				S3Delete({ client, bucket, key: filename }),
			),
		);

		if (result.some((r) => r.status === "rejected")) {
			throw new APIError(
				"Failed to delete original files",
				500,
				undefined,
				true,
			);
		}
	}

	const uploadedFiles: File[] = [];
	for (const file of files) {
		const ext = path.extname(file.filename);
		const uuid = crypto.randomUUID();
		const filename = `${uuid}${ext}`;

		try {
			await S3Create({ client, file, bucket, key: filename });
			uploadedFiles.push({ ...file, object: filename });
		} catch (e: unknown) {
			throw new APIError("Failed to upload file", 500, undefined, true);
		}
	}

	const finalData: S3FileData = {
		id: data.id,
		filename: uploadedFiles[0].filename,
		filesize: uploadedFiles[0].filesize,
		mimeType: uploadedFiles[0].mimeType,
		width: uploadedFiles[0].width,
		height: uploadedFiles[0].height,
		sizes: {},
		object: uploadedFiles[0].object,
	};

	for (const file of uploadedFiles.slice(1)) {
		finalData.sizes[file.filename] = {
			filename: file.object,
			filesize: file.filesize,
			mimeType: file.mimeType,
			width: file.width,
			height: file.height,
		};
	}

	return finalData;
};

// Generate signed URLs after read
const afterRead: CollectionAfterReadHook<S3FileData> = async ({ doc }) => {
	if (!doc.filename) {
		return doc;
	}

	const bucket = process.env.S3_BUCKET;
	const client = new S3Client({
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID,
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
		},
		region: process.env.S3_REGION,
		endpoint: process.env.S3_ENDPOINT,
	});

	const signedURL = await S3Get({
		client,
		bucket,
		key: doc.object,
		expiresIn: 15 * 60,
		roundMinutes: 5,
	});

	return {
		...doc,
		url: signedURL,
	};
};

// Handle file deletion
const afterDelete: CollectionAfterDeleteHook<S3FileData> = async ({ doc }) => {
	const bucket = process.env.S3_BUCKET;
	const client = new S3Client({
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID,
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
		},
		region: process.env.S3_REGION,
		endpoint: process.env.S3_ENDPOINT,
	});

	const originalFiles: string[] = [];

	if (typeof doc.filename === "string") {
		originalFiles.push(doc.object);
	} else if (typeof doc.filename === "object") {
		originalFiles.push(
			...Object.values(doc.sizes).map(
				(resizedFileData) => resizedFileData?.filename,
			),
		);
	}

	const result = await Promise.allSettled(
		originalFiles.map((filename) =>
			S3Delete({ client, bucket, key: filename }),
		),
	);

	if (result.some((r) => r.status === "rejected")) {
		throw new APIError("Failed to delete original files", 500, undefined, true);
	}
};

const Media: CollectionConfig = {
	slug: "media",
	upload: {
		staticURL: "/media",
		staticDir: "/tmp",
	},
	hooks: {
		beforeChange: [beforeChange],
		afterRead: [afterRead],
		afterDelete: [afterDelete],
	},
	fields: [
		{ name: "alt", type: "text" },
		{ name: "object", type: "text", admin: { hidden: true } },
	],
	access: {
		read: () => true,
	},
};

export default Media;
