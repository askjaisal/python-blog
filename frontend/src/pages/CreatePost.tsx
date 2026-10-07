import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import SiteHeader from "../SiteHeader";
import RichTextEditor from "../RichTextEditor";

function CreatePost() {
	const navigate = useNavigate();
	const { postId } = useParams();
	const isEditing = postId !== undefined;
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [bannerImageUrl, setBannerImageUrl] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(isEditing);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreviewUrl, setImagePreviewUrl] = useState("");

	useEffect(() => {
		if (!isEditing || !postId) return;

		async function loadPost() {
			try {
				const response = await api.get(`/post/${postId}`);
				setTitle(response.data.title);
				setContent(response.data.content);
				setBannerImageUrl(response.data.banner_image_url ?? "");
			} catch (error) {
				if (axios.isAxiosError(error) && error.response?.status === 401) {
					navigate("/login");
					return;
				}
				setError("Could not load this post for editing.");
			} finally {
				setIsLoading(false);
			}
		}

		loadPost();
	}, [isEditing, navigate, postId]);

	useEffect(() => {
		return () => {
			if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		};
	}, [imagePreviewUrl]);

	function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null;
		setImageFile(file);
		setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!content.replace(/<[^>]*>/g, "").trim() && !content.includes("<img")) {
			setError("Please add some content to your story.");
			return;
		}
		setError("");
		setIsSubmitting(true);

		try {
			let uploadedImageUrl = bannerImageUrl;
			if (imageFile) {
				const formData = new FormData();
				formData.append("file", imageFile);
				const uploadResponse = await api.post("/uploads/image", formData, {
					withCredentials: true,
				});
				uploadedImageUrl = uploadResponse.data.image_url;
			}

			const postData = {
				title,
				content,
				banner_image_url: uploadedImageUrl,
			};
			const requestConfig = {
				withCredentials: true,
			};

			if (isEditing && postId) {
				await api.put(`/post/${postId}`, postData, requestConfig);
			} else {
				await api.post("/post/", postData, requestConfig);
			}

			navigate("/posts");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					navigate("/login");
					return;
				}
				setError(error.response?.data?.detail ?? error.response?.data?.message ?? "Could not save this post.");
			} else {
				setError("Could not save this post.");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleInlineImageUpload(file: File): Promise<string> {
		if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
			const message = "Choose a JPEG, PNG, or WEBP image.";
			setError(message);
			throw new Error(message);
		}
		if (file.size > 10 * 1024 * 1024) {
			const message = "Images must be 10 MB or smaller.";
			setError(message);
			throw new Error(message);
		}

		try {
			const formData = new FormData();
			formData.append("file", file);
			const response = await api.post("/uploads/image", formData, { withCredentials: true });
			const imageUrl = response.data.image_url;
			if (typeof imageUrl !== "string" || !imageUrl) throw new Error("The image upload did not return a URL.");
			setError("");
			return imageUrl;
		} catch (error) {
			const message = axios.isAxiosError(error)
				? error.response?.data?.detail ?? "Could not upload this image. Please try again."
				: error instanceof Error ? error.message : "Could not upload this image. Please try again.";
			setError(message);
			throw new Error(message, { cause: error });
		}
	}

	return (
		<main className="paper-grid min-h-screen bg-paper px-5 pb-16 text-ink sm:px-[7vw]">
			<div className="mx-auto max-w-6xl">
				<SiteHeader currentPage="create" />
			</div>

			<section className="mx-auto mt-12 w-full max-w-[760px] sm:mt-[76px]">
				<p className="mb-3 text-[11px] font-bold tracking-[1.6px] text-accent">YOUR BLOG · DRAFT</p>
				<h1 className="mb-9 font-editorial text-[38px] font-normal leading-tight sm:mb-12 sm:text-5xl">{isEditing ? "Shape the story." : "Put it into words."}</h1>

				{isLoading ? <p className="border-t border-rule py-8 text-sm text-moss">Loading post...</p> : <form className="flex flex-col items-stretch" onSubmit={handleSubmit}>
					<label className="mb-2 text-xs font-bold uppercase text-moss" htmlFor="post-image">Banner image</label>
					{(imagePreviewUrl || bannerImageUrl) && (
						<img className="mb-4 aspect-[16/7] w-full object-cover" src={imagePreviewUrl || bannerImageUrl} alt="Post banner preview" />
					)}
					<input
						id="post-image"
						className="mb-8 block w-full border border-rule bg-white/40 text-sm text-moss file:mr-4 file:border-0 file:bg-accent file:px-4 file:py-3 file:text-sm file:font-bold file:text-white hover:file:bg-accent-dark"
						type="file"
						accept="image/*"
						onChange={handleImageChange}
						required={!isEditing && !bannerImageUrl}
					/>
					<label className="mb-2 text-xs font-bold uppercase text-moss" htmlFor="post-title">Title</label>
					<input
						id="post-title"
						className="mb-8 min-h-16 w-full border-0 border-b border-rule bg-white/40 px-4 py-3 font-editorial text-2xl text-ink outline-none transition focus:border-accent focus:ring-0"
						type="text"
						placeholder="A title worth opening"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						maxLength={200}
						required
					/>

					<label className="mb-2 text-xs font-bold uppercase text-moss" htmlFor="post-content">Your story</label>
					<RichTextEditor
						value={content}
						onChange={setContent}
						placeholder="Start writing..."
						minHeight={300}
						onImageUpload={handleInlineImageUpload}
					/>

					{error && <p className="mt-4 border-l-2 border-alert bg-alert/5 px-3 py-2 text-sm text-alert" role="alert">{error}</p>}

					<div className="mt-6 flex items-center justify-between gap-4">
						<span className="text-xs text-moss">{content.replace(/<[^>]*>/g, "").length} characters</span>
						<button className="inline-flex min-h-12 items-center justify-center gap-5 bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Publish post"}
							{!isSubmitting && <span aria-hidden="true">↗</span>}
						</button>
					</div>
				</form>}
			</section>
		</main>
	);
}

export default CreatePost;
