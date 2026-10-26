const { z } = require("zod");
const { assert } = require("../utils/errors");
const priority = z.enum(["Critical", "Urgent", "Stable"]);
const id = z.number().int().positive().max(2147483647);
const text = (max = 120) => z.string().trim().min(1).max(max);
const vitals = z
  .object({
    heartRate: z.number().min(25).max(250),
    systolicBP: z.number().min(50).max(250),
    respiratoryRate: z.number().min(5).max(60),
    temperature: z.number().min(30).max(43),
    oxygenSaturation: z.number().min(50).max(100),
  })
  .strict();
const schemas = {
  patient: z
    .object({ name: text(), age: z.number().int().min(0).max(120), priority })
    .strict(),
  doctor: z
    .object({
      name: text(),
      specialization: text(100),
      status: z.enum(["Available", "Off Duty"]).optional(),
    })
    .strict(),
  bed: z
    .object({
      bedNumber: text(40),
      status: z.enum(["Available", "Cleaning"]).optional(),
      patientId: z.null().optional(),
    })
    .strict(),
  case: z
    .object({
      patientId: id,
      symptoms: text(2000),
      priority,
      recommendation: z.string().trim().max(2000).nullable().optional(),
      vitals: vitals.optional(),
    })
    .strict(),
  login: z
    .object({
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(1).max(128),
    })
    .strict(),
  user: z
    .object({
      name: text(),
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(12).max(128),
      role: z.enum(["ADMIN", "DOCTOR", "NURSE", "RECEPTION"]),
      doctorId: id.optional(),
    })
    .strict(),
  vitals,
};
const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};
function parseId(value) {
  assert(
    typeof value === "string" &&
      /^\d+$/.test(value) &&
      Number.isSafeInteger(+value) &&
      +value > 0 &&
      +value <= 2147483647,
    400,
    "Invalid ID",
  );
  return +value;
}
function validId(req, res, next) {
  parseId(req.params.id);
  next();
}
const queryInteger = (max, fallback) =>
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().max(max))
    .default(fallback);
function listParams(req) {
  const s = z
    .object({
      page: queryInteger(2147483647, 1),
      limit: queryInteger(100, 20),
      search: z.string().max(120).default(""),
      status: z.string().max(24).optional(),
      priority: priority.optional(),
      sort: z
        .enum(["id", "name", "created_at", "priority", "arrival_time"])
        .default("id"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .parse(req.query);
  const offset = (s.page - 1) * s.limit;
  assert(offset <= 2147483647, 400, "Page offset is too large");
  return { ...s, offset };
}
module.exports = {
  z,
  schemas,
  validate,
  validId,
  parseId,
  listParams,
  id,
  priority,
};
