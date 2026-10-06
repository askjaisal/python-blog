import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/users/", {
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail ?? error.response?.data?.message ?? "Could not create your account.");
      } else {
        setError("Could not create your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="paper-grid min-h-screen px-5 text-ink sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex min-h-[76px] items-center justify-between border-b border-rule">
          <Link className="font-editorial text-xl font-bold tracking-wide text-ink" to="/home">
            FIELDNOTES<span className="text-accent">.</span>
          </Link>
          <Link className="text-sm font-semibold text-moss transition-colors hover:text-accent" to="/login">
            Sign in <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <section className="mx-auto w-full max-w-[480px] pb-16 pt-16 sm:pt-24">
          <p className="mb-3 text-[11px] font-bold tracking-[1.6px] text-accent">START WITH A BLANK PAGE</p>
          <h1 className="mb-3 font-editorial text-[42px] font-normal leading-tight sm:text-5xl">Make room for ideas.</h1>
          <p className="mb-9 text-sm leading-6 text-moss">Create your account and start keeping your notes in one place.</p>

          <form className="border border-rule bg-paper-bright/80 p-6 sm:p-9" onSubmit={handleSignup}>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-moss" htmlFor="signup-username">Username</label>
              <input
                className="min-h-12 w-full border border-rule bg-white/70 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                id="signup-username"
                type="text"
                autoComplete="username"
                placeholder="How should we address you?"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-moss" htmlFor="signup-email">Email</label>
              <input
                className="min-h-12 w-full border border-rule bg-white/70 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-moss" htmlFor="signup-password">Password</label>
              <input
                className="min-h-12 w-full border border-rule bg-white/70 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="mb-5 border-l-2 border-alert bg-alert/5 px-3 py-2 text-sm text-alert" role="alert">{error}</p>}

            <button className="flex min-h-12 w-full items-center justify-between bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <span aria-hidden="true">↗</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-moss">
            Already have an account? <Link className="font-bold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent" to="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Signup;