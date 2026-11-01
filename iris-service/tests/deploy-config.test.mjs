// Guards the deployment setup: the build must not touch the database, and the destructive
// drizzle-kit push must stay disabled. See docs/SCHEMA-MIGRATIONS.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));

test("the Render build command is exactly the database-free one", () => {
  const yaml = read("render.yaml");
  const build = /^\s*buildCommand:\s*(.+)$/m.exec(yaml)?.[1].trim();
  assert.equal(build, "npm ci --include=dev && npm run build");
  assert.equal(/^\s*startCommand:\s*(.+)$/m.exec(yaml)?.[1].trim(), "npm run start");
  assert.ok(!/drizzle-kit|db:push/.test(yaml.split("\n").filter(l => !l.trim().startsWith("#")).join("\n")));
});

test("no build or start script touches the database schema", () => {
  for (const name of ["build", "start", "dev"]) {
    assert.ok(!/drizzle|db:|migrate/i.test(pkg.scripts[name]), `${name} must not run a database step: ${pkg.scripts[name]}`);
  }
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert.ok(!/drizzle-kit\s+(push|migrate)/.test(command), `script ${name} would change the database: ${command}`);
  }
  assert.equal(pkg.scripts["db:push"], "node scripts/db-push-disabled.cjs");
});

test("npm run db:push refuses to run and says why", () => {
  const result = spawnSync(process.execPath, ["scripts/db-push-disabled.cjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 1, "must fail, never report success");
  assert.match(result.stderr, /db:push is disabled/);
  assert.match(result.stderr, /SCHEMA-MIGRATIONS\.md/);
});

test("drizzle-kit refuses to load its config without the explicit override", () => {
  const load = "import('./drizzle.config.ts').then(() => process.exit(0), e => { console.error(e.message); process.exit(3); })";
  const run = extraEnv => spawnSync(process.execPath, ["--import", "tsx", "-e", load], {
    cwd: root, encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "postgres://user:pass@127.0.0.1:1/none", ...extraEnv },
  });
  const blocked = run({ ALLOW_DRIZZLE_KIT: "" });
  assert.equal(blocked.status, 3);
  assert.match(blocked.stderr, /drizzle-kit is disabled/);
  assert.equal(run({ ALLOW_DRIZZLE_KIT: "yes" }).status, 3, "a casual value is not enough");
});

test("the migration procedure is documented", () => {
  const doc = read("docs/SCHEMA-MIGRATIONS.md");
  for (const topic of ["migrate.ts", "additive", "Neon branch", "db:check", "Rolling back", "drizzle-kit push"]) {
    assert.ok(doc.includes(topic), `docs/SCHEMA-MIGRATIONS.md should cover: ${topic}`);
  }
});
