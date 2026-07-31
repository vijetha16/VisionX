"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/db/bootstrap";

const navItems = ["Overview", "Goals", "CRM", "Team", "Reports"] as const;
const icons: Record<string, string> = { Overview: "⌂", Goals: "◎", CRM: "◇", Team: "◌", Reports: "▤" };

export function StartupOS({ user }: { user?: { name: string; email: string } }) {
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
      <div className="sidebar-bottom"><button className="nav-item"><span>⚙</span>Settings</button><div className="profile"><span className="avatar">{user?.name?.slice(0,2).toUpperCase() || "VS"}</span><span><b>{user?.name || "Vijetha"}</b><small>{user?.email || "Founder · Admin"}</small></span><span className="status-dot" /></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button><div className="breadcrumb"><span>Arc Labs</span><b>/</b><strong>{active}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♢<i>{pending.length}</i></button><button className="primary-button" onClick={() => document.getElementById("ask-input")?.focus()}>✦ Ask Northstar</button><a className="signout-button" href="/signout-with-chatgpt?return_to=%2F">Sign out</a></div></header>
      <div className="content"><AppLauncher active={active} setActive={setActive} pending={pending.length}/>{active === "Overview" ? <Overview data={data} pending={pending} approve={approve} loadingId={loadingId} query={query} setQuery={setQuery} answer={answer} ask={askNorthstar} /> : <ModulePage active={active} data={data} />}{error ? <div className="toast" role="alert">{error}</div> : null}</div>
    </section>
  </main>;
}

function AppLauncher({ active, setActive, pending }: { active: (typeof navItems)[number]; setActive: (value: (typeof navItems)[number]) => void; pending: number }) {
  const apps: Array<{ name: string; label: string; icon: string; target: (typeof navItems)[number]; tone: string; badge?: string }> = [
    { name: "Founder Desk", label: "Today", icon: "✦", target: "Overview", tone: "ink", badge: pending ? `${pending}` : undefined },
    { name: "Pipeline", label: "$312k open", icon: "↗", target: "CRM", tone: "coral" },
    { name: "Projects", label: "4 priorities", icon: "✓", target: "Goals", tone: "sky" },
    { name: "People", label: "87% velocity", icon: "◌", target: "Team", tone: "jade" },
    { name: "Runway", label: "14.2 months", icon: "⌁", target: "Reports", tone: "amber" },
    { name: "Reviews", label: "Friday ready", icon: "▤", target: "Reports", tone: "plum" },
  ];
  return <section className="app-launcher" aria-label="Operating apps"><div className="launcher-heading"><span>YOUR OPERATING APPS</span><button>Customize</button></div><div className="app-grid">{apps.map((app) => <button key={app.name} className={active === app.target ? "app-tile selected" : "app-tile"} onClick={() => setActive(app.target)}><span className={`app-icon ${app.tone}`}>{app.icon}{app.badge ? <i>{app.badge}</i> : null}</span><span><b>{app.name}</b><small>{app.label}</small></span></button>)}</div></section>;
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
    <BusinessCharts/>
    <div className="dashboard-grid">
      <section className="panel insights-panel"><div className="panel-header"><div><span className="eyebrow coral">DECISION QUEUE</span><h2>Needs your attention</h2></div><span className="count-badge">{pending.length} open</span></div><div className="insight-list">{data.insights.map((insight) => <article className={`insight ${insight.status}`} key={insight.id}><span className={`severity ${insight.severity}`}>{insight.severity === "critical" ? "!" : insight.severity === "warning" ? "△" : "↗"}</span><div><div className="insight-title"><h3>{insight.title}</h3><span className={insight.severity}>{insight.severity}</span></div><p>{insight.detail}</p><div className="insight-actions">{insight.status === "approved" ? <span className="approved-mark">✓ Approved and added to plan</span> : <><button className="action-button" onClick={() => approve(insight.id)} disabled={loadingId === insight.id}>{loadingId === insight.id ? "Applying…" : insight.action}</button><button className="text-button">View context</button></>}</div></div></article>)}</div></section>
      <section className="panel goals-panel"><div className="panel-header"><div><span className="eyebrow blue">EXECUTION</span><h2>Company priorities</h2></div><button className="text-button">View all →</button></div><div className="initiative-list">{data.initiatives.map((item) => <article className="initiative" key={item.id}><div className="initiative-title"><span className="avatar mini">{item.owner[0]}</span><div><h3>{item.title}</h3><p>{item.team} · {item.owner}</p></div><em className={item.status === "At risk" ? "at-risk" : "on-track"}>{item.status}</em></div><div className="initiative-progress"><div className="progress-track"><i style={{ width: `${item.progress}%` }}/></div><span>{item.progress}%</span><small>{item.due}</small></div></article>)}</div></section>
      <section className="panel ask-panel"><div className="ask-heading"><div className="ai-orb small-orb">✦</div><div><span className="eyebrow violet">ASK YOUR STARTUP</span><h2>One answer, across every team.</h2></div></div>{answer ? <div className="answer-box"><span>✦</span><p>{answer}</p></div> : <div className="suggestions"><button onClick={() => setQuery("What is our biggest risk?")}>What is our biggest risk?</button><button onClick={() => setQuery("How is revenue trending?")}>How is revenue trending?</button><button onClick={() => setQuery("Where is team capacity tight?")}>Where is team capacity tight?</button></div>}<form className="ask-form" onSubmit={ask}><input id="ask-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about revenue, runway, goals, or blockers…" aria-label="Ask Northstar"/><button aria-label="Send question">↑</button></form></section>
      <section className="panel activity-panel"><div className="panel-header"><div><span className="eyebrow mint">COMPANY FEED</span><h2>Recent activity</h2></div><span className="live-label"><i/> Live</span></div><div className="activity-list">{data.activity.slice(0, 5).map((item) => <div className="activity" key={item.id}><span className="activity-icon">{item.actor === "Northstar AI" ? "✦" : item.actor[0]}</span><p><b>{item.actor}</b>{item.action}</p><small>{item.timestamp}</small></div>)}</div></section>
    </div>
  </>;
}

function BusinessCharts() {
  const stages = [
    { name: "Discovery", value: "$1.5M", width: 100, tone: "sky" },
    { name: "Evaluation", value: "$1.2M", width: 82, tone: "jade" },
    { name: "Proposal", value: "$900k", width: 64, tone: "amber" },
    { name: "Negotiation", value: "$450k", width: 46, tone: "coral" },
    { name: "Closed won", value: "$150k", width: 28, tone: "plum" },
  ];
  const points = [78, 72, 71, 60, 55, 44, 38];
  return <section className="visual-grid">
    <article className="visual-card funnel-card"><div className="visual-title"><div><span className="eyebrow blue">SALES FLOW</span><h2>Pipeline overview</h2></div><button className="period-button">This quarter ⌄</button></div><div className="funnel-body"><div className="funnel-shape">{stages.map((stage) => <div key={stage.name} className={`funnel-stage ${stage.tone}`} style={{width:`${stage.width}%`}} />)}</div><div className="funnel-labels">{stages.map((stage) => <div key={stage.name}><span>{stage.name}</span><b>{stage.value}</b></div>)}</div></div><button className="card-link">View full pipeline <span>→</span></button></article>
    <article className="visual-card runway-card"><div className="visual-title"><div><span className="eyebrow mint">FINANCIAL HEALTH</span><h2>Runway forecast</h2></div><span className="healthy-pill">Healthy</span></div><div className="line-chart"><div className="y-labels"><span>18 mo</span><span>12 mo</span><span>6 mo</span><span>0 mo</span></div><div className="plot"><div className="grid-line one"/><div className="grid-line two"/><div className="grid-line three"/>{points.map((point,index) => <span key={index} className="chart-point" style={{left:`${index*15+4}%`,top:`${100-point}%`}}/>)}<div className="chart-summary"><b>14.2 months</b><span>of runway</span></div><div className="x-labels"><span>Aug</span><span>Oct</span><span>Dec</span><span>Feb</span></div></div></div><div className="runway-note"><span>⌁</span><p><b>Revenue growth extends runway</b>Current MRR adds approximately 1.8 months to the base forecast.</p></div></article>
  </section>;
}

type WorkspaceRecord = { id:string; type:string; title:string; subtitle:string; status:string; value:string; progress:number; owner:string };
type WorkspacePayload = { session:{organization:{name:string};role:"owner"|"member"}; records:WorkspaceRecord[] };

function ModulePage({ active, data }: { active: string; data: DashboardData }) {
  const [workspace,setWorkspace]=useState<WorkspacePayload|null>(null);
  const [showCreate,setShowCreate]=useState(false);
  const [saving,setSaving]=useState(false);
  const [moduleError,setModuleError]=useState("");
  const [form,setForm]=useState({title:"",subtitle:"",value:""});
  useEffect(()=>{fetch("/api/workspace").then(async response=>{if(!response.ok)throw new Error((await response.json()).error||"Unable to load workspace");return response.json() as Promise<WorkspacePayload>;}).then(setWorkspace).catch(error=>setModuleError(error instanceof Error?error.message:"Unable to load workspace"));},[]);
  const type=active==="Goals"?"goal":active==="CRM"?"deal":active==="Team"?"role":"report";
  const config: Record<string, { eyebrow:string; title:string; copy:string; singular:string; defaultStatus:string }> = {
    Goals:{eyebrow:"STRATEGY & EXECUTION",title:"Every priority, clearly owned.",copy:"Connect company goals to initiatives, owners, and measurable outcomes.",singular:"goal",defaultStatus:"Planned"},
    CRM:{eyebrow:"GROWTH PIPELINE",title:`${data.metrics[2]?.value||"Pipeline"} in active opportunities.`,copy:"Focus the team on the deals with the strongest intent and clearest next action.",singular:"deal",defaultStatus:"Qualified"},
    Team:{eyebrow:"PEOPLE & CAPACITY",title:"Build without burning out.",copy:"See workload, hiring progress, and capacity risks before they slow execution.",singular:"role",defaultStatus:"Open"},
    Reports:{eyebrow:"AUTOMATED REPORTING",title:"Your operating review is ready.",copy:"Turn live company data into a clear weekly update for your team and investors.",singular:"report",defaultStatus:"Draft"},
  };
  const item=config[active],records=workspace?.records.filter(record=>record.type===type)||[];
  async function mutate(method:"POST"|"PATCH"|"DELETE",body:Record<string,unknown>){setSaving(true);setModuleError("");try{const response=await fetch("/api/workspace",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const payload=await response.json() as WorkspacePayload&{error?:string};if(!response.ok)throw new Error(payload.error||"Unable to save record");setWorkspace(payload);return true;}catch(error){setModuleError(error instanceof Error?error.message:"Unable to save record");return false;}finally{setSaving(false);}}
  async function create(event:React.FormEvent){event.preventDefault();if(!form.title.trim())return;const ok=await mutate("POST",{type,title:form.title,subtitle:form.subtitle||`New ${item.singular}`,value:form.value||"—",status:item.defaultStatus,progress:0});if(ok){setForm({title:"",subtitle:"",value:""});setShowCreate(false);}}
  return <>
    <section className="page-heading module-heading"><div><span className="eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{workspace?.session.organization.name||item.copy} · {item.copy}</p></div><button className="primary-button" onClick={()=>setShowCreate(true)}>+ Create {item.singular}</button></section>
    <section className="module-hero"><div className="module-visual"><span className="ring ring-one"/><span className="ring ring-two"/><div className="module-score"><small>LIVE RECORDS</small><strong>{workspace?records.length:"—"}</strong><p>{item.singular}s in this company workspace</p></div></div><div className="module-summary"><span className="eyebrow violet">TENANT-SAFE WORKSPACE</span><h2>{active==="CRM"?"Move qualified demand toward revenue.":active==="Team"?"Keep hiring connected to capacity.":active==="Reports"?"Turn operating data into decisions.":"Keep execution tied to outcomes."}</h2><p>Every record is saved to your company workspace and protected by server-side membership and role checks.</p><span className="role-pill">{workspace?.session.role||"loading"} access</span></div></section>
    <section className="panel module-table"><div className="panel-header"><div><span className="eyebrow blue">LIVE DATABASE</span><h2>{records.length} {item.singular}{records.length===1?"":"s"}</h2></div><span className="save-state">{saving?"Saving…":"All changes saved"}</span></div>{moduleError?<div className="module-error">{moduleError}</div>:null}{!workspace?<div className="module-empty">Loading your workspace…</div>:records.length===0?<div className="module-empty">No {item.singular}s yet. Create the first one.</div>:records.map(record=><div className="record-row" key={record.id}><span className={`record-icon ${type}`}>{type==="goal"?"◎":type==="deal"?"↗":type==="role"?"◌":"▤"}</span><div className="record-copy"><b>{record.title}</b><small>{record.subtitle} · {record.owner}</small></div><span className="table-progress"><i style={{width:`${record.progress}%`}}/></span><em>{record.value}</em><button className="status-button" onClick={()=>mutate("PATCH",{id:record.id,status:record.status==="Complete"?item.defaultStatus:"Complete",progress:record.status==="Complete"?50:100})}>{record.status}</button>{workspace.session.role==="owner"?<button className="delete-button" onClick={()=>mutate("DELETE",{id:record.id})} aria-label={`Delete ${record.title}`}>×</button>:null}</div>)}</section>
    {showCreate?<div className="modal-backdrop" role="presentation" onMouseDown={()=>setShowCreate(false)}><form className="create-modal" onSubmit={create} onMouseDown={event=>event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow coral">NEW {item.singular.toUpperCase()}</span><h2>Create {item.singular}</h2></div><button type="button" onClick={()=>setShowCreate(false)}>×</button></div><label>Title<input autoFocus value={form.title} onChange={event=>setForm({...form,title:event.target.value})} placeholder={`Name this ${item.singular}`} required/></label><label>Description<input value={form.subtitle} onChange={event=>setForm({...form,subtitle:event.target.value})} placeholder="Add useful context"/></label><label>{type==="deal"?"Deal value":"Target or label"}<input value={form.value} onChange={event=>setForm({...form,value:event.target.value})} placeholder={type==="deal"?"$25k":"Q3"}/></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowCreate(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving?"Creating…":`Create ${item.singular}`}</button></div></form></div>:null}
  </>;
}
