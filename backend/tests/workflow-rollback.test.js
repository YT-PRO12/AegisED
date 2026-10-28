const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const pool = require("../src/config/db");
const workflow = require("../src/controllers/emergencyWorkflowController");

test("failed workflow audit rolls back case, patient, doctor and bed writes", async (t) => {
  const db = new PGlite();
  let releases = 0;
  try {
    await db.exec(`
   CREATE TABLE patients(id INT PRIMARY KEY,status TEXT,priority TEXT,updated_at TIMESTAMP);
   CREATE TABLE doctors(id INT PRIMARY KEY,status TEXT,updated_at TIMESTAMP);
   CREATE TABLE beds(id INT PRIMARY KEY,status TEXT,patient_id INT,updated_at TIMESTAMP);
   CREATE TABLE emergency_cases(id INT PRIMARY KEY,patient_id INT,status TEXT,priority TEXT,doctor_id INT,bed_id INT,doctor_assigned_at TIMESTAMP,discharged_at TIMESTAMP,updated_at TIMESTAMP);
   CREATE TABLE audit_logs(user_id INT,action TEXT CHECK(action='IMPOSSIBLE'),entity_type TEXT,entity_id INT,metadata JSONB);
   INSERT INTO patients VALUES(1,'Waiting','Stable',NULL);
   INSERT INTO doctors VALUES(1,'Available',NULL);
   INSERT INTO beds VALUES(1,'Available',NULL,NULL);
   INSERT INTO emergency_cases(id,patient_id,status,priority) VALUES(1,1,'Waiting','Stable');
  `);
    t.mock.method(pool, "connect", async () => ({
      query: (sql, args) => db.query(sql, args),
      release: () => {
        releases++;
      },
    }));
    const req = {
      params: { id: "1" },
      body: { doctorId: 1 },
      user: { id: 1, role: "ADMIN" },
    };
    const response = {
      json: () =>
        assert.fail("a failed transaction cannot respond with success"),
    };
    async function snapshot() {
      return Promise.all(
        ["patients", "doctors", "beds", "emergency_cases", "audit_logs"].map(
          async (table) => (await db.query("SELECT * FROM " + table)).rows,
        ),
      );
    }
    const before = await snapshot();
    await assert.rejects(
      workflow.assignDoctor(req, response),
      (e) => e.code === "23514",
    );
    assert.deepEqual(await snapshot(), before);
    await db.exec(
      "UPDATE patients SET status='Completed'; UPDATE doctors SET status='Busy'; UPDATE beds SET status='Occupied',patient_id=1; UPDATE emergency_cases SET status='Completed',doctor_id=1,bed_id=1;",
    );
    const assigned = await snapshot();
    await assert.rejects(
      workflow.dischargePatient(req, response),
      (e) => e.code === "23514",
    );
    assert.deepEqual(await snapshot(), assigned);
    assert.equal(releases, 2);
  } finally {
    await db.close();
  }
});
