import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { default as ReactQuillInstance } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./RichTextEditor.css";

type RichTextEditorProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minHeight?: number;
	onImageUpload?: (file: File) => Promise<string>;
	imageUploadError?: string;
};

type InlineImageValue = {
	url: string;
	alt: string;
	caption: string;
};

type ReactQuillComponent = typeof import("react-quill-new").default;

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maximumImageSize = 10 * 1024 * 1024;

function registerInlineImageBlot(Quill: typeof import("react-quill-new").Quill) {
	if (Quill.imports["formats/blogInlineImage"]) return;

	const BlockEmbed = Quill.import("blots/block/embed") as new (...args: unknown[]) => { domNode: HTMLElement };
	class BlogInlineImage extends BlockEmbed {
		static blotName = "blogInlineImage";
		static tagName = "figure";
		static className = "blog-inline-image";

		static create(value: InlineImageValue) {
			const figure = document.createElement("figure");
			figure.className = "blog-inline-image";
			const image = document.createElement("img");
			image.src = value.url;
			image.alt = value.alt;
			figure.append(image);
			if (value.caption) {
				const caption = document.createElement("figcaption");
				caption.textContent = value.caption;
				figure.append(caption);
			}
			return figure;
		}

		static value(node: HTMLElement): InlineImageValue {
			const image = node.querySelector("img");
			return {
				url: image?.getAttribute("src") ?? "",
				alt: image?.getAttribute("alt") ?? "",
				caption: node.querySelector("figcaption")?.textContent ?? "",
			};
		}
	}

	Quill.register("formats/blogInlineImage", BlogInlineImage);
}

function RichTextEditor({
	value,
	onChange,
	placeholder = "Start writing your story...",
	minHeight = 300,
	onImageUpload,
	imageUploadError,
}: RichTextEditorProps) {
	const [Editor, setEditor] = useState<ReactQuillComponent | null>(null);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState("");
	const [altText, setAltText] = useState("");
	const [caption, setCaption] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const editorRef = useRef<ReactQuillInstance>(null);
	const lastSelection = useRef<{ index: number; length: number } | null>(null);
	const savedSelection = useRef<{ index: number; length: number } | null>(null);
	const previewUrlRef = useRef("");
	const altInputRef = useRef<HTMLInputElement>(null);
	const toolbarId = `blog-editor-toolbar-${useId().replaceAll(":", "")}`;

	useEffect(() => {
		let isMounted = true;
		import("react-quill-new").then((module) => {
			if (!isMounted) return;
			registerInlineImageBlot(module.Quill);
			setEditor(() => module.default);
		});
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (isImageModalOpen) altInputRef.current?.focus();
	}, [isImageModalOpen]);

	useEffect(() => {
		if (!isImageModalOpen) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape" && !isUploading) closeImageModal();
			if (event.key === "Tab") {
				const focusableElements = document.querySelectorAll<HTMLElement>(
					".blog-image-modal button:not(:disabled), .blog-image-modal input:not(:disabled)",
				);
				const firstElement = focusableElements.item(0);
				const lastElement = focusableElements.item(focusableElements.length - 1);
				if (event.shiftKey && document.activeElement === firstElement) {
					event.preventDefault();
					lastElement?.focus();
				} else if (!event.shiftKey && document.activeElement === lastElement) {
					event.preventDefault();
					firstElement?.focus();
				}
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isImageModalOpen, isUploading]);

	useEffect(() => () => {
		if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
	}, []);

	const modules = useMemo(() => ({
		toolbar: {
			container: `#${toolbarId}`,
			handlers: {
				image: () => {
					const editor = editorRef.current?.getEditor();
					savedSelection.current = editor?.getSelection() ?? lastSelection.current;
					setUploadError("");
					setIsImageModalOpen(true);
				},
			},
		},
	}), [toolbarId]);

	function updateSelectedFile(file: File | null) {
		if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		const nextPreviewUrl = file ? URL.createObjectURL(file) : "";
		previewUrlRef.current = nextPreviewUrl;
		setPreviewUrl(nextPreviewUrl);
		setSelectedFile(file);
		setUploadError("");
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null;
		event.target.value = "";
		if (!file) return;
		if (!allowedImageTypes.includes(file.type)) {
			updateSelectedFile(null);
			setUploadError("Choose a JPEG, PNG, or WEBP image.");
			return;
		}
		if (file.size > maximumImageSize) {
			updateSelectedFile(null);
			setUploadError("Images must be 10 MB or smaller.");
			return;
		}
		updateSelectedFile(file);
	}

	function closeImageModal() {
		if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		previewUrlRef.current = "";
		setPreviewUrl("");
		setSelectedFile(null);
		setAltText("");
		setCaption("");
		setUploadError("");
		setIsImageModalOpen(false);
		requestAnimationFrame(() => editorRef.current?.focus());
	}

	async function insertImage() {
		if (!selectedFile || !onImageUpload) return;
		setIsUploading(true);
		setUploadError("");
		try {
			const url = await onImageUpload(selectedFile);
			const editor = editorRef.current?.getEditor();
			if (!editor) throw new Error("The editor is not available.");
			const selection = savedSelection.current;
			const insertAt = selection?.index ?? Math.max(0, editor.getLength() - 1);
			if (selection?.length) editor.deleteText(insertAt, selection.length, "user");
			editor.insertEmbed(insertAt, "blogInlineImage", {
				url,
				alt: altText,
				caption,
			}, "user");
			editor.insertText(insertAt + 1, "\n", "user");
			editor.setSelection(insertAt + 2, 0, "silent");
			lastSelection.current = { index: insertAt + 2, length: 0 };
			closeImageModal();
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Image upload failed. Please try again.");
		} finally {
			setIsUploading(false);
		}
	}

	const formats = [
		"header", "bold", "italic", "underline", "strike", "list", "indent", "blockquote",
		"code-block", "link", "align", "blogInlineImage",
	];

	return (
		<div className="blog-editor">
			<div id={toolbarId} className="blog-editor-toolbar" aria-label="Formatting toolbar">
				<span className="ql-formats">
					<select className="ql-header" defaultValue="" aria-label="Text style">
						<option value="">Paragraph</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option>
					</select>
				</span>
				<span className="ql-formats">
					<button className="ql-bold" type="button" aria-label="Bold" title="Bold" />
					<button className="ql-italic" type="button" aria-label="Italic" title="Italic" />
					<button className="ql-underline" type="button" aria-label="Underline" title="Underline" />
					<button className="ql-strike" type="button" aria-label="Strikethrough" title="Strikethrough" />
				</span>
				<span className="ql-formats">
					<button className="ql-list" type="button" value="ordered" aria-label="Ordered list" title="Ordered list" />
					<button className="ql-list" type="button" value="bullet" aria-label="Bulleted list" title="Bulleted list" />
					<button className="ql-indent" type="button" value="-1" aria-label="Outdent" title="Outdent" />
					<button className="ql-indent" type="button" value="+1" aria-label="Indent" title="Indent" />
				</span>
				<span className="ql-formats">
					<button className="ql-blockquote" type="button" aria-label="Blockquote" title="Blockquote" />
					<button className="ql-code-block" type="button" aria-label="Code block" title="Code block" />
					<button className="ql-link" type="button" aria-label="Insert link" title="Insert link" />
					<button className="ql-image" type="button" aria-label="Insert image" title="Insert image" />
				</span>
				<span className="ql-formats">
					<select className="ql-align" defaultValue="" aria-label="Text alignment">
						<option value="">Align left</option><option value="center">Align center</option><option value="right">Align right</option><option value="justify">Justify</option>
					</select>
					<button className="ql-clean" type="button" aria-label="Clear formatting" title="Clear formatting" />
				</span>
			</div>
			{Editor ? (
				<Editor
					ref={editorRef}
					id="post-content"
					theme="snow"
					value={value}
					onChange={onChange}
					onChangeSelection={(range) => {
						if (range) lastSelection.current = { index: range.index, length: range.length };
					}}
					modules={modules}
					formats={formats}
					placeholder={placeholder}
					style={{ minHeight }}
					useSemanticHTML={false}
				/>
			) : <div className="blog-editor-loading" style={{ minHeight }} aria-label="Loading editor" />}

			{isImageModalOpen && (
				<div className="blog-image-modal-backdrop" onMouseDown={(event) => {
					if (event.target === event.currentTarget && !isUploading) closeImageModal();
				}}>
					<section className="blog-image-modal" role="dialog" aria-modal="true" aria-labelledby="blog-image-modal-title">
						<header className="blog-image-modal-header">
							<h2 id="blog-image-modal-title"><span aria-hidden="true">▧</span> Insert inline image</h2>
							<button type="button" aria-label="Close image dialog" onClick={closeImageModal} disabled={isUploading}>×</button>
						</header>
						<div className="blog-image-modal-body">
						{previewUrl ? (
							<div className="blog-image-preview">
								<img src={previewUrl} alt={altText} />
								{caption.trim() && <p>{caption}</p>}
							</div>
						) : <div className="blog-image-empty-preview">Image preview</div>}
						<div className="blog-image-file-picker">
							<label className="blog-image-file-label" htmlFor="blog-inline-image-file">
								<span aria-hidden="true">⇧</span>
								<strong>{selectedFile ? "Change image" : "Choose an image"}</strong>
								<small>JPEG · PNG · WEBP (max 10 MB)</small>
							</label>
							<input id="blog-inline-image-file" className="blog-image-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-describedby="blog-image-file-help" />
						</div>
						<p id="blog-image-file-help" className="blog-image-help">JPEG, PNG, or WEBP · Maximum 10 MB</p>
						{selectedFile && <button className="blog-image-remove" type="button" onClick={() => updateSelectedFile(null)}>Remove selected image</button>}
						<label className="blog-image-field-label" htmlFor="blog-image-alt">Alt text</label>
						<input ref={altInputRef} id="blog-image-alt" className="blog-image-field" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={500} />
						<label className="blog-image-field-label" htmlFor="blog-image-caption">Caption or credit <span>(optional)</span></label>
						<input id="blog-image-caption" className="blog-image-field" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} />
						{!onImageUpload && <p className="blog-image-error" role="alert">Image uploads are unavailable right now.</p>}
						{(uploadError || imageUploadError) && <p className="blog-image-error" role="alert">{uploadError || imageUploadError}</p>}
						<div className="blog-image-actions">
							<button type="button" onClick={closeImageModal} disabled={isUploading}>Cancel</button>
							<button type="button" onClick={insertImage} disabled={!selectedFile || !onImageUpload || isUploading}>
								{isUploading ? "Uploading..." : "Insert image"}
							</button>
						</div>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}

export default RichTextEditor;