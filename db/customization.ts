import { env } from "cloudflare:workers";
import type { WorkspaceSession } from "./workspace";

export type WorkflowNode={id:string;kind:"event"|"condition"|"action";label:string;detail:string};
export type GuardrailPlan={level:1|2|3|4;classification:string;risk:string;compatibility:number;rationale:string;steps:string[];nodes:WorkflowNode[];coreFilesModified:number};
const database=()=>env.DB,now=()=>new Date().toISOString(),id=(prefix:string)=>`${prefix}_${crypto.randomUUID()}`;

export async function ensureCustomizationDatabase(){await database().batch([
  database().prepare("CREATE TABLE IF NOT EXISTS customization_rules (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, author_id TEXT NOT NULL, title TEXT NOT NULL, requirement TEXT NOT NULL, target_module TEXT NOT NULL, level INTEGER NOT NULL, compatibility INTEGER NOT NULL, status TEXT NOT NULL, plan_json TEXT NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  database().prepare("CREATE TABLE IF NOT EXISTS customization_audit (id TEXT PRIMARY KEY, rule_id TEXT NOT NULL, organization_id TEXT NOT NULL, actor_id TEXT NOT NULL, event TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
  database().prepare("CREATE INDEX IF NOT EXISTS customization_rules_org_updated_idx ON customization_rules(organization_id,updated_at)"),
  database().prepare("CREATE INDEX IF NOT EXISTS customization_audit_rule_created_idx ON customization_audit(rule_id,created_at)"),
]);}

export function analyzeRequirement(requirement:string,module:string):GuardrailPlan{
  const text=requirement.toLowerCase();
  const core=/modify core|change source|patch core|database engine|override core|edit source/.test(text);
  const extension=/webhook|external api|plugin|integration|microservice/.test(text);
  const workflow=/whenever|when |if |approval|notify|automate|trigger|below|above|exceeds|create a|send /.test(text);
  const level:1|2|3|4=core?4:extension?3:workflow?2:1;
  const labels={1:"Standard Configuration",2:"Workflow Automation",3:"Independent Extension",4:"Core Modification"} as const;
  const compatibility={1:100,2:100,3:95,4:22}[level];
  const threshold=requirement.match(/(?:below|under|less than)\s*[₹$]?([\d,]+)/i)?.[1];
  const approval=requirement.match(/(?:exceeds|above|over|greater than)\s*[₹$]?([\d,]+)/i)?.[1];
  const nodes:WorkflowNode[]=level===2?[
    {id:"event",kind:"event",label:`${module} event`,detail:threshold?`Trigger when value falls below ${threshold}`:"Trigger when the specified business event occurs"},
    {id:"condition",kind:"condition",label:"Policy gate",detail:approval?`Route for approval above ₹${approval}`:"Evaluate the stated conditions and thresholds"},
    {id:"action",kind:"action",label:"Automated action",detail:/purchase/.test(text)?"Create a draft purchase request":"Create the requested business action"},
    {id:"notify",kind:"action",label:"Notify owner",detail:/manager/.test(text)?"Notify the responsible manager":"Notify the accountable team member"},
  ]:level===1?[{id:"config",kind:"action",label:"Configuration update",detail:"Apply metadata, layout, field, or permission changes"}]:level===3?[{id:"hook",kind:"event",label:"Extension event",detail:"Publish a versioned event outside the core"},{id:"plugin",kind:"action",label:"Isolated extension",detail:"Execute in a sandboxed plugin or webhook"}]:[];
  const rationale=level===4?"This request requires direct changes to core modules. AdaptOS blocks it by default and recommends an isolated alternative.":level===3?"The request depends on external or custom logic, so it will run independently from the upgradeable core.":level===2?"The requirement maps cleanly to an event, one or more conditions, and approval-safe actions without source changes.":"The request can be delivered entirely through safe metadata and permission configuration.";
  const steps=level===4?["Block direct core modification","Identify the intended business outcome","Redesign as a Level 2 workflow or Level 3 extension","Require owner review before implementation"]:level===3?["Define the versioned event contract","Create an isolated extension endpoint","Add retry and failure handling","Test against a sandbox workspace","Enable with a reversible feature flag"]:level===2?["Register the business event trigger","Translate thresholds into condition gates","Create approval and action nodes","Assign notification recipients","Test with sample records","Activate with instant rollback"]:["Update workspace metadata","Apply field visibility and layout rules","Validate role permissions","Publish the reversible configuration"];
  return {level,classification:labels[level],risk:level<=2?"0% · 100% upgrade safe":level===3?"Low · 95% upgrade safe":"High · blocked by default",compatibility,rationale,steps,nodes,coreFilesModified:0};
}

export async function listCustomizations(session:WorkspaceSession){await ensureCustomizationDatabase();const rules=await database().prepare("SELECT id,title,requirement,target_module,level,compatibility,status,plan_json,version,created_at,updated_at FROM customization_rules WHERE organization_id=? ORDER BY updated_at DESC LIMIT 30").bind(session.organization.id).all<Record<string,unknown>>();return {session,rules:rules.results.map(rule=>({...rule,plan:JSON.parse(String(rule.plan_json)),plan_json:undefined}))};}
export async function createCustomization(session:WorkspaceSession,input:{requirement:string;module:string}){if(session.role==="viewer")throw new Error("Viewer access cannot create customizations");await ensureCustomizationDatabase();const plan=analyzeRequirement(input.requirement,input.module),ruleId=id("rule"),timestamp=now(),title=input.requirement.slice(0,72);await database().batch([
  database().prepare("INSERT INTO customization_rules (id,organization_id,author_id,title,requirement,target_module,level,compatibility,status,plan_json,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(ruleId,session.organization.id,session.user.id,title,input.requirement,input.module,plan.level,plan.compatibility,plan.level===4?"blocked":"draft",JSON.stringify(plan),1,timestamp,timestamp),
  database().prepare("INSERT INTO customization_audit (id,rule_id,organization_id,actor_id,event,snapshot_json,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("audit"),ruleId,session.organization.id,session.user.id,"guardrail.analyzed",JSON.stringify(plan),timestamp),
]);return ruleId;}
export async function updateCustomization(session:WorkspaceSession,ruleId:string,action:"approve"|"rollback"){if(!["owner","admin"].includes(session.role))throw new Error("Only an owner or team leader can approve or roll back workflows");await ensureCustomizationDatabase();const rule=await database().prepare("SELECT id,status,level,version,plan_json FROM customization_rules WHERE id=? AND organization_id=?").bind(ruleId,session.organization.id).first<{id:string;status:string;level:number;version:number;plan_json:string}>();if(!rule)throw new Error("Customization not found");if(action==="approve"&&rule.level===4)throw new Error("Level 4 core modifications are blocked by the guardrail");const status=action==="approve"?"active":"rolled_back",version=rule.version+1,timestamp=now();await database().batch([
  database().prepare("UPDATE customization_rules SET status=?,version=?,updated_at=? WHERE id=? AND organization_id=?").bind(status,version,timestamp,ruleId,session.organization.id),
  database().prepare("INSERT INTO customization_audit (id,rule_id,organization_id,actor_id,event,snapshot_json,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("audit"),ruleId,session.organization.id,session.user.id,action==="approve"?"workflow.activated":"version.rolled_back",rule.plan_json,timestamp),
]);}
