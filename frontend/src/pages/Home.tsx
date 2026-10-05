import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SiteHeader from "../SiteHeader.tsx";

const FEED_PAGE_SIZE = 5;

type User = {
  id: number;
  username: string;
  email: string;
};

type Post = {
  id: number;
  title: string;
  content: string;
  banner_image_url: string;
  user_id: number;
};

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [feedPage, setFeedPage] = useState(1);
  const [feedPages, setFeedPages] = useState(0);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await axios.get("http://localhost:8000/users/me", {
          withCredentials: true,
        });

        setUser(response.data);
      } catch {
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    }

    getCurrentUser();
  }, [navigate]);

  useEffect(() => {
    let isCurrent = true;

    async function getPosts() {
      try {
        const response = await axios.get("http://localhost:8000/post/", {
          params: { page: feedPage, page_size: FEED_PAGE_SIZE },
        });

        if (!isCurrent) return;
        setPosts(response.data.posts ?? []);
        setPostCount(response.data.total ?? 0);
        setFeedPages(response.data.total_pages ?? 0);
      } catch (error) {
        if (!isCurrent) return;
        if (axios.isAxiosError(error)) {
          setFeedError(error.response?.data?.detail ?? "Could not load the latest posts.");
        } else {
          setFeedError("Could not load the latest posts.");
        }
      } finally {
        if (isCurrent) setIsFeedLoading(false);
      }
    }

    getPosts();
    return () => {
      isCurrent = false;
    };
  }, [feedPage]);

  function changeFeedPage(page: number) {
    setFeedError("");
    setIsFeedLoading(true);
    setFeedPage(page);
  }

  return (
    <main className="paper-grid min-h-screen px-5 text-ink sm:px-10">
      <div className="mx-auto max-w-6xl">
        <SiteHeader currentPage="home" />

        <section className="py-16 sm:py-24">
          <p className="mb-4 text-[11px] font-bold tracking-[1.6px] text-accent">YOUR PERSONAL JOURNAL</p>
          <h1 className="max-w-3xl font-editorial text-[42px] font-normal leading-tight sm:text-6xl">
            {isLoading ? "Opening your notebook." : `Good to see you, ${user?.username ?? "writer"}.`}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-moss">
            A little space for the things you notice, learn, and want to remember.
          </p>
          <button className="mt-9 inline-flex min-h-12 items-center gap-8 bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent-dark" onClick={() => navigate("/posts")}>
            Open the journal <span aria-hidden="true">↗</span>
          </button>
        </section>

        <section className="grid gap-6 border-t border-rule py-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[1.4px] text-moss">A FRESH PAGE</p>
            <h2 className="font-editorial text-2xl font-normal">Start with one thought.</h2>
          </div>
          <button className="w-fit border-b border-accent pb-1 text-sm font-bold text-accent hover:text-accent-dark" onClick={() => navigate("/posts/create")}>
            Write something new <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="border-t border-rule pb-14 pt-10 sm:pb-20 sm:pt-14" aria-labelledby="home-feed-title">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold tracking-[1.4px] text-accent">FROM THE WHOLE COMMUNITY</p>
              <h2 id="home-feed-title" className="font-editorial text-3xl font-normal sm:text-4xl">Latest writing.</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">{postCount} {postCount === 1 ? "post" : "posts"}</p>
          </div>

          {feedError && <p className="border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert" role="alert">{feedError}</p>}
          {isFeedLoading && <p className="border-t border-rule py-6 text-sm text-moss">Loading posts...</p>}
          {!isFeedLoading && !feedError && posts.length === 0 && (
            <p className="border-y border-rule py-8 text-sm text-moss">No posts yet. Be the first to write one.</p>
          )}

          {!isFeedLoading && !feedError && posts.map((post) => (
            <article className="grid gap-4 border-t border-rule py-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-7 sm:py-8" key={post.id}>
              <Link className="block" to={`/posts/${post.id}`} aria-label={`Read ${post.title}`}>
                <img
                  className="aspect-[16/10] w-full object-cover"
                  src={post.banner_image_url || "/default-fallback-image.png"}
                  alt=""
                />
              </Link>
              <div>
                <p className="mb-2 text-[10px] font-bold tracking-[1.3px] text-accent">
                  {user && user.id === post.user_id ? "YOUR POST" : "COMMUNITY POST"}
                </p>
                <h3 className="font-editorial text-2xl font-normal leading-snug sm:text-3xl">
                  <Link className="transition-colors hover:text-accent" to={`/posts/${post.id}`}>{post.title}</Link>
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-moss">
                  {post.content.length > 240 ? `${post.content.slice(0, 240).trimEnd()}...` : post.content}
                </p>
                <Link className="mt-4 inline-block border-b border-accent pb-1 text-sm font-bold text-accent hover:text-accent-dark" to={`/posts/${post.id}`}>
                  Read post <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}

          {feedPages > 1 && (
            <nav className="flex items-center justify-between border-t border-rule pt-5" aria-label="Home feed pages">
              <button
                className="text-sm font-semibold text-moss hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={feedPage <= 1 || isFeedLoading}
                onClick={() => changeFeedPage(feedPage - 1)}
              >
                ← Newer posts
              </button>
              <span className="text-xs font-semibold uppercase tracking-wide text-moss">Page {feedPage} of {feedPages}</span>
              <button
                className="text-sm font-semibold text-moss hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={feedPage >= feedPages || isFeedLoading}
                onClick={() => changeFeedPage(feedPage + 1)}
              >
                Older posts →
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

export default Home;