const router = require("express").Router();
const c = require("../controllers/emergencyWorkflowController");
const { allow } = require("../middleware/auth");
const { validate, validId, z, id } = require("../middleware/validation");
router.param("id", validId);
router.post(
  "/:id/assign-doctor",
  allow("ADMIN", "NURSE"),
  validate(z.object({ doctorId: id }).strict()),
  c.assignDoctor,
);
router.post(
  "/:id/assign-bed",
  allow("ADMIN", "NURSE"),
  validate(z.object({ bedId: id }).strict()),
  c.assignBed,
);
router.post("/:id/start-treatment", allow("ADMIN", "DOCTOR"), c.startTreatment);
router.post(
  "/:id/complete-treatment",
  allow("ADMIN", "DOCTOR"),
  c.completeTreatment,
);
router.post("/:id/discharge", allow("ADMIN", "DOCTOR"), c.dischargePatient);
module.exports = router;
