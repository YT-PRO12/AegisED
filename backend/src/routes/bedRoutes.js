const router = require("express").Router();
const c = require("../controllers/bedController");
const { allow } = require("../middleware/auth");
const { schemas, validate, validId } = require("../middleware/validation");
router.param("id", validId);
router.get("/", c.getBeds);
router.get("/:id", c.getBedById);
router.post("/", allow("ADMIN", "NURSE"), validate(schemas.bed), c.createBed);
router.put(
  "/:id",
  allow("ADMIN", "NURSE"),
  validate(schemas.bed.partial()),
  c.updateBed,
);
router.patch(
  "/:id",
  allow("ADMIN", "NURSE"),
  validate(schemas.bed.partial()),
  c.updateBed,
);
router.delete("/:id", allow("ADMIN"), c.deleteBed);
module.exports = router;
