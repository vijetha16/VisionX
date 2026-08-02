import { put } from "@vercel/blob";
import { getOrCreateSession, saveResume } from "@/db/workspace";

export async function POST(request: Request) {
  const email = request.headers.get("x-demo-email");
  const name = request.headers.get("x-demo-name");
  if (!email || !name) return Response.json({ error: "Authentication required" }, { status: 401 });

  const session = await getOrCreateSession(email, name);
  const form = await request.formData();
  const file = form.get("resume");
  if (!(file instanceof File)) return Response.json({ error: "Choose a résumé file" }, { status: 400 });
  if (file.size > 5_000_000) return Response.json({ error: "Résumé must be under 5 MB" }, { status: 400 });
  if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
    return Response.json({ error: "Upload a PDF, DOC, or DOCX file" }, { status: 400 });
  }

  const key = `resumes/${session.user.id}/${crypto.randomUUID()}-${file.name}`;
  const blob = await put(key, file, { access: "private", addRandomSuffix: false });
  await saveResume(session, file.name, blob.pathname);
  return Response.json({ name: file.name });
}
