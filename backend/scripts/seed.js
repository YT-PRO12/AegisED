const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const pool = require("../src/config/db");
const password = require("../src/services/password");
const transaction = require("../src/services/transaction");
const audit = require("../src/services/audit");
async function seed() {
  if (process.env.DEMO_SEED !== "true")
    throw new Error(
      "Set DEMO_SEED=true explicitly to load synthetic demo records",
    );
  const secret =
    process.env.DEMO_PASSWORD || randomBytes(18).toString("base64url");
  const hash = await password.hash(secret);
  let created = false;
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(731903)");
    if (
      (await c.query("SELECT 1 FROM seed_runs WHERE name='synthetic-v1'"))
        .rowCount
    )
      return;
    if (+(await c.query("SELECT COUNT(*) FROM patients")).rows[0].count)
      throw new Error(
        "Seed requires an empty patient database; existing records were left untouched",
      );
    const doctors = [];
    for (const [i, name] of [
      "Mira Shah",
      "Arjun Rao",
      "Nina Patel",
      "Kabir Mehta",
      "Sara Khan",
      "Ishan Das",
      "Anya Roy",
      "Dev Sen",
      "Aditi Jain",
      "Rohan Shah",
      "Leena Rao",
      "Aman Sethi",
    ].entries()) {
      doctors.push(
        (
          await c.query(
            "INSERT INTO doctors(name,specialization) VALUES($1,$2) RETURNING id",
            [
              `Dr. ${name}`,
              ["Emergency Medicine", "General Medicine", "Orthopedics"][i % 3],
            ],
          )
        ).rows[0].id,
      );
    }
    const beds = [];
    for (let i = 0; i < 20; i++)
      beds.push(
        (
          await c.query(
            "INSERT INTO beds(bed_number,status) VALUES($1,$2) RETURNING id",
            [
              `ED-${String(i + 1).padStart(2, "0")}`,
              i === 19 ? "Cleaning" : "Available",
            ],
          )
        ).rows[0].id,
      );
    const users = [];
    for (const [role, name] of [
      ["ADMIN", "Demo Administrator"],
      ["DOCTOR", "Dr. Mira Shah"],
      ["NURSE", "Demo Nurse"],
      ["RECEPTION", "Demo Reception"],
    ])
      users.push(
        (
          await c.query(
            "INSERT INTO users(name,email,password_hash,role,doctor_id) VALUES($1,$2,$3,$4,$5) RETURNING id,role",
            [
              name,
              role.toLowerCase() + "@careflow.demo",
              hash,
              role,
              role === "DOCTOR" ? doctors[0] : null,
            ],
          )
        ).rows[0],
      );
    const now = Date.now();
    for (let i = 0; i < 254; i++) {
      const historical = i < 240,
        active = i - 240;
      const priority = ["Stable", "Urgent", "Stable", "Critical", "Urgent"][
        i % 5
      ];
      const status = historical
        ? "Discharged"
        : active < 6
          ? "Waiting"
          : active < 9
            ? "Assigned"
            : active < 13
              ? "In Treatment"
              : "Completed";
      const assigned = status !== "Waiting",
        bedded = historical || active >= 8;
      const d = assigned ? doctors[historical ? i % 12 : active - 6] : null,
        b = bedded ? beds[historical ? i % 18 : active - 6] : null;
      const arrival = new Date(
        now -
          (historical
            ? (240 - i) * 3 * 3600000
            : (active < 6 ? 18 + active * 9 : 210 - active * 4) * 60000),
      );
      const t = (m) => new Date(+arrival + m * 60000);
      const p = (
        await c.query(
          "INSERT INTO patients(name,age,priority,status,created_at) VALUES($1,$2,$3,$4,$5) RETURNING id",
          [
            `Demo Patient ${String(i + 1).padStart(3, "0")}`,
            18 + ((i * 7) % 68),
            priority,
            status,
            arrival,
          ],
        )
      ).rows[0].id;
      const row = (
        await c.query(
          `INSERT INTO emergency_cases(patient_id,doctor_id,bed_id,symptoms,priority,status,created_at,arrival_time,doctor_assigned_at,bed_assigned_at,treatment_started_at,treatment_completed_at,discharged_at,vitals)
    VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
          [
            p,
            d,
            b,
            [
              "Synthetic scenario: dizziness",
              "Synthetic scenario: minor fall",
              "Synthetic scenario: fever",
              "Synthetic scenario: breathing discomfort",
            ][i % 4],
            priority,
            status,
            arrival,
            assigned ? t(5 + (i % 18)) : null,
            bedded ? t(25) : null,
            ["In Treatment", "Completed", "Discharged"].includes(status)
              ? t(30)
              : null,
            ["Completed", "Discharged"].includes(status)
              ? t(55 + (i % 30))
              : null,
            historical ? t(95) : null,
            JSON.stringify({
              heartRate: 72 + (i % 32),
              systolicBP: 112 + (i % 27),
              respiratoryRate: 16 + (i % 7),
              temperature: 36.6 + (i % 8) / 10,
              oxygenSaturation: 95 + (i % 5),
            }),
          ],
        )
      ).rows[0];
      if (!historical && d)
        await c.query("UPDATE doctors SET status='Busy' WHERE id=$1", [d]);
      if (!historical && b)
        await c.query(
          "UPDATE beds SET status='Occupied',patient_id=$1 WHERE id=$2",
          [p, b],
        );
      const events = [
        ["CASE_CREATED", arrival],
        ...(assigned ? [["DOCTOR_ASSIGNED", t(5 + (i % 18))]] : []),
        ...(bedded ? [["BED_ASSIGNED", t(25)]] : []),
        ...(["In Treatment", "Completed", "Discharged"].includes(status)
          ? [["TREATMENT_STARTED", t(30)]]
          : []),
        ...(["Completed", "Discharged"].includes(status)
          ? [["TREATMENT_COMPLETED", t(55 + (i % 30))]]
          : []),
        ...(historical ? [["PATIENT_DISCHARGED", t(95)]] : []),
      ];
      for (const [action, date] of events)
        await c.query(
          "INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata,created_at) VALUES($1,$2,'case',$3,$4,$5)",
          [
            users[0].id,
            action,
            row.id,
            JSON.stringify({ synthetic: true }),
            date,
          ],
        );
    }
    await audit(c, users[0], "DEMO_SEEDED", "system", null, {
      synthetic: true,
    });
    await c.query("INSERT INTO seed_runs(name) VALUES('synthetic-v1')");
    created = true;
  });
  if (created) {
    const file = path.resolve(__dirname, "../.demo-credentials");
    fs.writeFileSync(
      file,
      `Synthetic demo only. All four accounts share this generated password.\nEmails: admin@careflow.demo, doctor@careflow.demo, nurse@careflow.demo, reception@careflow.demo\nPassword: ${secret}\n`,
      { mode: 0o600 },
    );
    console.log(
      "Created 254 synthetic patients, 12 doctors, 20 beds, 4 accounts. Credentials: backend/.demo-credentials",
    );
  } else console.log("Synthetic seed already applied; no records changed");
}
if (require.main === module)
  seed()
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
module.exports = seed;
