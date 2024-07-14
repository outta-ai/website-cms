import ExtensionImage from "@tiptap/extension-image";
import type { Node } from "prosemirror-model";
import { Plugin, type Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { z } from "zod";

export const AttachmentUploadResult = z.object({
	doc: z.object({ url: z.string() }).passthrough(),
	message: z.string(),
});

const handleImage =
	(view: EditorView, nodeToTransaction: (node: Node) => Transaction) =>
	async (file: File) => {
		try {
			const { schema } = view.state;

			const formData = new FormData();
			formData.append("file", file);
			formData.append("name", crypto.randomUUID());

			const response = await fetch("/api/attachments", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) return;
			const textData = await response.text();

			const attachement = (() => {
				try {
					return JSON.parse(textData);
				} catch {
					return undefined;
				}
			})();

			const zodResult = AttachmentUploadResult.safeParse(attachement);
			if (!zodResult.success) {
				console.error(zodResult.error);
				return;
			}

			const node = schema.nodes.image.create({
				src: zodResult.data.doc.url,
			});
			const transaction = nodeToTransaction(node);
			view.dispatch(transaction);
		} catch (e) {
			console.error(e);
		}
	};

export const ExtensionImagePasteDrop = ExtensionImage.extend({
	addProseMirrorPlugins: () => [
		new Plugin({
			props: {
				handleDOMEvents: {
					drop(view, event) {
						// Check if this event has files
						if (!event.dataTransfer?.files?.length) return;

						// Check if this event has an image file
						const images = Array.from(event.dataTransfer.files).filter((f) =>
							/image/i.test(f.type),
						);
						if (images.length === 0) {
							return;
						}

						event.preventDefault();

						const coordinates = view.posAtCoords({
							left: event.clientX,
							top: event.clientY,
						});
						if (coordinates === null) return;

						Promise.all(
							images.map(
								handleImage(view, (node) =>
									view.state.tr.insert(coordinates.pos, node),
								),
							),
						);
					},
					paste(view, event) {
						// Check if this event has files
						if (!event.clipboardData?.files?.length) return;

						// Check if this event has an image file
						const images = Array.from(event.clipboardData.files).filter((f) =>
							/image/i.test(f.type),
						);
						if (images.length === 0) {
							return;
						}

						event.preventDefault();

						Promise.all(
							images.map(
								handleImage(view, (node) =>
									view.state.tr.replaceSelectionWith(node),
								),
							),
						);
					},
				},
			},
		}),
	],
	addCommands() {
		return {
			setImage:
				(attrs) =>
				({ state, dispatch }) => {
					const { selection } = state;
					const position = selection.$head
						? selection.$head.pos
						: selection.$to.pos;

					const node = this.type.create(attrs);
					const transaction = state.tr.insert(position, node);
					return dispatch?.(transaction);
				},
		};
	},
});
