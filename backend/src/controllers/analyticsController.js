const pool = require("../config/db");
const { z } = require("../middleware/validation");
const { assert } = require("../utils/errors");
exports.analytics = async (req, res) => {
  const q = z
    .object({
      days: z.coerce.number().int().min(1).max(365).default(30),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    })
    .parse(req.query);
  const end = q.to ? new Date(q.to + "T00:00:00Z") : new Date();
  if (q.to) end.setUTCDate(end.getUTCDate() + 1);
  const start = q.from
    ? new Date(q.from + "T00:00:00Z")
    : new Date(end.getTime() - (q.days - 1) * 86400000);
  if (!q.from) start.setUTCHours(0, 0, 0, 0);
  assert(
    end > start && end - start <= 366 * 86400000,
    400,
    "Choose a valid date range of at most one year",
  );
  const params = [start, end];
  const [summary, trend, priorities, hours, doctors, beds, utilization] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS volume,COUNT(*) FILTER(WHERE status<>'Discharged')::int AS active,
   COUNT(*) FILTER(WHERE status='Discharged')::int AS discharges,
   ROUND(AVG(EXTRACT(EPOCH FROM (doctor_assigned_at-arrival_time))/60)::numeric,1) AS avg_wait_minutes,
   ROUND(AVG(EXTRACT(EPOCH FROM (treatment_completed_at-treatment_started_at))/60)::numeric,1) AS avg_treatment_minutes,
   COUNT(doctor_assigned_at)::int AS wait_samples,COUNT(treatment_completed_at)::int AS treatment_samples
   FROM emergency_cases WHERE arrival_time >= $1 AND arrival_time < $2`,
        params,
      ),
      pool.query(
        `SELECT TO_CHAR(d.day,'YYYY-MM-DD') AS date,COUNT(ec.id)::int AS arrivals,COUNT(ec.id) FILTER(WHERE ec.status='Discharged')::int AS discharged
   FROM generate_series(($1::timestamptz AT TIME ZONE 'UTC')::date::timestamp,(($2::timestamptz AT TIME ZONE 'UTC')-interval '1 microsecond')::date::timestamp,interval '1 day') d(day)
   LEFT JOIN emergency_cases ec ON ec.arrival_time>=(d.day AT TIME ZONE 'UTC') AND ec.arrival_time<((d.day+interval '1 day') AT TIME ZONE 'UTC') AND ec.arrival_time >= $1 AND ec.arrival_time<$2
   GROUP BY d.day ORDER BY d.day`,
        params,
      ),
      pool.query(
        "SELECT priority,COUNT(*)::int AS count FROM emergency_cases WHERE arrival_time >= $1 AND arrival_time < $2 GROUP BY priority",
        params,
      ),
      pool.query(
        "SELECT EXTRACT(HOUR FROM arrival_time AT TIME ZONE 'UTC')::int AS hour,COUNT(*)::int AS count FROM emergency_cases WHERE arrival_time >= $1 AND arrival_time < $2 GROUP BY hour ORDER BY hour",
        params,
      ),
      pool.query(
        `SELECT d.id,d.name,d.specialization,d.status,COUNT(ec.id)::int AS cases_handled,COUNT(ec.id) FILTER(WHERE ec.status<>'Discharged')::int AS active_cases FROM doctors d LEFT JOIN emergency_cases ec ON ec.doctor_id=d.id AND ec.arrival_time >= $1 AND ec.arrival_time < $2 GROUP BY d.id ORDER BY cases_handled DESC`,
        params,
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='Occupied')::int AS occupied,COUNT(*) FILTER(WHERE status='Available')::int AS available FROM beds",
      ),
      pool.query(
        `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (LEAST(COALESCE(discharged_at,NOW()),$2)-GREATEST(bed_assigned_at,$1))))/3600,0)::float AS occupied_bed_hours FROM emergency_cases WHERE bed_assigned_at<$2 AND COALESCE(discharged_at,NOW())>$1`,
        params,
      ),
    ]);
  const b = beds.rows[0],
    hoursInRange =
      (Math.min(end.getTime(), Date.now()) - start.getTime()) / 3600000;
  res.json({
    success: true,
    data: {
      range: {
        from: start.toISOString(),
        to: end.toISOString(),
        timezone: "UTC",
      },
      summary: summary.rows[0],
      trend: trend.rows,
      priorities: priorities.rows,
      hours: hours.rows,
      doctors: doctors.rows,
      beds: {
        ...b,
        occupancyPercent: b.total
          ? Math.round((100 * b.occupied) / b.total)
          : 0,
        occupiedBedHours: utilization.rows[0].occupied_bed_hours,
        utilizationPercent:
          b.total && hoursInRange > 0
            ? Math.round(
                ((100 * utilization.rows[0].occupied_bed_hours) /
                  (b.total * hoursInRange)) *
                  10,
              ) / 10
            : 0,
      },
    },
  });
};
