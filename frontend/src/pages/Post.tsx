import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SiteHeader from "../SiteHeader";

type Post = {
  id: number;
  title: string;
  content: string;
  banner_image_url: string;
  user_id: number;
};

type User = {
  id: number;
};

const PAGE_SIZE = 10;

function Posts() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getPosts() {
      try {
        const [response, userResponse] = await Promise.all([
          axios.get("http://localhost:8000/post/", { params: { page, page_size: PAGE_SIZE } }),
          axios.get("http://localhost:8000/users/me", { withCredentials: true }).catch(() => null),
        ]);

        setPosts(response.data.posts ?? []);
        setTotalPosts(response.data.total ?? 0);
        setTotalPages(response.data.total_pages ?? 0);
        setCurrentUser(userResponse?.data ?? null);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.detail ?? "Could not load the journal.");
        } else {
          setError("Could not load the journal.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    getPosts();
  }, [page]);

  function changePage(nextPage: number) {
    setError("");
    setIsLoading(true);
    setPage(nextPage);
  }

  return (
    <main className="paper-grid min-h-screen px-5 text-ink sm:px-10">
      <div className="mx-auto max-w-6xl">
        <SiteHeader currentPage="journal" />

        <section className="pb-12 pt-14 sm:pb-16 sm:pt-20">
          <p className="mb-4 text-[11px] font-bold tracking-[1.6px] text-accent">FIELDNOTES / THE ARCHIVE</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-editorial text-[42px] font-normal leading-tight sm:text-6xl">The journal.</h1>
              <p className="mt-3 text-sm leading-6 text-moss">Thoughts worth coming back to.</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">{totalPosts} {totalPosts === 1 ? "entry" : "entries"}</p>
          </div>
        </section>

        {error && <p className="border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert" role="alert">{error}</p>}
        {isLoading && <p className="border-t border-rule py-8 text-sm text-moss">Opening the journal...</p>}
        {!isLoading && !error && posts.length === 0 && (
          <section className="border-y border-rule py-12 sm:py-16">
            <p className="mb-3 text-[11px] font-bold tracking-[1.4px] text-accent">NOTHING HERE YET</p>
            <h2 className="font-editorial text-3xl font-normal">Every archive starts somewhere.</h2>
            <button className="mt-6 border-b border-accent pb-1 text-sm font-bold text-accent hover:text-accent-dark" onClick={() => navigate("/posts/create")}>
              Write the first entry <span aria-hidden="true">→</span>
            </button>
          </section>
        )}

        <section aria-label="Journal entries">
          {posts.map((post, index) => (
            <article className="grid gap-3 border-t border-rule py-7 sm:grid-cols-[72px_1fr] sm:gap-6 sm:py-9" key={post.id}>
              <span className="pt-1 font-editorial text-lg text-accent">{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</span>
              <div>
                {post.banner_image_url && (
                  <Link className="mb-5 block" to={`/posts/${post.id}`} aria-label={`Read ${post.title}`}>
                    <img className="aspect-[16/7] w-full object-cover" src={post.banner_image_url} alt="" />
                  </Link>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-editorial text-2xl font-normal leading-snug sm:text-3xl">
                    <Link className="transition-colors hover:text-accent" to={`/posts/${post.id}`}>{post.title}</Link>
                  </h2>
                  <div className="flex items-center gap-4">
                    <Link className="border-b border-rule pb-1 text-sm font-semibold text-moss hover:border-accent hover:text-accent" to={`/posts/${post.id}`}>
                      Read entry <span aria-hidden="true">→</span>
                    </Link>
                    {currentUser?.id === post.user_id && (
                      <button className="border-b border-accent pb-1 text-sm font-bold text-accent hover:text-accent-dark" type="button" onClick={() => navigate(`/posts/${post.id}/edit`)}>
                        Edit entry
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-moss">{post.content}</p>
              </div>
            </article>
          ))}
        </section>
        {!isLoading && totalPages > 1 && (
          <nav className="flex items-center justify-between border-t border-rule py-5" aria-label="Journal pages">
            <button
              className="text-sm font-semibold text-moss hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-moss">Page {page} of {totalPages}</span>
            <button
              className="text-sm font-semibold text-moss hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={page >= totalPages}
              onClick={() => changePage(page + 1)}
            >
              Next →
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

export default Posts;