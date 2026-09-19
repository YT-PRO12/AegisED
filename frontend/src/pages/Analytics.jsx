import { useState } from "react";
import { Activity, Clock3, BedDouble, LogOut } from "lucide-react";
import useResource from "../hooks/useResource";
import { PageHeader, Panel, DataState, Field } from "../components/UI";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { VolumeChart, HourChart } from "../components/Charts";
export default function Analytics() {
  const [query, setQuery] = useState("days=30"),
    [period, setPeriod] = useState("30");
  const resource = useResource("/analytics?" + query);
  const d = resource.data,
    s = d?.summary;
  return (
    <>
      <PageHeader
        title="Department analytics"
        description="From recorded activity to a more informed operation."
      >
        <div className="segmented">
          {[
            ["1", "Today"],
            ["7", "7 days"],
            ["30", "30 days"],
            ["custom", "Custom"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={period === v ? "selected" : ""}
              onClick={() => {
                setPeriod(v);
                if (v !== "custom") setQuery("days=" + v);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </PageHeader>
      {period === "custom" && (
        <form
          className="range-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setQuery(`from=${f.get("from")}&to=${f.get("to")}`);
          }}
        >
          <Field label="From (UTC)" type="date" name="from" required />
          <Field label="Through (UTC)" type="date" name="to" required />
          <button className="btn primary">Apply dates</button>
        </form>
      )}
      <DataState resource={resource}>
        {d && (
          <>
            <div className="context-strip">
              <span>
                Arrival cohort · {d.range.from.slice(0, 10)} to{" "}
                {new Date(new Date(d.range.to) - 1).toISOString().slice(0, 10)}{" "}
                · UTC
              </span>
              <span>PostgreSQL aggregations</span>
            </div>
            <div className="stats-grid">
              <StatCard
                title="Emergency arrivals"
                value={s.volume}
                description={`${s.active} still active in this cohort`}
                icon={Activity}
              />
              <StatCard
                title="Average wait"
                value={s.avg_wait_minutes ? `${s.avg_wait_minutes} min` : "—"}
                description={`Arrival to doctor · ${s.wait_samples} cases`}
                icon={Clock3}
              />
              <StatCard
                title="Current occupancy"
                value={`${d.beds.occupancyPercent}%`}
                description={`${d.beds.occupied} of ${d.beds.total} beds occupied now`}
                icon={BedDouble}
              />
              <StatCard
                title="Discharged cases"
                value={s.discharges}
                description="Currently discharged in arrival cohort"
                icon={LogOut}
              />
            </div>
            <div className="two-columns">
              <Panel
                title="Arrival trend"
                description="Emergency volume by arrival date"
              >
                <VolumeChart data={d.trend} />
              </Panel>
              <Panel
                title="Peak arrival hours"
                description="Arrival distribution by UTC hour"
              >
                <HourChart data={d.hours} />
              </Panel>
            </div>
            <div className="two-columns">
              <Panel
                title="Priority distribution"
                description="All arrivals in selected period"
              >
                <div className="distribution">
                  {d.priorities.map((p) => (
                    <div key={p.priority}>
                      <div className="spread">
                        <StatusBadge status={p.priority} />
                        <strong>
                          {p.count} <small>cases</small>
                        </strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className={p.priority.toLowerCase()}
                          style={{
                            width: `${s.volume ? (100 * p.count) / s.volume : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Operational timings"
                description="Only cases with recorded timestamps contribute"
              >
                <div className="detail-pairs">
                  <div>
                    <span>Average treatment duration</span>
                    <strong>{s.avg_treatment_minutes ?? "—"} min</strong>
                  </div>
                  <div>
                    <span>Completed treatment samples</span>
                    <strong>{s.treatment_samples}</strong>
                  </div>
                  <div>
                    <span>Occupied bed hours in interval</span>
                    <strong>{d.beds.occupiedBedHours.toFixed(1)} h</strong>
                  </div>
                  <div>
                    <span>Estimated bed utilization</span>
                    <strong>{d.beds.utilizationPercent}%</strong>
                  </div>
                </div>
                <p className="footnote">
                  Utilization assumes a constant inventory of {d.beds.total}{" "}
                  beds. Current occupancy is a snapshot. Missing legacy
                  timestamps are excluded.
                </p>
              </Panel>
            </div>
            <Panel
              title="Doctor workload"
              description="Assignments within the selected arrival cohort"
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Current status</th>
                      <th>Cases handled</th>
                      <th>Still active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.doctors.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.specialization}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td>{r.cases_handled}</td>
                        <td>{r.active_cases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </DataState>
    </>
  );
}
