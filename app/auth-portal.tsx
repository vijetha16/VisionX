"use client";

import { useEffect, useState } from "react";

export type DemoUser = { name: string; email: string };

export function AuthPortal({ onAuthenticated }: { onAuthenticated: (user: DemoUser) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("founder@arclabs.co");
  const [password, setPassword] = useState("demo1234");
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
    onAuthenticated({ name: mode === "signup" ? name.trim() : email.split("@")[0], email: email.trim() });
  }
  return <main className="auth-page">
    <section className="auth-story"><div className="auth-brand"><span>✦</span><b>Northstar</b></div><div className="auth-message"><span className="auth-kicker">STARTUP OPERATING SYSTEM</span><h1>Every moving part.<br/>One clear direction.</h1><p>Connect your goals, pipeline, people, and runway—then let Northstar surface what needs your attention.</p><div className="auth-proof"><div><b>14.2</b><span>months runway</span></div><div><b>87%</b><span>team velocity</span></div><div><b>$312k</b><span>active pipeline</span></div></div></div><div className="auth-canvas"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><span className="auth-star">✦</span></div><small className="auth-note">Built for ambitious operating teams.</small></section>
    <section className="auth-panel"><button className="auth-theme-button" onClick={toggleTheme} aria-label="Switch light or dark mode">◐</button><div className="auth-card"><div className="auth-mobile-brand"><span>✦</span> Northstar</div><span className="eyebrow blue">WELCOME TO NORTHSTAR</span><h2>{mode === "signin" ? "Move your company forward." : "Create your workspace."}</h2><p>{mode === "signin" ? "Sign in with the demo account or use your own details." : "Set up a local hackathon workspace in seconds."}</p><div className="auth-tabs" role="tablist"><button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button></div><form className="auth-form" onSubmit={submit}>{mode === "signup" ? <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vijetha" autoComplete="name"/></label> : null}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"}/></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="auth-submit" type="submit">{mode === "signin" ? "Enter demo workspace" : "Create demo workspace"}<span>→</span></button></form><div className="demo-hint"><span>DEMO</span><p><b>Ready-to-use credentials</b>founder@arclabs.co · demo1234</p></div><p className="auth-terms">Hackathon demonstration only. Credentials and session remain on this device.</p></div></section>
  </main>;
}
