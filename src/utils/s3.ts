import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { File } from "./getFiles";

export function getS3Client() {
	const credentials =
		!!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY
			? {
					accessKeyId: process.env.S3_ACCESS_KEY_ID,
					secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
				}
			: undefined;

	return typeof window === "undefined" && process.env.S3_REGION
		? new S3Client({
				region: process.env.S3_REGION,
				credentials,
				endpoint: process.env.S3_ENDPOINT,
			})
		: undefined;
}

function roundTime(minutes?: number) {
	const currentTime = new Date();

	if (minutes === undefined) {
		return currentTime;
	}

	currentTime.setMilliseconds(0);
	currentTime.setSeconds(0);
	currentTime.setMinutes(
		Math.floor(currentTime.getMinutes() / minutes) * minutes,
	);

	return currentTime;
}

type S3GetArgs = {
	client: S3Client;
	bucket: string;
	key: string;
	roundMinutes?: number;
	expiresIn?: number;
};

export async function S3Get({
	client,
	bucket,
	key,
	expiresIn,
	roundMinutes,
}: S3GetArgs): Promise<string> {
	const expires = expiresIn || 5 * 60;
	const command = new GetObjectCommand({ Bucket: bucket, Key: key });
	return await getSignedUrl(client, command, {
		expiresIn: expires,
		signingDate: roundTime(roundMinutes),
	});
}

type S3CreateArgs = {
	client: S3Client;
	file: File;
	bucket: string;
	key: string;
};

export async function S3Create({ client, file, bucket, key }: S3CreateArgs) {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		Body: file.buffer,
		ContentType: file.mimeType,
	});
	return await client.send(command);
}

type S3DeleteArgs = {
	client: S3Client;
	bucket: string;
	key: string;
};

export async function S3Delete({ client, bucket, key }: S3DeleteArgs) {
	const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
	return await client.send(command);
}
