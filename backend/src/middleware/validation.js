const { z } = require("zod");
const { assert } = require("../utils/errors");
const priority = z.enum(["Critical", "Urgent", "Stable"]);
const id = z.number().int().positive();
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
function validId(req, res, next) {
  assert(
    /^\d+$/.test(req.params.id) &&
      Number.isSafeInteger(+req.params.id) &&
      +req.params.id > 0,
    400,
    "Invalid ID",
  );
  next();
}
function listParams(req) {
  const s = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().max(120).default(""),
      status: z.string().max(24).optional(),
      priority: priority.optional(),
      sort: z
        .enum(["id", "name", "created_at", "priority", "arrival_time"])
        .default("id"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .parse(req.query);
  return { ...s, offset: (s.page - 1) * s.limit };
}
module.exports = { z, schemas, validate, validId, listParams, id, priority };
