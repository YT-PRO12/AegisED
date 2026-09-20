const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");
const env = require("./config/env");
const pool = require("./config/db");
const { authenticate, allow } = require("./middleware/auth");
const {
  z,
  validate,
  schemas,
  validId,
  id,
  priority,
} = require("./middleware/validation");
const { assert, AppError } = require("./utils/errors");
const auth = require("./controllers/authController");
const ai = require("./controllers/aiController");
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY_HOPS)
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  const start = Date.now();
  res.on("finish", () => {
    if (process.env.NODE_ENV !== "test")
      console.log(
        JSON.stringify({
          level: "info",
          requestId: req.id,
          method: req.method,
          route: req.route?.path || "unmatched",
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      );
  });
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        ...(!env.production ? { "upgrade-insecure-requests": null } : {}),
      },
    },
  }),
);
app.use(cors({ origin: env.origin, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin"))
    assert(req.get("origin") === env.origin, 403, "Origin not allowed");
  next();
});
const limit = (max, windowMs = 60000) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  });
app.use("/api", limit(process.env.NODE_ENV === "test" ? 10000 : 600));
app.get("/api/health", (req, res) =>
  res.json({ success: true, data: { service: "AegisED-api", status: "ok" } }),
);
app.get("/api/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, data: { database: "ok" } });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});
app.post(
  "/api/auth/login",
  limit(10, 15 * 60000),
  validate(schemas.login),
  auth.login,
);
app.use("/api", authenticate);
app.get("/api/auth/me", auth.me);
app.post("/api/auth/logout", auth.logout);
app.post(
  "/api/auth/password",
  validate(
    z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12).max(128),
      })
      .strict(),
  ),
  auth.changePassword,
);
app.get("/api/users", allow("ADMIN"), auth.users);
app.post("/api/users", allow("ADMIN"), validate(schemas.user), auth.createUser);
for (const [url, file] of [
  ["patients", "patient"],
  ["doctors", "doctor"],
  ["beds", "bed"],
  ["emergency-cases", "emergencyCase"],
  ["emergency-cases", "emergencyWorkflow"],
  ["dashboard", "dashboard"],
])
  app.use("/api/" + url, require("./routes/" + file + "Routes"));
app.get(
  "/api/analytics",
  allow("ADMIN", "NURSE"),
  require("./controllers/analyticsController").analytics,
);
app.get("/api/audit", allow("ADMIN"), async (req, res) => {
  const q = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      action: z.string().max(80).default(""),
    })
    .parse(req.query);
  const args = ["%" + q.action + "%"];
  const total = +(
    await pool.query(
      "SELECT COUNT(*) FROM audit_logs WHERE action ILIKE $1",
      args,
    )
  ).rows[0].count;
  const data = (
    await pool.query(
      "SELECT a.*,u.name AS actor,u.role FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE a.action ILIKE $1 ORDER BY a.id DESC LIMIT 30 OFFSET $2",
      [...args, (q.page - 1) * 30],
    )
  ).rows;
  res.json({
    success: true,
    data,
    pagination: {
      page: q.page,
      limit: 30,
      total,
      pages: Math.ceil(total / 30),
    },
  });
});
app.get(
  "/api/emergency-cases/:id/recommendations",
  validId,
  ai.recommendations,
);
app.post(
  "/api/ai/predict",
  allow("ADMIN", "DOCTOR", "NURSE"),
  limit(20),
  validate(z.object({ caseId: id, vitals: schemas.vitals }).strict()),
  ai.predict,
);
app.get(
  "/api/ai/predictions",
  allow("ADMIN", "DOCTOR", "NURSE"),
  ai.predictions,
);
app.post(
  "/api/ai/predictions/:id/review",
  validId,
  allow("ADMIN", "DOCTOR"),
  validate(
    z
      .object({
        action: z.enum(["ACCEPT", "OVERRIDE", "REVIEW"]),
        priority: priority.optional(),
        reason: z.string().trim().min(5).max(1000).optional(),
      })
      .strict(),
  ),
  ai.review,
);
app.get("/api/ai/model", ai.model);
app.post(
  "/api/knowledge",
  limit(15),
  validate(z.object({ question: z.string().trim().min(3).max(500) }).strict()),
  ai.knowledge,
);
app.get("/api/db-test", allow("ADMIN"), async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ success: true, data: { database: "ok" } });
});
app.get("/api/services", allow("ADMIN"), async (req, res) => {
  let ml = "unavailable";
  try {
    await ai.ml("/health");
    ml = "ok";
  } catch {}
  res.json({ success: true, data: { api: "ok", ml } });
});
app.use("/api", (req, res, next) =>
  next(new AppError(404, "API route not found")),
);
const dist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500,
    message = err.message;
  if (err instanceof z.ZodError) {
    status = 400;
    message = err.issues
      .map((i) => `${i.path.join(".") || "Request"}: ${i.message}`)
      .join("; ");
  }
  if (["23505", "23503", "23514", "40P01", "40001"].includes(err.code)) {
    status = 409;
    message =
      err.code === "23505"
        ? "A conflicting record or active assignment already exists"
        : err.code === "23503"
          ? "Referenced record is missing or still in use"
          : "Operation conflicts with the current workflow. Refresh and try again.";
  }
  if (status >= 500) {
    message = "Service temporarily unavailable";
    console.error(
      JSON.stringify({
        level: "error",
        requestId: req.id,
        code: err.code || err.name,
      }),
    );
  }
  res.status(status).json({ success: false, message, requestId: req.id });
});
module.exports = app;

