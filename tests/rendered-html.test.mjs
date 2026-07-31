import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Northstar application and API", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const [page, entry, auth, app, api, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/client-entry.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-portal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/startup-os.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /ClientEntry/);
  assert.match(entry, /AuthPortal/);
  assert.match(entry, /StartupOS/);
  assert.match(auth, /Create account/);
  assert.match(auth, /demo1234/);
  assert.match(app, /NORTHSTAR DAILY BRIEFING/);
  assert.match(app, /Ask Northstar/);
  assert.match(api, /approveInsight/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
