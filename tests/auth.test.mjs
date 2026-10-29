import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(name, mocks = {}, env = {}) {
  const source = fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, require: (name) => name in mocks ? mocks[name] : require(name),
    process: { env }, Response, URL, crypto,
    __filename: fileURLToPath(import.meta.url),
  });
  return exports;
}
const redirect = (url, status = 307) => Response.redirect(url, status);
const next = { NextResponse: { redirect } };
const accounts = load("src/lib/accounts.ts");
const safePaths = load("src/lib/safe-path.ts");
function request(path, entries, origin = "https://tabs.example") {
  return new Request(`https://tabs.example${path}`, {
    method: "POST", headers: { origin }, body: new URLSearchParams(entries),
  });
}

test("identity uses the verified Auth user; demo provisioning uses Supabase", async () => {
  let user = { id: "verified", email: "a@example.com", is_anonymous: false };
  let error = null;
  let anonCalls = 0;
  const auth = load("src/lib/auth.ts", {
    react: { cache: (fn) => fn },
    "next/navigation": { redirect: () => { throw new Error("redirect"); } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      getUser: async () => ({ data: { user }, error }),
      signInAnonymously: async () => { anonCalls++; return { data: { user: { id: "anonymous" } }, error: null }; },
    } }) },
  });
  assert.equal((await auth.getSession()).userId, "verified");
  user = { id: "demo", is_anonymous: true };
  assert.equal((await auth.getSession()).isDemo, true);
  assert.equal((await auth.getSession()).isSignedIn, false);
  user = null;
  assert.equal(await auth.ensureUserId(), "anonymous");
  assert.equal(anonCalls, 1);
  error = new Error("Auth unavailable");
  await assert.rejects(auth.getSession(), /Auth unavailable/);
});

test("sign-in rejects foreign origins, uses password auth, and transfers only the verified demo", async () => {
  const calls = [];
  const route = load("src/app/api/sign-in/route.ts", {
    "next/server": next, "@/lib/accounts": accounts, "@/lib/safe-path": safePaths,
    "@/lib/demo": {
      readDemoUserId: async () => "verified-demo",
      claimDemoTabs: async (...args) => calls.push(args),
    },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      signInWithPassword: async (credentials) => {
        assert.equal(credentials.email, "a@example.com");
        assert.equal(credentials.password, "password123");
        return { data: { user: { id: "verified-account" } }, error: null };
      },
    } }) },
  });
  const fields = { email: " A@example.com ", password: "password123", demoId: "forged" };
  assert.equal((await route.POST(request("/api/sign-in", fields, "https://foreign.example"))).status, 403);
  const result = await route.POST(request("/api/sign-in", fields));
  assert.equal(result.headers.get("location"), "https://tabs.example/library");
  assert.deepEqual(calls, [["verified-account", "verified-demo"]]);
});

test("failed password auth returns a generic error without transferring a shelf", async () => {
  const route = load("src/app/api/sign-in/route.ts", {
    "next/server": next, "@/lib/accounts": accounts, "@/lib/safe-path": safePaths,
    "@/lib/demo": { readDemoUserId: async () => "demo", claimDemoTabs: () => assert.fail("must not transfer") },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      signInWithPassword: async () => ({ data: { user: null }, error: { code: "invalid_credentials" } }),
    } }) },
  });
  const response = await route.POST(request("/api/sign-in", { email: "a@example.com", password: "password123" }));
  assert.equal(response.headers.get("location"), "https://tabs.example/sign-in?error=wrong");
});

test("signup without a session asks for email confirmation", async () => {
  const route = load("src/app/api/sign-up/route.ts", {
    "next/server": next, "@/lib/accounts": accounts, "@/lib/safe-path": safePaths,
    "@/lib/demo": { readDemoUserId: async () => "demo", claimDemoTabs: () => assert.fail("must not transfer before confirmation") },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      signUp: async ({ options }) => {
        assert.equal(options.emailRedirectTo, "https://tabs.example/auth/confirm");
        return { data: { user: { id: "new" }, session: null }, error: null };
      },
    } }) },
  });
  const response = await route.POST(request("/api/sign-up", { email: "a@example.com", password: "password123" }));
  assert.equal(response.headers.get("location"), "https://tabs.example/sign-in?notice=confirm");
});

test("confirmation verifies the token before transferring demo tabs", async () => {
  const calls = [];
  const route = load("src/app/auth/confirm/route.ts", {
    "next/server": next, "@/lib/safe-path": safePaths,
    "@/lib/demo": { readDemoUserId: async () => "demo", claimDemoTabs: async (...args) => calls.push(args) },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      verifyOtp: async ({ token_hash, type }) => {
        assert.equal(token_hash, "valid-token"); assert.equal(type, "email");
        return { data: { user: { id: "confirmed" } }, error: null };
      },
    } }) },
  });
  const response = await route.GET(new Request("https://tabs.example/auth/confirm?token_hash=valid-token&type=email&next=https://foreign.example"));
  assert.equal(response.headers.get("location"), "https://tabs.example/library");
  assert.deepEqual(calls, [["confirmed", "demo"]]);
});


test("origin checks use the requested Host while rejecting foreign origins", () => {
  const make = (origin, host = "127.0.0.1:3000") => new Request("http://localhost:3000/api/sign-up", {
    headers: { origin, host },
  });
  assert.equal(safePaths.isSameOrigin(make("http://127.0.0.1:3000")), true);
  assert.equal(safePaths.requestOrigin(make("http://127.0.0.1:3000")), "http://127.0.0.1:3000");
  assert.equal(safePaths.isSameOrigin(make("https://foreign.example")), false);
  assert.equal(safePaths.isSameOrigin(make("http://127.0.0.1:4000")), false);
  assert.equal(safePaths.isSameOrigin(make("null")), false);
  assert.equal(safePaths.isSameOrigin(make("http://localhost:3000", "localhost:3000")), true);
});
