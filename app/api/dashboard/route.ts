import { approveInsight, getDashboard } from "@/db/bootstrap";
import { getChatGPTUser } from "@/app/chatgpt-auth";

async function authenticated(request:Request){return Boolean(await getChatGPTUser())||Boolean(request.headers.get("x-demo-email")&&request.headers.get("x-demo-name"));}
export async function GET(request:Request) {
  try { if (!(await authenticated(request))) return Response.json({ error: "Authentication required" }, { status: 401 }); return Response.json(await getDashboard()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    if (!(await authenticated(request))) return Response.json({ error: "Authentication required" }, { status: 401 });
    const body = (await request.json()) as { insightId?: number };
    if (!body.insightId) return Response.json({ error: "Insight is required" }, { status: 400 });
    if (!(await approveInsight(body.insightId))) return Response.json({ error: "Insight not found" }, { status: 404 });
    return Response.json(await getDashboard());
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to approve action" }, { status: 500 }); }
}
