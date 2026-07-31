"use client";

import { useEffect } from "react";

export function AuthPortal() {
  const signInPath = "/signin-with-chatgpt?return_to=%2F";
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("northstar-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);
  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("northstar-theme", nextTheme);
  }
  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><span>✦</span><b>Northstar</b></div>
      <div className="auth-message"><span className="auth-kicker">STARTUP OPERATING SYSTEM</span><h1>Every moving part.<br/>One clear direction.</h1><p>Connect your goals, pipeline, people, and runway—then let Northstar surface what needs your attention.</p><div className="auth-proof"><div><b>14.2</b><span>months runway</span></div><div><b>87%</b><span>team velocity</span></div><div><b>$312k</b><span>active pipeline</span></div></div></div>
      <div className="auth-canvas"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><span className="auth-star">✦</span></div>
      <small className="auth-note">Built for ambitious operating teams.</small>
    </section>
    <section className="auth-panel"><button className="auth-theme-button" onClick={toggleTheme} aria-label="Switch light or dark mode">◐</button>
      <div className="auth-card">
        <div className="auth-mobile-brand"><span>✦</span> Northstar</div>
        <span className="eyebrow blue">WELCOME TO NORTHSTAR</span>
        <h2>Move your company forward.</h2>
        <p>Sign in to your workspace or create an account to build your first operating system.</p>
        <div className="auth-options">
          <a className="auth-primary" href={signInPath}><span className="chatgpt-mark">✦</span><span><b>Sign in with ChatGPT</b><small>Continue to your workspace</small></span><em>→</em></a>
          <div className="auth-divider"><span>or</span></div>
          <a className="auth-secondary" href={signInPath}><span><b>Create an account</b><small>Start a new company workspace</small></span><em>→</em></a>
        </div>
        <p className="auth-terms">By continuing, you agree to Northstar’s Terms and Privacy Policy.</p>
        <div className="auth-security"><span>✓</span><p><b>Secure by design</b>Your identity is protected through ChatGPT authentication. Northstar never stores your password.</p></div>
      </div>
    </section>
  </main>;
}
