"use client";

import { useEffect, useState } from "react";

export type DemoUser = { name: string; email: string };

function nameFromEmail(email: string) {
  return email.split("@")[0].split(/[._-]+/).filter(Boolean).map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ") || "Founder";
}

export function AuthPortal({ onAuthenticated,onBack }: { onAuthenticated: (user: DemoUser) => void;onBack:()=>void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("northstar-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);
  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("northstar-theme", nextTheme);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup" && name.trim().length < 2) return setError("Enter your name to create the demo workspace.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must contain at least 6 characters.");
    onAuthenticated({ name: mode === "signup" ? name.trim() : nameFromEmail(email), email: email.trim().toLowerCase() });
  }
  return <main className="auth-page auth-refined"><button className="auth-back" onClick={onBack}>← Back to Northstar</button><section className="auth-story"><div className="auth-brand"><span>N</span><b>northstar</b></div><div className="auth-message"><span className="auth-kicker">YOUR COMPANY, ALIGNED</span><h1>Welcome back to your operating system.</h1><p>One secure workspace for company priorities, team decisions, customer pipeline, finance, and upgrade-safe automation.</p><div className="auth-testimonial"><p>“Northstar gives every person the context to make a better decision without another status meeting.”</p><span><b>Founder operating principle</b>High-agency teams · Clear accountability</span></div></div><div className="auth-canvas"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><span className="auth-star">N</span></div><small className="auth-note">Private company workspace · Role-based access</small></section>
    <section className="auth-panel"><button className="auth-theme-button" onClick={toggleTheme} aria-label="Switch light or dark mode">◐</button><div className="auth-card"><div className="auth-mobile-brand"><span>N</span> northstar</div><span className="eyebrow blue">SECURE WORKSPACE ACCESS</span><h2>{mode === "signin" ? "Sign in to Northstar" : "Create your company workspace"}</h2><p>{mode === "signin" ? "Continue where your team left off." : "Start with your company identity. Invite teammates after setup."}</p><div className="auth-tabs" role="tablist"><button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create workspace</button></div><form className="auth-form" onSubmit={submit}>{mode === "signup" ? <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name"/></label> : null}<label>Work email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"}/></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="auth-submit" type="submit">{mode === "signin" ? "Continue to workspace" : "Create workspace"}<span>→</span></button></form><div className="demo-hint"><span>DEMO</span><p><b>Explore with sample company data</b>founder@arclabs.co · demo1234</p></div><div className="auth-security"><span>✓</span><p><b>Workspace-level privacy</b>Your company records are isolated and protected by server-side permissions.</p></div><p className="auth-terms">By continuing, you agree to use this hackathon demonstration responsibly.</p></div></section>
  </main>;
}
