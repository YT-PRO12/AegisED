const router = require("express").Router();
const c = require("../controllers/doctorController");
const { allow } = require("../middleware/auth");
const { schemas, validate, validId } = require("../middleware/validation");
router.param("id", validId);
router.get("/", c.getDoctors);
router.get("/:id", c.getDoctorById);
router.post("/", allow("ADMIN"), validate(schemas.doctor), c.createDoctor);
router.put(
  "/:id",
  allow("ADMIN"),
  validate(schemas.doctor.partial()),
  c.updateDoctor,
);
router.patch(
  "/:id",
  allow("ADMIN"),
  validate(schemas.doctor.partial()),
  c.updateDoctor,
);
router.delete("/:id", allow("ADMIN"), c.deleteDoctor);
module.exports = router;
