import { formatDate } from "../utils/format";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BrainCircuit, HeartPulse } from "lucide-react";
import { useAuth } from "../context/auth";
import useResource from "../hooks/useResource";
import { PageHeader, Panel, DataState, Empty } from "../components/UI";
import StatusBadge from "../components/StatusBadge";
export default function PatientDetail() {
  const { id } = useParams(),
    { can } = useAuth();
  const resource = useResource("/patients/" + id, 30000);
  const p = resource.data,
    c = p?.cases?.[0];
  return (
    <>
      <Link className="text-link back" to="/patients">
        <ArrowLeft size={15} />
        Patient directory
      </Link>
      <PageHeader
        title={p?.name || "Patient record"}
        description={`CF-${String(id).padStart(4, "0")} · Synthetic patient record`}
      >
        {c && can("ADMIN", "DOCTOR", "NURSE") && (
          <Link className="btn" to={"/decision-support?case=" + c.id}>
            <BrainCircuit size={17} />
            Decision support
          </Link>
        )}
      </PageHeader>
      <DataState resource={resource}>
        {p && (
          <>
            <div className="detail-summary">
              <div>
                <small>Age</small>
                <strong>{p.age} years</strong>
              </div>
              <div>
                <small>Priority</small>
                <StatusBadge status={p.priority} />
              </div>
              <div>
                <small>Current status</small>
                <StatusBadge status={p.status} />
              </div>
              <div>
                <small>Registered</small>
                <strong>{formatDate(p.created_at)}</strong>
              </div>
            </div>
            {c ? (
              <div className="detail-grid">
                <div>
                  <Panel
                    title="Latest emergency case"
                    description={`Case #${c.id} · ${c.symptoms}`}
                    action={
                      <Link className="text-link" to="/emergency">
                        Operations →
                      </Link>
                    }
                  >
                    <div className="detail-pairs">
                      <div>
                        <span>Assigned doctor</span>
                        <strong>{c.doctor_name || "Unassigned"}</strong>
                      </div>
                      <div>
                        <span>Bed</span>
                        <strong>{c.bed_number || "Unassigned"}</strong>
                      </div>
                      <div>
                        <span>Operational note</span>
                        <strong>
                          {c.recommendation || "No note recorded"}
                        </strong>
                      </div>
                    </div>
                  </Panel>
                  <Panel
                    title="Recorded vitals"
                    description="Latest submitted values. Not continuous monitoring."
                    action={<HeartPulse size={19} />}
                  >
                    <div className="vitals-grid">
                      {Object.entries(c.vitals || {}).map(([key, value]) => (
                        <div key={key}>
                          <small>
                            {{
                              heartRate: "Heart rate · bpm",
                              systolicBP: "Systolic BP · mmHg",
                              respiratoryRate: "Respiratory rate · /min",
                              temperature: "Temperature · °C",
                              oxygenSaturation: "Oxygen saturation · %",
                            }[key] || key}
                          </small>
                          <strong>{value}</strong>
                        </div>
                      ))}
                      {!Object.keys(c.vitals || {}).length && (
                        <p className="muted">No vitals recorded.</p>
                      )}
                    </div>
                  </Panel>
                </div>
                <Panel
                  title="Workflow timeline"
                  description="Recorded case timestamps"
                >
                  <ol className="timeline">
                    {[
                      ["Arrival", "arrival_time"],
                      ["Doctor assigned", "doctor_assigned_at"],
                      ["Bed allocated", "bed_assigned_at"],
                      ["Treatment started", "treatment_started_at"],
                      ["Treatment completed", "treatment_completed_at"],
                      ["Discharged", "discharged_at"],
                    ].map(([label, key]) => (
                      <li className={c[key] ? "done" : ""} key={key}>
                        <i />
                        <div>
                          <strong>{label}</strong>
                          <small>
                            {c[key] ? formatDate(c[key]) : "Not recorded"}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>
            ) : (
              <Empty
                title="No emergency cases"
                description="Create a case from Emergency Operations when needed."
              />
            )}
            <Panel
              title="Case history"
              description="Most recent 50 cases accessible to your role"
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Arrival</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.cases.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>{formatDate(r.arrival_time)}</td>
                        <td>
                          <StatusBadge status={r.priority} />
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td>{r.doctor_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            {p.predictions?.length > 0 && (
              <Panel title="Decision-support history">
                <div className="activity-list">
                  {p.predictions.map((r) => (
                    <div key={r.id}>
                      <BrainCircuit size={18} />
                      <div>
                        <strong>{r.result.predictedPriority} suggestion</strong>
                        <small>
                          {r.model_version} · {formatDate(r.created_at)}
                        </small>
                        {r.override_reason && (
                          <p>Override reason: {r.override_reason}</p>
                        )}
                      </div>
                      <StatusBadge status={r.human_action} />
                    </div>
                  ))}
                </div>
              </Panel>
            )}
            <Panel title="Case activity" description="Recent workflow events">
              <div className="activity-list">
                {p.activity.map((a) => (
                  <div key={a.id}>
                    <span className="activity-dot" />
                    <div>
                      <strong>
                        {a.action.replaceAll("_", " ").toLowerCase()}
                      </strong>
                      <small>
                        {a.actor || "System"} · {formatDate(a.created_at)}
                      </small>
                    </div>
                  </div>
                ))}
                {!p.activity.length && (
                  <Empty
                    title="No activity recorded"
                    description="New workflow actions will appear here."
                  />
                )}
              </div>
            </Panel>
          </>
        )}
      </DataState>
    </>
  );
}
