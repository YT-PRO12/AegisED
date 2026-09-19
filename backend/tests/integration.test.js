const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const pool = require("../src/config/db");
const app = require("../src/app");
let server, url, admin, nurse, reception, doctor;
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DATABASE_URL?.includes("careflow_test")
)
  throw new Error(
    "Tests require NODE_ENV=test and a dedicated careflow_test database",
  );
async function api(
  path,
  { who = admin, method = "GET", body, headers = {} } = {},
) {
  const r = await fetch(url + "/api" + path, {
    method,
    headers: {
      ...(who ? { Cookie: who.cookie, "X-CSRF-Token": who.csrf } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, body: await r.json(), headers: r.headers };
}
async function login(role) {
  const r = await api("/auth/login", {
    who: null,
    method: "POST",
    body: {
      email: role + "@careflow.demo",
      password: process.env.DEMO_PASSWORD,
    },
  });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.match(r.headers.get("set-cookie"), /SameSite=Strict/i);
  return {
    cookie: r.headers.get("set-cookie").split(";")[0],
    csrf: r.body.data.csrfToken,
    user: r.body.data.user,
  };
}
async function patient(name = "Test Patient") {
  const r = await api("/patients", {
    method: "POST",
    body: { name, age: 32, priority: "Urgent" },
  });
  assert.equal(r.status, 201);
  return r.body.data;
}
async function newCase(p) {
  const r = await api("/emergency-cases", {
    method: "POST",
    body: {
      patientId: p.id,
      symptoms: "Synthetic testing scenario",
      priority: "Urgent",
    },
  });
  assert.equal(r.status, 201);
  return r.body.data;
}
async function postCase(id, action, body) {
  return api(`/emergency-cases/${id}/${action}`, { method: "POST", body });
}
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  url = "http://127.0.0.1:" + server.address().port;
  admin = await login("admin");
  nurse = await login("nurse");
  reception = await login("reception");
  doctor = await login("doctor");
});
after(async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await pool.end();
});
test("health, database readiness, consistent unauthenticated error", async () => {
  assert.equal((await api("/health", { who: null })).status, 200);
  assert.equal((await api("/ready", { who: null })).status, 200);
  const r = await api("/patients", { who: null });
  assert.equal(r.status, 401);
  assert.ok(r.body.requestId);
  assert.equal(r.body.success, false);
});
test("authentication rejects wrong password without revealing account existence", async () => {
  const a = await api("/auth/login", {
    method: "POST",
    who: null,
    body: { email: "unknown@example.invalid", password: "wrong" },
  });
  const b = await api("/auth/login", {
    method: "POST",
    who: null,
    body: { email: "admin@careflow.demo", password: "wrong" },
  });
  assert.equal(a.status, 401);
  assert.equal(a.body.message, b.body.message);
});
test("CSRF and origin checks block writes", async () => {
  assert.equal(
    (
      await api("/patients", {
        method: "POST",
        body: { name: "Forbidden", age: 30, priority: "Stable" },
        headers: { "X-CSRF-Token": "" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/patients", {
        method: "POST",
        body: { name: "Forbidden", age: 30, priority: "Stable" },
        headers: { Origin: "https://untrusted.invalid" },
      })
    ).status,
    403,
  );
});
test("RBAC protects audit, users, doctor management and treatment", async () => {
  assert.equal((await api("/audit", { who: reception })).status, 403);
  assert.equal((await api("/users", { who: nurse })).status, 403);
  assert.equal(
    (
      await api("/doctors", {
        who: nurse,
        method: "POST",
        body: { name: "Denied", specialization: "Test" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/emergency-cases/1/start-treatment", {
        who: nurse,
        method: "POST",
      })
    ).status,
    403,
  );
});
test("CRUD accepts age zero, validates IDs and payloads, supports PUT and PATCH", async () => {
  let r = await api("/patients", {
    method: "POST",
    body: { name: "Synthetic infant", age: 0, priority: "Stable" },
  });
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  assert.equal(
    (
      await api("/patients/" + id, {
        method: "PUT",
        body: { name: "Updated infant" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await api("/patients/" + id, { method: "PATCH", body: { age: 1 } })).body
      .data.age,
    1,
  );
  assert.equal((await api("/patients/-1")).status, 400);
  assert.equal(
    (
      await api("/patients", {
        method: "POST",
        body: { name: "Invalid", age: 999, priority: "Stable" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api("/patients/" + id, {
        method: "PUT",
        body: { status: "Discharged" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api("/patients/" + id, { method: "DELETE" })).status,
    200,
  );
});
test("search, pagination, filtering and sorting are parameterized", async () => {
  const p = await patient("Unique Query Record");
  const r = await api("/patients?search=Unique%20Query&limit=1");
  assert.equal(r.body.pagination.total, 1);
  assert.equal(r.body.data[0].id, p.id);
  assert.equal(
    (await api("/patients?search=%27%20OR%201%3D1--")).body.data.length,
    0,
  );
  assert.equal((await api("/patients?limit=5000")).status, 400);
  assert.equal((await api("/patients?sort=id%3BDROP")).status, 400);
});
test("complete emergency workflow synchronizes resources, timestamps and patient state", async () => {
  const p = await patient("Workflow Case"),
    ec = await newCase(p);
  const d = (await api("/doctors?status=Available&limit=100")).body.data[0];
  const beds = (await api("/beds?status=Available&limit=100")).body.data;
  assert.equal(
    (await postCase(ec.id, "assign-bed", { bedId: beds[0].id })).status,
    409,
  );
  assert.equal((await postCase(ec.id, "start-treatment")).status, 409);
  assert.equal(
    (await postCase(ec.id, "assign-doctor", { doctorId: d.id })).status,
    200,
  );
  assert.equal((await api("/doctors/" + d.id)).body.data.status, "Busy");
  assert.equal((await api("/patients/" + p.id)).body.data.status, "Assigned");
  assert.equal(
    (await postCase(ec.id, "assign-bed", { bedId: beds[0].id })).status,
    200,
  );
  assert.equal(
    (await postCase(ec.id, "assign-bed", { bedId: beds[1].id })).status,
    409,
  );
  assert.equal(
    (await api("/beds/" + beds[1].id)).body.data.status,
    "Available",
  );
  assert.equal(
    (
      await api("/beds/" + beds[0].id, {
        method: "PUT",
        body: { patientId: null, status: "Available" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await api("/doctors/" + d.id, {
        method: "PUT",
        body: { status: "Available" },
      })
    ).status,
    409,
  );
  assert.equal(
    (await api("/emergency-cases/" + ec.id, { method: "DELETE" })).status,
    409,
  );
  assert.equal(
    (await postCase(ec.id, "start-treatment")).body.data.status,
    "In Treatment",
  );
  assert.equal((await postCase(ec.id, "discharge")).status, 409);
  assert.equal(
    (await postCase(ec.id, "complete-treatment")).body.data.status,
    "Completed",
  );
  assert.equal((await api("/beds/" + beds[0].id)).body.data.status, "Occupied");
  const done = await postCase(ec.id, "discharge");
  assert.equal(done.body.data.status, "Discharged");
  for (const field of [
    "arrival_time",
    "doctor_assigned_at",
    "bed_assigned_at",
    "treatment_started_at",
    "treatment_completed_at",
    "discharged_at",
  ])
    assert.ok(done.body.data[field]);
  assert.equal((await api("/patients/" + p.id)).body.data.status, "Discharged");
  assert.equal((await api("/doctors/" + d.id)).body.data.status, "Available");
  assert.equal((await api("/beds/" + beds[0].id)).body.data.patient_id, null);
  assert.equal((await postCase(ec.id, "discharge")).status, 409);
  assert.equal(
    (
      await api("/emergency-cases/" + ec.id, {
        method: "PUT",
        body: { priority: "Critical" },
      })
    ).status,
    409,
  );
  const log = await pool.query(
    "SELECT action FROM audit_logs WHERE entity_type='case' AND entity_id=$1",
    [ec.id],
  );
  assert.equal(log.rowCount, 6);
});
test("simultaneous doctor assignments have exactly one winner", async () => {
  const ec1 = await newCase(await patient("Concurrent one")),
    ec2 = await newCase(await patient("Concurrent two"));
  const d = (await api("/doctors?status=Available&limit=100")).body.data[0];
  const r = await Promise.all([
    postCase(ec1.id, "assign-doctor", { doctorId: d.id }),
    postCase(ec2.id, "assign-doctor", { doctorId: d.id }),
  ]);
  assert.deepEqual(r.map((x) => x.status).sort(), [200, 409]);
  const check = await pool.query(
    "SELECT id FROM emergency_cases WHERE doctor_id=$1 AND status<>'Discharged'",
    [d.id],
  );
  assert.equal(check.rowCount, 1);
});
test("one active case per patient is enforced by PostgreSQL", async () => {
  const p = await patient("Duplicate intake");
  await newCase(p);
  assert.equal(
    (
      await api("/emergency-cases", {
        method: "POST",
        body: { patientId: p.id, symptoms: "Duplicate", priority: "Stable" },
      })
    ).status,
    409,
  );
});
test("bed patient assignment can explicitly be cleared when no active case owns it", async () => {
  const p = await patient("Legacy orphan");
  const bed = (
    await pool.query(
      "INSERT INTO beds(bed_number,status,patient_id) VALUES('LEGACY-TEST','Occupied',$1) RETURNING id",
      [p.id],
    )
  ).rows[0];
  const r = await api("/beds/" + bed.id, {
    method: "PUT",
    body: { patientId: null, status: "Available" },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.patient_id, null);
});
test("doctor read access and actions are scoped to assigned cases", async () => {
  const cases = (await api("/emergency-cases?limit=100", { who: doctor })).body
    .data;
  assert.ok(cases.length);
  assert.ok(cases.every((c) => c.doctor_id === doctor.user.doctor_id));
  const other = (
    await pool.query(
      "SELECT id,patient_id FROM emergency_cases WHERE doctor_id IS DISTINCT FROM $1 LIMIT 1",
      [doctor.user.doctor_id],
    )
  ).rows[0];
  assert.equal(
    (await api("/emergency-cases/" + other.id, { who: doctor })).status,
    404,
  );
  assert.equal(
    (await api("/patients/" + other.patient_id, { who: doctor })).status,
    404,
  );
  assert.equal(
    (
      await api("/emergency-cases/" + other.id + "/complete-treatment", {
        who: doctor,
        method: "POST",
      })
    ).status,
    403,
  );
});
test("analytics and dashboard reconcile with stored records", async () => {
  const r = await api("/analytics?days=30");
  assert.equal(r.status, 200);
  assert.equal(
    r.body.data.trend.reduce((a, d) => a + d.arrivals, 0),
    r.body.data.summary.volume,
  );
  assert.equal(
    r.body.data.priorities.reduce((a, d) => a + d.count, 0),
    r.body.data.summary.volume,
  );
  assert.ok(+r.body.data.summary.avg_wait_minutes >= 0);
  const stats = (await api("/dashboard/stats")).body.data;
  assert.equal(
    stats.totalPatients,
    +(await pool.query("SELECT COUNT(*) FROM patients")).rows[0].count,
  );
  assert.equal(
    (await api("/analytics?from=2026-08-20&to=2026-08-01")).status,
    400,
  );
});
test("real ML gateway persists suggestions; explicit override records rationale", async () => {
  const ec = await newCase(await patient("Model scenario"));
  const body = {
    caseId: ec.id,
    vitals: {
      heartRate: 110,
      systolicBP: 100,
      respiratoryRate: 26,
      temperature: 38.1,
      oxygenSaturation: 91,
    },
  };
  let r = await api("/ai/predict", { method: "POST", body });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const prediction = r.body.data;
  assert.equal(prediction.model_version, "synthetic-v1");
  assert.equal(
    (await api("/emergency-cases/" + ec.id)).body.data.priority,
    "Urgent",
  );
  assert.ok(prediction.result.classScores);
  assert.equal(
    (
      await api("/ai/predictions/" + prediction.id + "/review", {
        method: "POST",
        body: { action: "OVERRIDE", priority: "Stable" },
      })
    ).status,
    400,
  );
  r = await api("/ai/predictions/" + prediction.id + "/review", {
    method: "POST",
    body: {
      action: "OVERRIDE",
      priority: "Stable",
      reason: "Synthetic demonstration human review",
    },
  });
  assert.equal(r.status, 200);
  assert.equal(
    (await api("/emergency-cases/" + ec.id)).body.data.priority,
    "Stable",
  );
  assert.equal(
    (await api("/patients/" + ec.patient_id)).body.data.priority,
    "Stable",
  );
  assert.equal(
    (
      await api("/ai/predictions/" + prediction.id + "/review", {
        method: "POST",
        body: { action: "ACCEPT" },
      })
    ).status,
    409,
  );
});
test("knowledge gateway cites real sources and abstains on unsupported input", async () => {
  let r = await api("/knowledge", {
    method: "POST",
    body: { question: "How do I assign a bed to a case?" },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.mode, "retrieval_only");
  assert.ok(r.body.data.sources.some((s) => s.id === "workflow-3"));
  r = await api("/knowledge", {
    method: "POST",
    body: { question: "What medication dosage should I prescribe?" },
  });
  assert.equal(r.body.data.mode, "insufficient_context");
  assert.equal(r.body.data.sources.length, 0);
});
test("audit visibility, no stack traces and API 404s", async () => {
  const log = await api("/audit?action=AI_RECOMMENDATION_OVERRIDDEN");
  assert.ok(log.body.data.length);
  assert.equal((await api("/unrecognized-route")).status, 404);
  const r = await api("/patients/9999999");
  assert.equal(r.status, 404);
  assert.equal(r.body.stack, undefined);
});
test("logout revokes the session in PostgreSQL", async () => {
  assert.equal(
    (await api("/auth/logout", { who: reception, method: "POST" })).status,
    200,
  );
  assert.equal((await api("/auth/me", { who: reception })).status, 401);
});
