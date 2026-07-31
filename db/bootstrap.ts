import { env } from "cloudflare:workers";

export type DashboardData = {
  metrics: Array<{ id: number; label: string; value: string; change: string; tone: string; progress: number }>;
  initiatives: Array<{ id: number; title: string; owner: string; team: string; status: string; progress: number; due: string }>;
  insights: Array<{ id: number; severity: string; title: string; detail: string; action: string; status: string }>;
  activity: Array<{ id: number; actor: string; action: string; timestamp: string }>;
};

function database() { if (!env.DB) throw new Error("Database binding is unavailable"); return env.DB; }

export async function ensureDatabase() {
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, value TEXT NOT NULL, change TEXT NOT NULL, tone TEXT NOT NULL, progress REAL NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS initiatives (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, owner TEXT NOT NULL, team TEXT NOT NULL, status TEXT NOT NULL, progress INTEGER NOT NULL, due TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS insights (id INTEGER PRIMARY KEY AUTOINCREMENT, severity TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, timestamp TEXT NOT NULL)`),
  ]);
  const count = await db.prepare("SELECT COUNT(*) AS total FROM metrics").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;
  await db.batch([
    db.prepare("INSERT INTO metrics (label,value,change,tone,progress) VALUES (?,?,?,?,?)").bind("Monthly revenue", "$84.2k", "+12.4%", "positive", 78),
    db.prepare("INSERT INTO metrics (label,value,change,tone,progress) VALUES (?,?,?,?,?)").bind("Cash runway", "14.2 mo", "Healthy", "positive", 71),
    db.prepare("INSERT INTO metrics (label,value,change,tone,progress) VALUES (?,?,?,?,?)").bind("Sales pipeline", "$312k", "+8 deals", "neutral", 64),
    db.prepare("INSERT INTO metrics (label,value,change,tone,progress) VALUES (?,?,?,?,?)").bind("Team velocity", "87%", "-3.1%", "warning", 87),
    db.prepare("INSERT INTO initiatives (title,owner,team,status,progress,due) VALUES (?,?,?,?,?,?)").bind("Launch enterprise workspace", "Maya", "Product", "At risk", 68, "Aug 08"),
    db.prepare("INSERT INTO initiatives (title,owner,team,status,progress,due) VALUES (?,?,?,?,?,?)").bind("Close Acme annual contract", "Noah", "Sales", "On track", 82, "Aug 04"),
    db.prepare("INSERT INTO initiatives (title,owner,team,status,progress,due) VALUES (?,?,?,?,?,?)").bind("Hire senior platform engineer", "Isha", "People", "In review", 54, "Aug 15"),
    db.prepare("INSERT INTO initiatives (title,owner,team,status,progress,due) VALUES (?,?,?,?,?,?)").bind("Reduce onboarding time to 2 days", "Liam", "Success", "On track", 76, "Aug 12"),
    db.prepare("INSERT INTO insights (severity,title,detail,action,status) VALUES (?,?,?,?,?)").bind("critical", "Enterprise launch is blocking $96k in pipeline", "Three high-intent deals depend on SSO. The launch is six days behind after the security review stalled.", "Create recovery plan", "pending"),
    db.prepare("INSERT INTO insights (severity,title,detail,action,status) VALUES (?,?,?,?,?)").bind("warning", "Engineering capacity drops next sprint", "Planned leave reduces platform capacity by 22%. Two roadmap items are likely to slip.", "Rebalance workload", "pending"),
    db.prepare("INSERT INTO insights (severity,title,detail,action,status) VALUES (?,?,?,?,?)").bind("opportunity", "Expansion signal detected at Northwind", "Usage grew 41% this month and eight new collaborators joined. The account is ready for an expansion conversation.", "Draft outreach", "pending"),
    db.prepare("INSERT INTO activity (actor,action,timestamp) VALUES (?,?,?)").bind("Northstar AI", "Prepared the Friday operating review", "12 min ago"),
    db.prepare("INSERT INTO activity (actor,action,timestamp) VALUES (?,?,?)").bind("Maya", "Updated enterprise launch to 68%", "38 min ago"),
    db.prepare("INSERT INTO activity (actor,action,timestamp) VALUES (?,?,?)").bind("Noah", "Moved Acme to legal review", "1 hr ago"),
  ]);
}

export async function getDashboard(): Promise<DashboardData> {
  await ensureDatabase(); const db = database();
  const [metrics, initiatives, insights, activity] = await Promise.all([
    db.prepare("SELECT * FROM metrics ORDER BY id").all(), db.prepare("SELECT * FROM initiatives ORDER BY id").all(),
    db.prepare("SELECT * FROM insights ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, id").all(), db.prepare("SELECT * FROM activity ORDER BY id DESC LIMIT 8").all(),
  ]);
  return { metrics: metrics.results as DashboardData["metrics"], initiatives: initiatives.results as DashboardData["initiatives"], insights: insights.results as DashboardData["insights"], activity: activity.results as DashboardData["activity"] };
}

export async function approveInsight(id: number) {
  await ensureDatabase(); const db = database();
  const insight = await db.prepare("SELECT title, action FROM insights WHERE id = ?").bind(id).first<{ title: string; action: string }>();
  if (!insight) return false;
  await db.batch([db.prepare("UPDATE insights SET status = 'approved' WHERE id = ?").bind(id), db.prepare("INSERT INTO activity (actor,action,timestamp) VALUES (?,?,?)").bind("You", `Approved: ${insight.action}`, "Just now")]);
  return true;
}
