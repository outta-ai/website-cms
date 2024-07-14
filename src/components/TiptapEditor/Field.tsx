import { useEffect, useRef } from "react";

import type { Props as TextareaProps } from "payload/components/fields/Textarea";
import { useFieldType } from "payload/components/forms";

import { EditorContent, useEditor, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import classNames from "classnames";
import {
	FaBold,
	FaCode,
	FaImage,
	FaItalic,
	FaListOl,
	FaListUl,
	FaStrikethrough,
} from "react-icons/fa";
import { RiCodeBlock } from "react-icons/ri";

import { useDelayed } from "../../hooks/useDelayed";

import "../tailwind.css";
import {
	AttachmentUploadResult,
	ExtensionImagePasteDrop,
} from "./extensions/image";

type Props = {
	path: string;
	label?: string;
	required?: boolean;
	className?: string;
} & TextareaProps;

const extensions = [StarterKit, ExtensionImagePasteDrop];

export function Field({ path, label }: Props) {
	const { value, setValue } = useFieldType<[Content]>({
		path,
	});

	const editor = useEditor({
		extensions,
		content: value?.length > 0 ? value[0] : undefined,
		editorProps: {
			attributes: {
				class:
					"max-w-full prose prose-sm sm:prose-base lg:prose-lg font-pretendard focus:outline-none p-4 min-h-64",
			},
		},
	});

	const [savedDelay, cancelSavedDelay] = useDelayed(
		() => setValue([editor?.getJSON()] || []),
		3000,
		[editor?.getJSON()],
	);

	useEffect(() => {
		if (!editor) return;
		savedDelay();
	}, [editor, savedDelay]);

	const imageInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="w-full field-type">
			<label className="field-label">{label}</label>
			<div className="border border-[#e5e7eb] shadow-payload-input hover:shadow-payload-input-hover">
				<div className="flex border-b">
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("bold") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleBold().run()}
					>
						<FaBold className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("italic") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleItalic().run()}
					>
						<FaItalic className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("strike") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleStrike().run()}
					>
						<FaStrikethrough className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("code") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleCode().run()}
					>
						<FaCode className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("codeblock") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
					>
						<RiCodeBlock className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("bulletList") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleBulletList().run()}
					>
						<FaListUl className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("orderedList") ? "bg-zinc-300" : "",
						)}
						onClick={() => editor?.chain().focus().toggleOrderedList().run()}
					>
						<FaListOl className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={classNames(
							"p-4",
							editor?.isActive("orderedList") ? "bg-zinc-300" : "",
						)}
						onClick={() => imageInputRef.current?.click()}
					>
						<FaImage className="w-4 h-4" />
					</button>
					<input
						type="file"
						accept="image/*"
						ref={imageInputRef}
						className="hidden"
						onChange={async (e) => {
							const file = e.target.files?.item(0);
							if (!file) return;
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

							editor
								?.chain()
								.focus()
								.setImage({ src: zodResult.data.doc.url })
								.run();
						}}
					/>
				</div>
				<EditorContent
					editor={editor}
					onBlur={() => {
						cancelSavedDelay();
						setValue([editor?.getJSON()] || []);
					}}
				/>
			</div>
		</div>
	);
}
