import type { FileData, PayloadRequest } from "payload/types";

export type File = {
	buffer: Buffer;
	filename: string;
	filesize: number;
	width: number;
	height: number;
	mimeType: string;
	tempFilePath?: string;
	object?: string;
};

type Arguments = {
	data: Partial<FileData>;
	req: PayloadRequest;
};

export function getFiles({ data, req }: Arguments) {
	const file = req.files?.file;

	const files: File[] = [];

	if (!file || !data.filename || !data.mimeType) {
		return [];
	}

	const mainFile: File = {
		buffer: file.data,
		filename: data.filename,
		filesize: file.size,
		width: file.width,
		height: file.height,
		mimeType: data.mimeType,
		tempFilePath: file.tempFilePath,
	};

	files.push(mainFile);

	if (!data?.sizes) {
		return files;
	}

	for (const [key, resizedFileData] of Object.entries(data.sizes)) {
		if (req.payloadUploadSizes?.[key] && data.mimeType) {
			files.push({
				buffer: req.payloadUploadSizes[key],
				filename: resizedFileData.filename as string,
				filesize: req.payloadUploadSizes[key].length,
				width: resizedFileData.width as number,
				height: resizedFileData.height as number,
				mimeType: data.mimeType,
			});
		}
	}

	return files;
}
