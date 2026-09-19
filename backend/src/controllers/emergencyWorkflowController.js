const transaction = require("../services/transaction");
const audit = require("../services/audit");
const { assert } = require("../utils/errors");
const { ownsCase } = require("../middleware/auth");
const transition = (action) => async (req, res) => {
  const result = await transaction(async (c) => {
    const ec = (
      await c.query("SELECT * FROM emergency_cases WHERE id=$1 FOR UPDATE", [
        +req.params.id,
      ])
    ).rows[0];
    assert(ec, 404, "Emergency case not found");
    ownsCase(req.user, ec);
    let row;
    if (action === "DOCTOR_ASSIGNED") {
      assert(
        ec.status === "Waiting" && !ec.doctor_id,
        409,
        "Only unassigned waiting cases can receive a doctor",
      );
      const doctor = (
        await c.query("SELECT * FROM doctors WHERE id=$1 FOR UPDATE", [
          req.body.doctorId,
        ])
      ).rows[0];
      assert(doctor, 404, "Doctor not found");
      assert(doctor.status === "Available", 409, "Doctor is not available");
      row = (
        await c.query(
          "UPDATE emergency_cases SET doctor_id=$1,status='Assigned',doctor_assigned_at=NOW(),updated_at=NOW() WHERE id=$2 RETURNING *",
          [doctor.id, ec.id],
        )
      ).rows[0];
      await c.query(
        "UPDATE doctors SET status='Busy',updated_at=NOW() WHERE id=$1",
        [doctor.id],
      );
    } else if (action === "BED_ASSIGNED") {
      assert(
        ec.status === "Assigned" && ec.doctor_id && !ec.bed_id,
        409,
        "Assign a doctor first; a case can have only one bed",
      );
      const bed = (
        await c.query("SELECT * FROM beds WHERE id=$1 FOR UPDATE", [
          req.body.bedId,
        ])
      ).rows[0];
      assert(bed, 404, "Bed not found");
      assert(
        bed.status === "Available" && !bed.patient_id,
        409,
        "Bed is not available",
      );
      row = (
        await c.query(
          "UPDATE emergency_cases SET bed_id=$1,bed_assigned_at=NOW(),updated_at=NOW() WHERE id=$2 RETURNING *",
          [bed.id, ec.id],
        )
      ).rows[0];
      await c.query(
        "UPDATE beds SET status='Occupied',patient_id=$1,updated_at=NOW() WHERE id=$2",
        [ec.patient_id, bed.id],
      );
    } else {
      const next = {
        TREATMENT_STARTED: ["Assigned", "In Treatment", "treatment_started_at"],
        TREATMENT_COMPLETED: [
          "In Treatment",
          "Completed",
          "treatment_completed_at",
        ],
        PATIENT_DISCHARGED: ["Completed", "Discharged", "discharged_at"],
      }[action];
      assert(
        ec.status === next[0],
        409,
        `Case must be ${next[0]} before this action`,
      );
      assert(ec.doctor_id && ec.bed_id, 409, "Doctor and bed are required");
      if (action === "PATIENT_DISCHARGED") {
        await c.query(
          "UPDATE doctors SET status='Available',updated_at=NOW() WHERE id=$1",
          [ec.doctor_id],
        );
        await c.query(
          "UPDATE beds SET status='Available',patient_id=NULL,updated_at=NOW() WHERE id=$1",
          [ec.bed_id],
        );
      }
      row = (
        await c.query(
          `UPDATE emergency_cases SET status=$1,${next[2]}=NOW(),updated_at=NOW() WHERE id=$2 RETURNING *`,
          [next[1], ec.id],
        )
      ).rows[0];
    }
    await c.query(
      "UPDATE patients SET status=$1,priority=$2,updated_at=NOW() WHERE id=$3",
      [row.status, row.priority, row.patient_id],
    );
    await audit(c, req.user, action, "case", ec.id, {
      from: ec.status,
      to: row.status,
      doctorId: row.doctor_id,
      bedId: row.bed_id,
    });
    return row;
  });
  res.json({ success: true, data: result });
};
module.exports = {
  assignDoctor: transition("DOCTOR_ASSIGNED"),
  assignBed: transition("BED_ASSIGNED"),
  startTreatment: transition("TREATMENT_STARTED"),
  completeTreatment: transition("TREATMENT_COMPLETED"),
  dischargePatient: transition("PATIENT_DISCHARGED"),
};
