import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Northstar application and API", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const [page, app, api, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/startup-os.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /StartupOS/);
  assert.match(app, /NORTHSTAR DAILY BRIEFING/);
  assert.match(app, /Ask Northstar/);
  assert.match(api, /approveInsight/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
