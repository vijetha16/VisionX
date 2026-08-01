import { env } from "cloudflare:workers";

export type AgentResult={score:string;confidence:number;title:string;summary:string;items:string[];evidence:string[];assumptions:string[];risks:string[];metrics:Array<{label:string;value:string;source:string}>;mode:"live"|"demo";runId:string};
const database=()=>env.DB;
export async function ensureAgentDatabase(){await database().batch([
  database().prepare("CREATE TABLE IF NOT EXISTS agent_runs (id TEXT PRIMARY KEY, organization_email TEXT NOT NULL, agent_type TEXT NOT NULL, input TEXT NOT NULL, status TEXT NOT NULL, output_json TEXT NOT NULL, mode TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT)"),
  database().prepare("CREATE TABLE IF NOT EXISTS agent_audit_log (id TEXT PRIMARY KEY, run_id TEXT NOT NULL, actor_email TEXT NOT NULL, event TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL)"),
  database().prepare("CREATE INDEX IF NOT EXISTS agent_runs_org_idx ON agent_runs(organization_email, created_at)"),
]);}
export async function saveAgentRun(email:string,type:string,input:string,result:Omit<AgentResult,"runId">){await ensureAgentDatabase();const runId=`run_${crypto.randomUUID()}`,now=new Date().toISOString();await database().batch([
  database().prepare("INSERT INTO agent_runs (id,organization_email,agent_type,input,status,output_json,mode,created_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(runId,email,type,input,"completed",JSON.stringify(result),result.mode,now,now),
  database().prepare("INSERT INTO agent_audit_log (id,run_id,actor_email,event,detail,created_at) VALUES (?,?,?,?,?,?)").bind(`audit_${crypto.randomUUID()}`,runId,email,"agent.completed",`${type} completed in ${result.mode} mode`,now),
]);return runId;}
export async function approveAgentRun(email:string,runId:string){await ensureAgentDatabase();const found=await database().prepare("SELECT id FROM agent_runs WHERE id=? AND organization_email=?").bind(runId,email).first();if(!found)return false;await database().prepare("INSERT INTO agent_audit_log (id,run_id,actor_email,event,detail,created_at) VALUES (?,?,?,?,?,?)").bind(`audit_${crypto.randomUUID()}`,runId,email,"agent.approved","Human approval recorded",new Date().toISOString()).run();return true;}
