const pool = require("../config/db");
const transaction = require("./transaction");
const audit = require("./audit");
const { assert } = require("../utils/errors");
const { listParams } = require("../middleware/validation");
const { ownsCase } = require("../middleware/auth");
const definitions = {
  patient: {
    table: "patients",
    alias: "p",
    select: "p.*",
    from: "patients p",
    search: "p.name",
    fields: { name: "name", age: "age", priority: "priority" },
    entity: "patient",
  },
  doctor: {
    table: "doctors",
    alias: "d",
    select: "d.*",
    from: "doctors d",
    search: "d.name || ' ' || d.specialization",
    fields: {
      name: "name",
      specialization: "specialization",
      status: "status",
    },
    entity: "doctor",
  },
  bed: {
    table: "beds",
    alias: "b",
    select: "b.*,p.name AS patient_name",
    from: "beds b LEFT JOIN patients p ON p.id=b.patient_id",
    search: "b.bed_number",
    fields: {
      bedNumber: "bed_number",
      status: "status",
      patientId: "patient_id",
    },
    entity: "bed",
  },
  case: {
    table: "emergency_cases",
    alias: "ec",
    select:
      "ec.*,p.name AS patient_name,p.age AS patient_age,d.name AS doctor_name,d.specialization AS doctor_specialization,b.bed_number",
    from: "emergency_cases ec JOIN patients p ON p.id=ec.patient_id LEFT JOIN doctors d ON d.id=ec.doctor_id LEFT JOIN beds b ON b.id=ec.bed_id",
    search: "p.name || ' ' || ec.symptoms",
    fields: {
      patientId: "patient_id",
      symptoms: "symptoms",
      priority: "priority",
      recommendation: "recommendation",
      vitals: "vitals",
    },
    entity: "case",
  },
};
function scope(def, user, values) {
  if (user.role !== "DOCTOR") return [];
  values.push(user.doctor_id);
  const param = "$" + values.length;
  if (def.entity === "case") return [`ec.doctor_id=${param}`];
  if (def.entity === "patient")
    return [
      `EXISTS(SELECT 1 FROM emergency_cases sc WHERE sc.patient_id=p.id AND sc.doctor_id=${param})`,
    ];
  if (def.entity === "bed")
    return [
      `(b.patient_id IS NULL OR EXISTS(SELECT 1 FROM emergency_cases sc WHERE sc.bed_id=b.id AND sc.doctor_id=${param} AND sc.status<>'Discharged'))`,
    ];
  values.pop();
  return [];
}
function crud(kind) {
  const def = definitions[kind];
  return {
    list: async (req, res) => {
      const q = listParams(req),
        values = [],
        where = scope(def, req.user, values);
      function filter(sql, v) {
        values.push(v);
        where.push(sql.replace("?", `$${values.length}`));
      }
      if (q.search) filter(`(${def.search}) ILIKE ?`, "%" + q.search + "%");
      if (q.status === "Active" && kind === "case")
        filter(`${def.alias}.status <> ?`, "Discharged");
      else if (q.status) filter(`${def.alias}.status = ?`, q.status);
      if (q.priority && ["case", "patient"].includes(kind))
        filter(`${def.alias}.priority = ?`, q.priority);
      if (kind === "case" && req.query.patientId) {
        assert(/^\d+$/.test(req.query.patientId), 400, "Invalid patient ID");
        filter("ec.patient_id = ?", +req.query.patientId);
      }
      const clause = where.length ? " WHERE " + where.join(" AND ") : "";
      const total = +(
        await pool.query(`SELECT COUNT(*) FROM ${def.from}${clause}`, values)
      ).rows[0].count;
      let sort = q.sort;
      if (
        ![
          "id",
          "created_at",
          ...(["patient", "doctor"].includes(kind) ? ["name"] : []),
          ...(["patient", "case"].includes(kind) ? ["priority"] : []),
          ...(kind === "case" ? ["arrival_time"] : []),
        ].includes(sort)
      )
        sort = "id";
      const ordering =
        sort === "priority"
          ? `CASE ${def.alias}.priority WHEN 'Critical' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END ASC,${def.alias}.id ASC`
          : `${def.alias}.${sort} ${q.order},${def.alias}.id ${q.order}`;
      const rows = (
        await pool.query(
          `SELECT ${def.select} FROM ${def.from}${clause} ORDER BY ${ordering} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
          [...values, q.limit, q.offset],
        )
      ).rows;
      res.json({
        success: true,
        count: rows.length,
        data: rows,
        pagination: {
          page: q.page,
          limit: q.limit,
          total,
          pages: Math.ceil(total / q.limit),
        },
      });
    },
    get: async (req, res) => {
      const values = [+req.params.id],
        where = [`${def.alias}.id=$1`, ...scope(def, req.user, values)];
      const row = (
        await pool.query(
          `SELECT ${def.select} FROM ${def.from} WHERE ${where.join(" AND ")}`,
          values,
        )
      ).rows[0];
      assert(row, 404, "Record not found");
      if (kind === "patient") {
        const params = [row.id];
        let condition = "";
        if (req.user.role === "DOCTOR") {
          params.push(req.user.doctor_id);
          condition = " AND ec.doctor_id=$2";
        }
        row.cases = (
          await pool.query(
            `SELECT ${definitions.case.select} FROM ${definitions.case.from} WHERE ec.patient_id=$1${condition} ORDER BY ec.created_at DESC LIMIT 50`,
            params,
          )
        ).rows;
        row.predictions = (
          await pool.query(
            "SELECT pr.* FROM predictions pr WHERE pr.case_id=ANY($1::int[]) ORDER BY created_at DESC LIMIT 50",
            [row.cases.map((c) => c.id)],
          )
        ).rows;
        row.activity = (
          await pool.query(
            "SELECT a.id,a.action,a.entity_id,a.created_at,u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity_type='case' AND a.entity_id=ANY($1::int[]) ORDER BY a.created_at DESC LIMIT 50",
            [row.cases.map((c) => c.id)],
          )
        ).rows;
      }
      res.json({ success: true, data: row });
    },
    create: async (req, res) => {
      const row = await transaction(async (c) => {
        if (kind === "case") {
          const p = (
            await c.query("SELECT id FROM patients WHERE id=$1 FOR UPDATE", [
              req.body.patientId,
            ])
          ).rows[0];
          assert(p, 404, "Patient not found");
        }
        const entries = Object.entries(req.body).filter(([k]) => def.fields[k]);
        const values = entries.map(([, v]) =>
          typeof v === "object" && v !== null ? JSON.stringify(v) : v,
        );
        const row = (
          await c.query(
            `INSERT INTO ${def.table}(${entries.map(([k]) => def.fields[k]).join(",")}) VALUES(${values.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING *`,
            values,
          )
        ).rows[0];
        if (kind === "case")
          await c.query(
            "UPDATE patients SET priority=$1,status='Waiting',updated_at=NOW() WHERE id=$2",
            [row.priority, row.patient_id],
          );
        await audit(
          c,
          req.user,
          `${def.entity.toUpperCase()}_CREATED`,
          def.entity,
          row.id,
        );
        return row;
      });
      res.status(201).json({ success: true, data: row });
    },
    update: async (req, res) => {
      const row = await transaction(async (c) => {
        const old = (
          await c.query(`SELECT * FROM ${def.table} WHERE id=$1 FOR UPDATE`, [
            +req.params.id,
          ])
        ).rows[0];
        assert(old, 404, "Record not found");
        if (kind === "case") {
          ownsCase(req.user, old);
          assert(
            old.status !== "Discharged",
            409,
            "Discharged cases are read-only",
          );
          assert(
            req.body.patientId === undefined,
            400,
            "Patient cannot be changed",
          );
        }
        if (kind === "patient") {
          const active = (
            await c.query(
              "SELECT id FROM emergency_cases WHERE patient_id=$1 AND status<>'Discharged'",
              [old.id],
            )
          ).rowCount;
          assert(
            !active ||
              req.body.priority === undefined ||
              req.body.priority === old.priority,
            409,
            "Change priority on the active case so both records stay consistent",
          );
        }
        if (kind === "bed" || kind === "doctor") {
          const col = kind === "bed" ? "bed_id" : "doctor_id";
          const active = (
            await c.query(
              `SELECT id FROM emergency_cases WHERE ${col}=$1 AND status<>'Discharged'`,
              [old.id],
            )
          ).rowCount;
          assert(
            !active ||
              (!Object.hasOwn(req.body, "status") &&
                !Object.hasOwn(req.body, "patientId")),
            409,
            "Use the emergency workflow to release assigned resources",
          );
          if (kind === "bed" && Object.hasOwn(req.body, "patientId"))
            req.body.status = req.body.status || "Available";
        }
        const entries = Object.entries(req.body).filter(([k]) => def.fields[k]);
        assert(entries.length, 400, "No changes supplied");
        const values = entries.map(([, v]) =>
          typeof v === "object" && v !== null ? JSON.stringify(v) : v,
        );
        values.push(old.id);
        const row = (
          await c.query(
            `UPDATE ${def.table} SET ${entries.map(([k], i) => `${def.fields[k]}=$${i + 1}`).join(",")},updated_at=NOW() WHERE id=$${values.length} RETURNING *`,
            values,
          )
        ).rows[0];
        if (kind === "case")
          await c.query(
            "UPDATE patients SET priority=$1,updated_at=NOW() WHERE id=$2",
            [row.priority, row.patient_id],
          );
        await audit(
          c,
          req.user,
          `${def.entity.toUpperCase()}_UPDATED`,
          def.entity,
          row.id,
          { fields: entries.map(([k]) => k) },
        );
        return row;
      });
      res.json({ success: true, data: row });
    },
    remove: async (req, res) => {
      const row = await transaction(async (c) => {
        const old = (
          await c.query(`SELECT * FROM ${def.table} WHERE id=$1 FOR UPDATE`, [
            +req.params.id,
          ])
        ).rows[0];
        assert(old, 404, "Record not found");
        if (kind === "case")
          assert(
            old.status === "Waiting" && !old.doctor_id && !old.bed_id,
            409,
            "Only an unassigned waiting case can be deleted; discharge other cases",
          );
        const row = (
          await c.query(`DELETE FROM ${def.table} WHERE id=$1 RETURNING *`, [
            old.id,
          ])
        ).rows[0];
        await audit(
          c,
          req.user,
          `${def.entity.toUpperCase()}_DELETED`,
          def.entity,
          row.id,
        );
        return row;
      });
      res.json({ success: true, data: row });
    },
  };
}
module.exports = crud;
