import { env } from "cloudflare:workers";
import { approveAgentRun, saveAgentRun, type AgentResult } from "@/db/agents";

const prompts:Record<string,string>={
  "Idea Validation":"Evaluate the startup idea using customer pain, urgency, differentiation, feasibility, market access, and willingness to pay. Recommend concrete validation experiments.",
  "AI Mediation":"Act as a neutral workplace mediator. Separate facts, positions, interests, and shared goals. Do not make disciplinary or employment decisions. Recommend a fair next-step plan.",
  "Governance Agents":"Act as a governance council covering finance, compliance, delivery, and people risk. Identify risks, accountable owners, and approval-gated actions. Never claim legal compliance with certainty.",
  "Financial Dashboard":"Analyze the scenario using this verified company context: MRR $84,240; net burn $41,800; cash $593,400; runway 14.2 months. Explain assumptions and never invent account balances.",
  "Term Sheet Analyzer":"Analyze economics, dilution, liquidation preference, anti-dilution, board control, protective provisions, vesting, and founder risk. Explain that this is educational analysis, not legal advice.",
};
const demo:Record<string,Omit<AgentResult,"runId">>={
  "Idea Validation":{score:"82",title:"Promising—validate willingness to pay",summary:"The pain is specific and the wedge is credible. Pricing evidence is the largest remaining uncertainty.",items:["Interview 8 target customers","Test a paid concierge pilot","Measure weekly time saved"],mode:"demo"},
  "AI Mediation":{score:"91",title:"Shared outcome identified",summary:"The disagreement appears to concern risk ownership rather than the desired outcome.",items:["Define non-negotiable checks","Reduce scope to critical workflows","Agree on a written go/no-go rubric"],mode:"demo"},
  "Governance Agents":{score:"4",title:"Governance review completed",summary:"No critical breach was identified; two decisions need accountable owners.",items:["Assign the launch risk owner","Complete the policy review","Record hiring approval"],mode:"demo"},
  "Financial Dashboard":{score:"16",title:"Scenario remains within the safety threshold",summary:"The plan is affordable if costs remain capped and the second commitment follows the next major close.",items:["Stage the second hire","Cap incremental monthly cost","Reforecast if conversion falls"],mode:"demo"},
  "Term Sheet Analyzer":{score:"B+",title:"Standard economics, moderate control risk",summary:"The preference appears conventional. Board composition and protective provisions deserve counsel review.",items:["Clarify the option-pool treatment","Narrow investor vetoes","Request a founder cure period"],mode:"demo"},
};
type ResponsesPayload={output?:Array<{content?:Array<{type?:string;text?:string}>}>};
function outputText(payload:ResponsesPayload){for(const item of payload.output||[])for(const part of item.content||[])if(part.type==="output_text"&&part.text)return part.text;return "";}
export async function POST(request:Request){try{const email=request.headers.get("x-demo-email");if(!email)return Response.json({error:"Authentication required"},{status:401});const body=await request.json() as {agent?:string;input?:string;approveRunId?:string};if(body.approveRunId)return Response.json({approved:await approveAgentRun(email,body.approveRunId)});if(!body.agent||!prompts[body.agent]||!body.input?.trim())return Response.json({error:"Agent and input are required"},{status:400});
  const runtime=env as unknown as {OPENAI_API_KEY?:string;OPENAI_MODEL?:string};let result:Omit<AgentResult,"runId">;
  if(!runtime.OPENAI_API_KEY)result=demo[body.agent];else{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${runtime.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:runtime.OPENAI_MODEL||"gpt-5.6-sol",instructions:`You are Northstar's ${body.agent}. ${prompts[body.agent]} Return concise, decision-ready output.`,input:body.input,text:{format:{type:"json_schema",name:"agent_result",strict:true,schema:{type:"object",properties:{score:{type:"string"},title:{type:"string"},summary:{type:"string"},items:{type:"array",items:{type:"string"},minItems:3,maxItems:5}},required:["score","title","summary","items"],additionalProperties:false}}}})});if(!response.ok)throw new Error(`OpenAI request failed (${response.status})`);const parsed=JSON.parse(outputText(await response.json()));result={...parsed,mode:"live"};}
  const runId=await saveAgentRun(email,body.agent,body.input,result);return Response.json({...result,runId});
}catch(error){return Response.json({error:error instanceof Error?error.message:"Agent failed"},{status:500});}}
