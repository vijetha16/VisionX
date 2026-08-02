import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Northstar application and API", async () => {
  await access(new URL("../.next/BUILD_ID", import.meta.url));
  const [page, entry, auth, landing, app, api, agents, people, resume, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/client-entry.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-portal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/landing-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/startup-os.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/agents/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/people/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/resume/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /ClientEntry/);
  assert.match(entry, /AuthPortal/);
  assert.match(entry, /StartupOS/);
  assert.match(auth, /Create workspace/);
  assert.match(auth, /demo1234/);
  assert.match(landing, /Run your company with/);
  assert.match(landing, /Less dashboard\. More direction/);
  assert.match(app, /NORTHSTAR DAILY BRIEFING/);
  assert.match(app, /Ask Northstar/);
  assert.match(api, /approveInsight/);
  assert.match(app, /PeoplePage/);
  assert.match(app, /SettingsPage/);
  assert.match(app, /Idea Validation Engine/i);
  assert.match(app, /AI Mediation Agent/i);
  assert.match(app, /Autonomous Governance Agents/i);
  assert.match(app, /Real-Time Financial Dashboard/i);
  assert.match(app, /AI Term Sheet Analyzer/i);
  assert.match(agents, /generativelanguage\.googleapis\.com/);
  assert.match(agents, /responseJsonSchema/);
  assert.match(people, /saveProfile/);
  assert.match(resume, /put\(key,\s*file/);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.equal(JSON.parse(hosting).r2, "FILES");
});
