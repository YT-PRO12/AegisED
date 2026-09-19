const router = require("express").Router();
const c = require("../controllers/emergencyCaseController");
const { allow } = require("../middleware/auth");
const { schemas, validate, validId } = require("../middleware/validation");
router.param("id", validId);
router.get("/", c.getEmergencyCases);
router.get("/:id", c.getEmergencyCaseById);
router.post(
  "/",
  allow("ADMIN", "NURSE", "RECEPTION"),
  validate(schemas.case),
  c.createEmergencyCase,
);
router.put(
  "/:id",
  allow("ADMIN", "DOCTOR", "NURSE"),
  validate(schemas.case.partial()),
  c.updateEmergencyCase,
);
router.patch(
  "/:id",
  allow("ADMIN", "DOCTOR", "NURSE"),
  validate(schemas.case.partial()),
  c.updateEmergencyCase,
);
router.delete("/:id", allow("ADMIN"), c.deleteEmergencyCase);
module.exports = router;
