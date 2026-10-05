import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import SiteHeader from "../SiteHeader";

type Post = {
	id: number;
	title: string;
	content: string;
	banner_image_url: string;
	user_id: number;
};

function PostDetail() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const [post, setPost] = useState<Post | null>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let isCurrent = true;

		async function loadPost() {
			if (!postId) {
				setError("This entry could not be found.");
				setIsLoading(false);
				return;
			}

			try {
				const [postResponse, userResponse] = await Promise.all([
					axios.get(`http://localhost:8000/post/${postId}`),
					axios.get("http://localhost:8000/users/me", { withCredentials: true }).catch(() => null),
				]);

				if (!isCurrent) return;
				setPost(postResponse.data);
				setCurrentUserId(userResponse?.data?.id ?? null);
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
							<div className="whitespace-pre-wrap text-base leading-8 text-ink sm:text-lg sm:leading-9">{post.content}</div>
						</article>
					)}
				</section>
			</div>
		</main>
	);
}

export default PostDetail;