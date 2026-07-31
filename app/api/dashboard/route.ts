import { approveInsight, getDashboard } from "@/db/bootstrap";

export async function GET() {
  try { return Response.json(await getDashboard()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { insightId?: number };
    if (!body.insightId) return Response.json({ error: "Insight is required" }, { status: 400 });
    if (!(await approveInsight(body.insightId))) return Response.json({ error: "Insight not found" }, { status: 404 });
    return Response.json(await getDashboard());
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to approve action" }, { status: 500 }); }
}
