import DOMPurify from "dompurify";

export function sanitizeBlogHtml(content: string): string {
	return DOMPurify.sanitize(content, {
		USE_PROFILES: { html: true },
		ADD_TAGS: ["figure", "figcaption"],
	});
}

export function blogContentText(content: string): string {
	const sanitized = sanitizeBlogHtml(content);
	return new DOMParser().parseFromString(sanitized, "text/html").body.textContent?.trim() ?? "";
}