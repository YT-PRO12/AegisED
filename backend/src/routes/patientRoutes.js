const router = require("express").Router();
const c = require("../controllers/patientController");
const { allow } = require("../middleware/auth");
const { schemas, validate, validId } = require("../middleware/validation");
router.param("id", validId);
router.get("/", c.getPatients);
router.get("/:id", c.getPatientById);
router.post(
  "/",
  allow("ADMIN", "NURSE", "RECEPTION"),
  validate(schemas.patient),
  c.createPatient,
);
router.put(
  "/:id",
  allow("ADMIN", "NURSE", "RECEPTION"),
  validate(schemas.patient.partial()),
  c.updatePatient,
);
router.patch(
  "/:id",
  allow("ADMIN", "NURSE", "RECEPTION"),
  validate(schemas.patient.partial()),
  c.updatePatient,
);
router.delete("/:id", allow("ADMIN"), c.deletePatient);
module.exports = router;
