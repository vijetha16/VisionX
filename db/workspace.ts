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
    database.prepare("CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY, headline TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', skills TEXT NOT NULL DEFAULT '', resume_name TEXT NOT NULL DEFAULT '', resume_key TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS connections (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, recipient_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)"),
    database.prepare("CREATE INDEX IF NOT EXISTS connections_people_idx ON connections(requester_id, recipient_id)"),
  ]);
}

export async function getNetwork(session:WorkspaceSession){
  await ensureWorkspaceDatabase(); const database=db();
  const seeds=[["Maya Chen","maya@northstar.demo","Product leader","San Francisco"],["Arjun Rao","arjun@northstar.demo","Growth strategist","Bengaluru"],["Leah Kim","leah@northstar.demo","Founding engineer","Seoul"],["Noah Williams","noah@northstar.demo","Design systems lead","London"]];
  for(const [name,email] of seeds){const found=await database.prepare("SELECT id FROM users WHERE email=?").bind(email).first<{id:string}>();if(!found)await database.prepare("INSERT INTO users (id,email,name,created_at) VALUES (?,?,?,?)").bind(id("usr"),email,name,now()).run();}
  const profile=await database.prepare("SELECT headline,location,bio,skills,resume_name FROM profiles WHERE user_id=?").bind(session.user.id).first();
  const people=await database.prepare("SELECT u.id,u.name,u.email,p.headline,p.location,p.skills,CASE WHEN c.id IS NULL THEN 'none' ELSE c.status END AS connection_status FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN connections c ON ((c.requester_id=? AND c.recipient_id=u.id) OR (c.recipient_id=? AND c.requester_id=u.id)) WHERE u.id<>? ORDER BY u.name").bind(session.user.id,session.user.id,session.user.id).all();
  return {profile:{name:session.user.name,email:session.user.email,headline:"",location:"",bio:"",skills:"",resume_name:"",...(profile||{})},people:people.results};
}
export async function saveProfile(session:WorkspaceSession,input:{name?:string;headline?:string;location?:string;bio?:string;skills?:string}){const database=db();await database.prepare("UPDATE users SET name=? WHERE id=?").bind(input.name||session.user.name,session.user.id).run();await database.prepare("INSERT INTO profiles (user_id,headline,location,bio,skills,resume_name,resume_key,updated_at) VALUES (?,?,?,?,?,'','',?) ON CONFLICT(user_id) DO UPDATE SET headline=excluded.headline,location=excluded.location,bio=excluded.bio,skills=excluded.skills,updated_at=excluded.updated_at").bind(session.user.id,input.headline||"",input.location||"",input.bio||"",input.skills||"",now()).run();}
export async function connect(session:WorkspaceSession,recipientId:string){const existing=await db().prepare("SELECT id,status FROM connections WHERE ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?))").bind(session.user.id,recipientId,recipientId,session.user.id).first<{id:string;status:string}>();if(existing)return existing.status;await db().prepare("INSERT INTO connections (id,requester_id,recipient_id,status,created_at) VALUES (?,?,?,?,?)").bind(id("con"),session.user.id,recipientId,"connected",now()).run();return "connected";}
export async function saveResume(session:WorkspaceSession,name:string,key:string){await db().prepare("INSERT INTO profiles (user_id,headline,location,bio,skills,resume_name,resume_key,updated_at) VALUES (?,'','','','',?,?,?) ON CONFLICT(user_id) DO UPDATE SET resume_name=excluded.resume_name,resume_key=excluded.resume_key,updated_at=excluded.updated_at").bind(session.user.id,name,key,now()).run();}

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
