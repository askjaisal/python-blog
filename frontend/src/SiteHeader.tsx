import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "./api";

type SiteHeaderProps = {
	currentPage: "home" | "journal" | "create";
};

function SiteHeader({ currentPage }: SiteHeaderProps) {
	const navigate = useNavigate();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [error, setError] = useState("");

	async function handleLogout() {
		setError("");
		setIsLoggingOut(true);

		try {
			await api.post("/users/logout", {});

			navigate("/login", { replace: true });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				setError(error.response?.data?.detail ?? error.response?.data?.message ?? "Could not log out. Please try again.");
			} else {
				setError("Could not log out. Please try again.");
			}
		} finally {
			setIsLoggingOut(false);
		}
	}

	const navClass = (page: SiteHeaderProps["currentPage"]) =>
		`hidden text-sm font-semibold transition-colors hover:text-accent sm:inline-flex ${
			currentPage === page ? "text-accent" : "text-moss"
		}`;

	return (
		<div className="border-b border-rule">
			<header className="flex min-h-[76px] items-center justify-between gap-3">
				<Link className="shrink-0 font-editorial text-lg font-bold tracking-wide text-ink sm:text-xl" to="/home">
					FIELDNOTES<span className="text-accent">.</span>
				</Link>
				<nav className="flex items-center gap-2 sm:gap-6" aria-label="Main navigation">
					<Link className={navClass("home")} to="/home">Home</Link>
					<Link className={navClass("journal")} to="/posts">Journal</Link>
					<Link
						className={`inline-flex min-h-10 items-center gap-2 bg-accent px-3 text-sm font-bold text-white transition-colors hover:bg-accent-dark sm:px-4 ${
							currentPage === "create" ? "ring-2 ring-accent/20" : ""
						}`}
						to="/posts/create"
					>
						<span aria-hidden="true">+</span>
						<span>New entry</span>
					</Link>
					<button
						aria-label="Log out"
						title="Log out"
						className="inline-flex min-h-10 items-center justify-center gap-2 border border-rule px-2 text-sm font-semibold text-moss transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60 sm:px-3"
						type="button"
						disabled={isLoggingOut}
						onClick={handleLogout}
					>
						<span aria-hidden="true">↪</span>
						<span className="hidden sm:inline">{isLoggingOut ? "Signing out..." : "Log out"}</span>
					</button>
				</nav>
			</header>
			{error && <p className="py-2 text-right text-xs text-alert" role="alert">{error}</p>}
		</div>
	);
}

export default SiteHeader;