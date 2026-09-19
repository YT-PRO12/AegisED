const pool = require("../config/db");
const env = require("../config/env");
const transaction = require("../services/transaction");
const audit = require("../services/audit");
const { assert, AppError } = require("../utils/errors");
const { ownsCase } = require("../middleware/auth");
async function ml(path, body) {
  try {
    const r = await fetch(env.mlUrl + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": env.mlToken,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(path === "/knowledge" ? 25000 : 10000),
    });
    if (!r.ok)
      throw new AppError(
        r.status === 422 ? 400 : 503,
        r.status === 422
          ? "The model cannot accept these inputs"
          : "AI service is unavailable",
      );
    return await r.json();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(
      503,
      "AI service is unavailable. Workflow actions remain available.",
    );
  }
}
exports.ml = ml;
exports.predict = async (req, res) => {
  const ec = (
    await pool.query(
      "SELECT ec.*,p.age FROM emergency_cases ec JOIN patients p ON p.id=ec.patient_id WHERE ec.id=$1",
      [req.body.caseId],
    )
  ).rows[0];
  assert(ec, 404, "Case not found");
  ownsCase(req.user, ec);
  assert(ec.status !== "Discharged", 409, "Discharged cases are read-only");
  const features = { age: ec.age, ...req.body.vitals };
  const prediction = await ml("/predict", features);
  const saved = await transaction(async (c) => {
    const current = (
      await c.query("SELECT * FROM emergency_cases WHERE id=$1 FOR UPDATE", [
        ec.id,
      ])
    ).rows[0];
    assert(
      current && current.status !== "Discharged",
      409,
      "Case changed while predicting; refresh and try again",
    );
    ownsCase(req.user, current);
    await c.query(
      "UPDATE emergency_cases SET vitals=$1,updated_at=NOW() WHERE id=$2",
      [JSON.stringify(req.body.vitals), ec.id],
    );
    const p = (
      await c.query(
        "INSERT INTO predictions(case_id,user_id,features,result,model_version) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [
          ec.id,
          req.user.id,
          JSON.stringify(features),
          JSON.stringify(prediction),
          prediction.modelVersion,
        ],
      )
    ).rows[0];
    await audit(c, req.user, "AI_PREDICTION_CREATED", "case", ec.id, {
      predictionId: p.id,
      modelVersion: prediction.modelVersion,
    });
    return p;
  });
  res.status(201).json({ success: true, data: saved });
};
exports.predictions = async (req, res) => {
  const params = [];
  let where = "";
  if (req.user.role === "DOCTOR") {
    params.push(req.user.doctor_id);
    where = " WHERE ec.doctor_id=$1";
  }
  res.json({
    success: true,
    data: (
      await pool.query(
        `SELECT pr.*,p.name AS patient_name FROM predictions pr JOIN emergency_cases ec ON ec.id=pr.case_id JOIN patients p ON p.id=ec.patient_id${where} ORDER BY pr.created_at DESC LIMIT 100`,
        params,
      )
    ).rows,
  });
};
exports.review = async (req, res) => {
  const r = await transaction(async (c) => {
    // Lock case first everywhere, including prediction review, to avoid inverse lock order.
    const target = (
      await c.query("SELECT case_id FROM predictions WHERE id=$1", [
        +req.params.id,
      ])
    ).rows[0];
    assert(target, 404, "Prediction not found");
    const ec = (
      await c.query("SELECT * FROM emergency_cases WHERE id=$1 FOR UPDATE", [
        target.case_id,
      ])
    ).rows[0];
    ownsCase(req.user, ec);
    assert(ec.status !== "Discharged", 409, "Discharged cases are read-only");
    const p = (
      await c.query("SELECT * FROM predictions WHERE id=$1 FOR UPDATE", [
        +req.params.id,
      ])
    ).rows[0];
    assert(
      p.human_action === "PENDING",
      409,
      "Prediction has already been reviewed",
    );
    const latest = (
      await c.query(
        "SELECT id FROM predictions WHERE case_id=$1 ORDER BY id DESC LIMIT 1",
        [ec.id],
      )
    ).rows[0];
    assert(latest.id === p.id, 409, "Review the latest prediction");
    const b = req.body;
    assert(
      b.action !== "OVERRIDE" || (b.reason && b.priority),
      400,
      "Override requires a priority and reason",
    );
    const priority =
      b.action === "ACCEPT"
        ? p.result.predictedPriority
        : b.action === "OVERRIDE"
          ? b.priority
          : null;
    if (priority) {
      await c.query(
        "UPDATE emergency_cases SET priority=$1,updated_at=NOW() WHERE id=$2",
        [priority, ec.id],
      );
      await c.query(
        "UPDATE patients SET priority=$1,updated_at=NOW() WHERE id=$2",
        [priority, ec.patient_id],
      );
    }
    const row = (
      await c.query(
        "UPDATE predictions SET human_action=$1,override_reason=$2,reviewed_by=$3,reviewed_at=NOW() WHERE id=$4 RETURNING *",
        [b.action, b.reason || null, req.user.id, p.id],
      )
    ).rows[0];
    await audit(
      c,
      req.user,
      b.action === "OVERRIDE"
        ? "AI_RECOMMENDATION_OVERRIDDEN"
        : "AI_RECOMMENDATION_REVIEWED",
      "case",
      ec.id,
      { predictionId: p.id, action: b.action, priority },
    );
    return row;
  });
  res.json({ success: true, data: r });
};
exports.knowledge = async (req, res) =>
  res.json({ success: true, data: await ml("/knowledge", req.body) });
exports.model = async (req, res) =>
  res.json({ success: true, data: await ml("/model") });
exports.recommendations = async (req, res) => {
  const ec = (
    await pool.query("SELECT * FROM emergency_cases WHERE id=$1", [
      +req.params.id,
    ])
  ).rows[0];
  assert(ec, 404, "Case not found");
  ownsCase(req.user, ec);
  const doctors = (
    await pool.query(
      `SELECT d.id,d.name,d.specialization,COUNT(ec.id)::int AS recent_cases FROM doctors d LEFT JOIN emergency_cases ec ON ec.doctor_id=d.id AND ec.arrival_time>NOW()-interval '7 days' WHERE d.status='Available' GROUP BY d.id ORDER BY recent_cases,d.id LIMIT 5`,
    )
  ).rows;
  const beds = (
    await pool.query(
      "SELECT id,bed_number FROM beds WHERE status='Available' ORDER BY id LIMIT 5",
    )
  ).rows;
  res.json({
    success: true,
    data: {
      method: "Operational rules; not machine learning",
      doctors:
        ec.status === "Waiting"
          ? doctors.map((d) => ({
              ...d,
              reason: `Available; ${d.recent_cases} assignments in the last 7 days. Specialty is shown for human review.`,
            }))
          : [],
      beds:
        ec.status === "Assigned" && !ec.bed_id
          ? beds.map((b) => ({
              ...b,
              reason:
                "Available and unoccupied. Confirm suitability before assignment.",
            }))
          : [],
    },
  });
};
