import { env } from "cloudflare:workers";

export type WorkspaceRecord = { id: string; type: string; title: string; subtitle: string; status: string; value: string; progress: number; owner: string; created_at: string; updated_at: string };
export type WorkspaceSession = { user: { id: string; email: string; name: string }; organization: { id: string; name: string; slug: string }; role: "owner" | "member" };

function db() { if (!env.DB) throw new Error("Database binding is unavailable"); return env.DB; }
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function ensureWorkspaceDatabase() {
  const database = db();
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS memberships (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, organization_id TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS workspace_records (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, subtitle TEXT NOT NULL, status TEXT NOT NULL, value TEXT NOT NULL, progress INTEGER NOT NULL, owner TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    database.prepare("CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id)"),
    database.prepare("CREATE INDEX IF NOT EXISTS workspace_records_org_type_idx ON workspace_records(organization_id, type)"),
  ]);
}

export async function getOrCreateSession(email: string, displayName: string): Promise<WorkspaceSession> {
  await ensureWorkspaceDatabase(); const database = db();
  let user = await database.prepare("SELECT id,email,name FROM users WHERE email = ?").bind(email.toLowerCase()).first<{ id:string; email:string; name:string }>();
  if (!user) {
    const userId=id("usr"), orgId=id("org"), created=now();
    const companyName = `${displayName.split(" ")[0] || "My"}'s Company`;
    const slug = `workspace-${crypto.randomUUID().slice(0,8)}`;
    await database.batch([
      database.prepare("INSERT INTO users (id,email,name,created_at) VALUES (?,?,?,?)").bind(userId,email.toLowerCase(),displayName,created),
      database.prepare("INSERT INTO organizations (id,name,slug,created_at) VALUES (?,?,?,?)").bind(orgId,companyName,slug,created),
      database.prepare("INSERT INTO memberships (id,user_id,organization_id,role,created_at) VALUES (?,?,?,?,?)").bind(id("mem"),userId,orgId,"owner",created),
    ]);
    user={id:userId,email:email.toLowerCase(),name:displayName};
    await seedWorkspace(orgId, displayName);
  }
  const membership = await database.prepare("SELECT organization_id,role FROM memberships WHERE user_id = ? LIMIT 1").bind(user.id).first<{organization_id:string;role:"owner"|"member"}>();
  if (!membership) throw new Error("Workspace membership is unavailable");
  const organization = await database.prepare("SELECT id,name,slug FROM organizations WHERE id = ?").bind(membership.organization_id).first<{id:string;name:string;slug:string}>();
  if (!organization) throw new Error("Workspace is unavailable");
  return { user, organization, role:membership.role };
}

async function seedWorkspace(organizationId:string, owner:string) {
  const database=db(), created=now();
  const rows = [
    ["goal","Launch enterprise workspace","Product milestone tied to three active deals","At risk","68%",68],
    ["goal","Reduce onboarding to two days","Customer success operating target","On track","76%",76],
    ["deal","Acme annual contract","Legal review · Enterprise plan","Negotiation","$96k",82],
    ["deal","Northwind expansion","Usage increased 41% this month","Qualified","$48k",64],
    ["role","Senior platform engineer","6 candidates · 2 interviews","Interviewing","Priority",54],
    ["report","Friday operating review","Auto-generated company briefing","Ready","Jul 31",100],
  ];
  await database.batch(rows.map(row => database.prepare("INSERT INTO workspace_records (id,organization_id,type,title,subtitle,status,value,progress,owner,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(id("rec"),organizationId,row[0],row[1],row[2],row[3],row[4],row[5],owner,created,created)));
}

export async function listRecords(session:WorkspaceSession) {
  const result=await db().prepare("SELECT id,type,title,subtitle,status,value,progress,owner,created_at,updated_at FROM workspace_records WHERE organization_id = ? ORDER BY updated_at DESC").bind(session.organization.id).all();
  return result.results as WorkspaceRecord[];
}
export async function createRecord(session:WorkspaceSession,input:{type:string;title:string;subtitle?:string;status?:string;value?:string;progress?:number}) {
  const recordId=id("rec"), timestamp=now();
  await db().prepare("INSERT INTO workspace_records (id,organization_id,type,title,subtitle,status,value,progress,owner,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(recordId,session.organization.id,input.type,input.title,input.subtitle||"New workspace record",input.status||"New",input.value||"—",Math.max(0,Math.min(100,input.progress||0)),session.user.name,timestamp,timestamp).run();
  return recordId;
}
export async function updateRecord(session:WorkspaceSession,recordId:string,input:{title?:string;status?:string;progress?:number}) {
  const existing=await db().prepare("SELECT id FROM workspace_records WHERE id = ? AND organization_id = ?").bind(recordId,session.organization.id).first();
  if(!existing) return false;
  await db().prepare("UPDATE workspace_records SET title=COALESCE(?,title),status=COALESCE(?,status),progress=COALESCE(?,progress),updated_at=? WHERE id=? AND organization_id=?").bind(input.title??null,input.status??null,input.progress??null,now(),recordId,session.organization.id).run(); return true;
}
export async function deleteRecord(session:WorkspaceSession,recordId:string) {
  if(session.role!=="owner") throw new Error("Only workspace owners can delete records");
  await db().prepare("DELETE FROM workspace_records WHERE id = ? AND organization_id = ?").bind(recordId,session.organization.id).run();
}
