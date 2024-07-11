import { StarterKit, type StarterKitOptions } from "@tiptap/starter-kit";

type CreateExtensionsOptions = Partial<{
	starterKit: Partial<StarterKitOptions> | false;
}>;

export const FullExtensions: CreateExtensionsOptions = {};

export function createExtensions(options: CreateExtensionsOptions) {
	return [
		...(options.starterKit !== false
			? [StarterKit.configure(options.starterKit || {})]
			: []),
	];
}
