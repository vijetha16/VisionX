"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/db/bootstrap";

const navItems = ["Overview", "Goals", "CRM", "Team", "Reports"] as const;
const icons: Record<string, string> = { Overview: "⌂", Goals: "◎", CRM: "◇", Team: "◌", Reports: "▤" };

export function StartupOS() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [active, setActive] = useState<(typeof navItems)[number]>("Overview");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Could not connect to the operating data");
      setData(await response.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong"); }
  }
  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => {
        if (!response.ok) throw new Error("Could not connect to the operating data");
        return response.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Something went wrong"));
  }, []);
  const pending = useMemo(() => data?.insights.filter((item) => item.status === "pending") ?? [], [data]);

  async function approve(id: number) {
    setLoadingId(id); setError("");
    try {
      const response = await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ insightId: id }) });
      if (!response.ok) throw new Error("The action could not be approved");
      setData(await response.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong"); }
    finally { setLoadingId(null); }
  }

  function askNorthstar(event: React.FormEvent) {
    event.preventDefault(); if (!query.trim()) return;
    const lower = query.toLowerCase();
    if (lower.includes("risk") || lower.includes("block")) setAnswer("The enterprise workspace launch is the highest-leverage risk. It is blocking $96k in pipeline and needs security review ownership today.");
    else if (lower.includes("revenue") || lower.includes("sales")) setAnswer("Revenue is up 12.4% to $84.2k MRR. The strongest near-term upside is Acme's annual contract plus a Northwind expansion conversation.");
    else if (lower.includes("team") || lower.includes("capacity")) setAnswer("Team velocity is 87%. Platform capacity will drop 22% next sprint; moving one roadmap item and borrowing a reviewer will protect the launch date.");
    else setAnswer("Your company is healthy overall: revenue and runway are strong, but the enterprise launch is the priority because it connects product execution directly to three open deals.");
  }

  if (!data) return <LoadingState error={error} retry={load} />;
  return <main className="app-shell">
    <aside className={menuOpen ? "sidebar open" : "sidebar"}>
      <div className="brand"><span className="brand-mark">N</span><span>northstar</span></div>
      <div className="workspace"><span className="avatar small">A</span><span><b>Arc Labs</b><small>Growth workspace</small></span><span className="chevron">⌄</span></div>
      <nav aria-label="Main navigation"><p className="nav-label">Workspace</p>{navItems.map((item) => <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => { setActive(item); setMenuOpen(false); }}><span>{icons[item]}</span>{item}{item === "Overview" && pending.length ? <em>{pending.length}</em> : null}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><span>⚙</span>Settings</button><div className="profile"><span className="avatar">VS</span><span><b>Vijetha</b><small>Founder · Admin</small></span><span className="status-dot" /></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button><div className="breadcrumb"><span>Arc Labs</span><b>/</b><strong>{active}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♢<i>{pending.length}</i></button><button className="primary-button" onClick={() => document.getElementById("ask-input")?.focus()}>✦ Ask Northstar</button></div></header>
      <div className="content">{active === "Overview" ? <Overview data={data} pending={pending} approve={approve} loadingId={loadingId} query={query} setQuery={setQuery} answer={answer} ask={askNorthstar} /> : <ModulePage active={active} data={data} />}{error ? <div className="toast" role="alert">{error}</div> : null}</div>
    </section>
  </main>;
}

function LoadingState({ error, retry }: { error: string; retry: () => void }) {
  return <main className="loading-screen"><div className="loading-orbit"><span>N</span></div><h1>Aligning your company data</h1><p>{error || "Northstar is preparing today's operating picture…"}</p>{error ? <button className="primary-button" onClick={retry}>Try again</button> : <div className="loading-line"><i /></div>}</main>;
}

type OverviewProps = { data: DashboardData; pending: DashboardData["insights"]; approve: (id: number) => void; loadingId: number | null; query: string; setQuery: (value: string) => void; answer: string; ask: (event: React.FormEvent) => void };
function Overview({ data, pending, approve, loadingId, query, setQuery, answer, ask }: OverviewProps) {
  return <>
    <section className="page-heading"><div><span className="eyebrow"><i /> LIVE OPERATING PICTURE</span><h1>Good morning, Vijetha.</h1><p>Here’s what needs your attention across Arc Labs today.</p></div><div className="date-chip"><span>FRI</span><b>31</b><small>July 2026</small></div></section>
    <section className="briefing-card"><div className="briefing-glow"/><div className="ai-orb">✦</div><div className="briefing-copy"><span className="eyebrow violet">NORTHSTAR DAILY BRIEFING</span><h2>Strong growth. One execution risk needs a decision.</h2><p>Revenue momentum is healthy and runway remains comfortable. The enterprise workspace launch is six days behind and now blocks three deals worth <strong>$96k</strong>. Reassigning a security reviewer today protects the August 8 launch.</p><div className="briefing-meta"><span><i className="pulse"/> Updated 4 min ago</span><button onClick={() => document.getElementById("ask-input")?.focus()}>Explore analysis →</button></div></div><div className="health-score"><div><span>82</span><small>/100</small></div><b>Company health</b><em>Healthy</em></div></section>
    <section className="metric-grid">{data.metrics.map((metric) => <article className="metric-card" key={metric.id}><div className="metric-top"><span>{metric.label}</span><em className={metric.tone}>{metric.change}</em></div><h3>{metric.value}</h3><div className="progress-track"><i style={{ width: `${metric.progress}%` }}/></div><small>{metric.label === "Monthly revenue" ? "$108k target" : metric.label === "Cash runway" ? "12 mo threshold" : metric.label === "Sales pipeline" ? "$485k target" : "90% target"}</small></article>)}</section>
    <div className="dashboard-grid">
      <section className="panel insights-panel"><div className="panel-header"><div><span className="eyebrow coral">DECISION QUEUE</span><h2>Needs your attention</h2></div><span className="count-badge">{pending.length} open</span></div><div className="insight-list">{data.insights.map((insight) => <article className={`insight ${insight.status}`} key={insight.id}><span className={`severity ${insight.severity}`}>{insight.severity === "critical" ? "!" : insight.severity === "warning" ? "△" : "↗"}</span><div><div className="insight-title"><h3>{insight.title}</h3><span className={insight.severity}>{insight.severity}</span></div><p>{insight.detail}</p><div className="insight-actions">{insight.status === "approved" ? <span className="approved-mark">✓ Approved and added to plan</span> : <><button className="action-button" onClick={() => approve(insight.id)} disabled={loadingId === insight.id}>{loadingId === insight.id ? "Applying…" : insight.action}</button><button className="text-button">View context</button></>}</div></div></article>)}</div></section>
      <section className="panel goals-panel"><div className="panel-header"><div><span className="eyebrow blue">EXECUTION</span><h2>Company priorities</h2></div><button className="text-button">View all →</button></div><div className="initiative-list">{data.initiatives.map((item) => <article className="initiative" key={item.id}><div className="initiative-title"><span className="avatar mini">{item.owner[0]}</span><div><h3>{item.title}</h3><p>{item.team} · {item.owner}</p></div><em className={item.status === "At risk" ? "at-risk" : "on-track"}>{item.status}</em></div><div className="initiative-progress"><div className="progress-track"><i style={{ width: `${item.progress}%` }}/></div><span>{item.progress}%</span><small>{item.due}</small></div></article>)}</div></section>
      <section className="panel ask-panel"><div className="ask-heading"><div className="ai-orb small-orb">✦</div><div><span className="eyebrow violet">ASK YOUR STARTUP</span><h2>One answer, across every team.</h2></div></div>{answer ? <div className="answer-box"><span>✦</span><p>{answer}</p></div> : <div className="suggestions"><button onClick={() => setQuery("What is our biggest risk?")}>What is our biggest risk?</button><button onClick={() => setQuery("How is revenue trending?")}>How is revenue trending?</button><button onClick={() => setQuery("Where is team capacity tight?")}>Where is team capacity tight?</button></div>}<form className="ask-form" onSubmit={ask}><input id="ask-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about revenue, runway, goals, or blockers…" aria-label="Ask Northstar"/><button aria-label="Send question">↑</button></form></section>
      <section className="panel activity-panel"><div className="panel-header"><div><span className="eyebrow mint">COMPANY FEED</span><h2>Recent activity</h2></div><span className="live-label"><i/> Live</span></div><div className="activity-list">{data.activity.slice(0, 5).map((item) => <div className="activity" key={item.id}><span className="activity-icon">{item.actor === "Northstar AI" ? "✦" : item.actor[0]}</span><p><b>{item.actor}</b>{item.action}</p><small>{item.timestamp}</small></div>)}</div></section>
    </div>
  </>;
}

function ModulePage({ active, data }: { active: string; data: DashboardData }) {
  const config: Record<string, { eyebrow: string; title: string; copy: string }> = {
    Goals: { eyebrow: "STRATEGY & EXECUTION", title: "Every priority, clearly owned.", copy: "Connect company goals to initiatives, owners, and measurable outcomes." }, CRM: { eyebrow: "GROWTH PIPELINE", title: "$312k in active opportunities.", copy: "Focus the team on the deals with the strongest intent and clearest next action." }, Team: { eyebrow: "PEOPLE & CAPACITY", title: "Build without burning out.", copy: "See workload, hiring progress, and capacity risks before they slow execution." }, Reports: { eyebrow: "AUTOMATED REPORTING", title: "Your operating review is ready.", copy: "Turn live company data into a clear weekly update for your team and investors." },
  };
  const item = config[active];
  return <><section className="page-heading module-heading"><div><span className="eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{item.copy}</p></div><button className="primary-button">+ Create {active === "Goals" ? "goal" : active === "CRM" ? "deal" : active === "Team" ? "role" : "report"}</button></section><section className="module-hero"><div className="module-visual"><span className="ring ring-one"/><span className="ring ring-two"/><div className="module-score"><small>OPERATING SIGNAL</small><strong>{active === "CRM" ? "$96k" : active === "Team" ? "87%" : active === "Reports" ? "Ready" : "76%"}</strong><p>{active === "CRM" ? "Pipeline influenced by launch" : active === "Team" ? "Current team velocity" : active === "Reports" ? "Friday operating review" : "Average goal progress"}</p></div></div><div className="module-summary"><span className="eyebrow violet">NORTHSTAR ANALYSIS</span><h2>{active === "CRM" ? "Three deals need the enterprise launch." : active === "Team" ? "Protect next sprint's platform capacity." : active === "Reports" ? "Growth is strong; execution risk is concentrated." : "One priority needs intervention."}</h2><p>Northstar continuously connects work across product, sales, people, and finance so the reason behind every signal is visible.</p><button className="action-button">Review recommendation</button></div></section><section className="panel module-table"><div className="panel-header"><div><span className="eyebrow blue">LIVE DATA</span><h2>{active === "CRM" ? "Opportunity-linked priorities" : "Current company initiatives"}</h2></div><button className="text-button">Filter ⌄</button></div>{data.initiatives.map((row) => <div className="table-row" key={row.id}><span className="avatar mini">{row.owner[0]}</span><div><b>{row.title}</b><small>{row.team} · {row.owner}</small></div><span className="table-progress"><i style={{width:`${row.progress}%`}}/></span><em>{row.progress}%</em><span className={row.status === "At risk" ? "risk-text" : "good-text"}>{row.status}</span><small>{row.due}</small></div>)}</section></>;
}
