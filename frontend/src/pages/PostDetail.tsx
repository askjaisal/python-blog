import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import SiteHeader from "../SiteHeader";
import { sanitizeBlogHtml } from "../blogContent";

type Post = {
	id: number;
	title: string;
	content: string;
	banner_image_url: string;
	user_id: number;
};

type Comment = {
	id: number;
	content: string;
	user_id: number;
	post_id: number;
	username: string;
	created_at: string;
};

function PostDetail() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const [post, setPost] = useState<Post | null>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);
	const [commentsError, setCommentsError] = useState("");
	const [commentText, setCommentText] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const [commentSubmitError, setCommentSubmitError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let isCurrent = true;

		async function loadPost() {
			setIsLoading(true);
			setCommentsLoading(true);
			setError("");
			setCommentsError("");
			setComments([]);

			if (!postId) {
				setError("This entry could not be found.");
				setIsLoading(false);
				return;
			}

			try {
				const [postResponse, userResponse] = await Promise.all([
					api.get(`/post/${postId}`),
					api.get("/users/me").catch(() => null),
				]);

				if (!isCurrent) return;
				setPost(postResponse.data);
				setCurrentUserId(userResponse?.data?.id ?? null);

				try {
					const commentsResponse = await api.get(`/posts/${postId}/comments`);
					if (!isCurrent) return;
					setComments(commentsResponse.data.comments);
				} catch {
					if (!isCurrent) return;
					setCommentsError("Could not load comments. Please try again later.");
				} finally {
					if (isCurrent) setCommentsLoading(false);
				}
			} catch (error) {
				if (!isCurrent) return;
				if (axios.isAxiosError(error) && error.response?.status === 404) {
					setError("This entry could not be found.");
				} else {
					setError("Could not open this entry. Please try again.");
				}
			} finally {
				if (isCurrent) setIsLoading(false);
			}
		}

		loadPost();
		return () => {
			isCurrent = false;
		};
	}, [postId]);

	async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const content = commentText.trim();
		if (!postId || !content) return;

		setIsSubmittingComment(true);
		setCommentSubmitError("");
		try {
			const response = await api.post(`/posts/${postId}/comments`, { content });
			setComments((currentComments) => [...currentComments, response.data.comment]);
			setCommentText("");
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				setCommentSubmitError("Your session has expired. Please sign in again.");
			} else {
				setCommentSubmitError("Could not post your comment. Please try again.");
			}
		} finally {
			setIsSubmittingComment(false);
		}
	}

	return (
		<main className="paper-grid min-h-screen px-5 pb-16 text-ink sm:px-10">
			<div className="mx-auto max-w-6xl">
				<SiteHeader currentPage="journal" />

				<section className="mx-auto max-w-4xl pb-12 pt-8 sm:pb-20 sm:pt-12">
					<div className="mb-8 flex items-center justify-between gap-4 border-b border-rule pb-4">
						<Link className="text-sm font-semibold text-moss transition-colors hover:text-accent" to="/posts">
							<span aria-hidden="true">← </span>Journal
						</Link>
						{post && currentUserId === post.user_id && (
							<button
								className="border-b border-accent pb-1 text-sm font-bold text-accent hover:text-accent-dark"
								type="button"
								onClick={() => navigate(`/posts/${post.id}/edit`)}
							>
								Edit entry
							</button>
						)}
					</div>

					{isLoading && <p className="border-t border-rule py-8 text-sm text-moss">Opening entry...</p>}
					{error && <p className="border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert" role="alert">{error}</p>}
					{post && !isLoading && (
						<article>
							<p className="mb-4 text-[11px] font-bold tracking-[1.6px] text-accent">FIELDNOTES / JOURNAL</p>
							<h1 className="mb-8 max-w-3xl font-editorial text-[38px] font-normal leading-tight sm:text-6xl">{post.title}</h1>
							{post.banner_image_url && (
								<img className="mb-9 aspect-[16/8] w-full object-cover sm:mb-12" src={post.banner_image_url} alt={post.title} />
							)}
							<div className="blog-article-content" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }} />
						</article>
					)}

					{post && !isLoading && (
						<section className="mt-16 border-t border-rule pt-8 sm:mt-20" aria-labelledby="comments-heading">
							<div className="mb-8 flex items-baseline justify-between gap-4">
								<h2 id="comments-heading" className="font-editorial text-3xl font-normal text-ink">Notes from readers</h2>
								<span className="text-xs text-moss">{comments.length} {comments.length === 1 ? "note" : "notes"}</span>
							</div>

							{currentUserId !== null ? (
								<form className="mb-10" onSubmit={handleCommentSubmit}>
									<label className="mb-2 block text-sm font-semibold text-ink" htmlFor="comment-content">Add a note</label>
									<textarea
										className="min-h-28 w-full resize-y border border-rule bg-white/70 px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
										id="comment-content"
										maxLength={2000}
										value={commentText}
										onChange={(event) => setCommentText(event.target.value)}
										placeholder="Share a thoughtful response..."
										required
									/>
									<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
										<p className="text-xs text-moss">{commentText.length}/2000</p>
										<button
											className="bg-moss px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
											type="submit"
											disabled={isSubmittingComment || !commentText.trim()}
										>
											{isSubmittingComment ? "Posting..." : "Post note"}
										</button>
									</div>
									{commentSubmitError && (
										<p className="mt-3 text-sm text-alert" role="alert">
											{commentSubmitError} {commentSubmitError.startsWith("Your session") && <Link className="font-semibold underline" to="/login">Sign in</Link>}
										</p>
									)}
								</form>
							) : (
								<p className="mb-10 text-sm text-moss"><Link className="font-semibold text-accent underline decoration-rule underline-offset-4" to="/login">Sign in</Link> to leave a note.</p>
							)}

							{commentsLoading && <p className="border-t border-rule py-5 text-sm text-moss">Loading notes...</p>}
							{commentsError && <p className="border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert" role="alert">{commentsError}</p>}
							{!commentsLoading && !commentsError && comments.length === 0 && (
								<p className="border-t border-rule py-5 text-sm text-moss">No notes yet. Start the conversation.</p>
							)}
							{comments.length > 0 && (
								<ul className="divide-y divide-rule border-t border-rule">
									{comments.map((comment) => (
										<li className="py-5" key={comment.id}>
											<div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
												<p className="text-sm font-semibold text-ink">{comment.username}</p>
												<time className="text-xs text-moss" dateTime={comment.created_at}>
													{new Date(comment.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
												</time>
											</div>
											<p className="whitespace-pre-wrap text-sm leading-7 text-ink">{comment.content}</p>
										</li>
									))}
								</ul>
							)}
						</section>
					)}
				</section>
			</div>
		</main>
	);
}

export default PostDetail;