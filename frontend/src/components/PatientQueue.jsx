import useClock from "../hooks/useClock";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { Panel, Empty } from "./UI";
export default function PatientQueue({ patients = [] }) {
  const now = useClock();
  return (
    <Panel
      title="Patient queue"
      description="Priority first. Human review at every step."
      action={
        <Link className="text-link" to="/emergency">
          View operations →
        </Link>
      }
    >
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Waiting</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="patient-name"
                    to={"/patients/" + p.patient_id}
                  >
                    <span className="avatar pale">
                      {String(p.patient_id).padStart(2, "0").slice(-2)}
                    </span>
                    <span>
                      {p.patient_name}
                      <small>
                        CF-{String(p.patient_id).padStart(4, "0")} ·{" "}
                        {p.patient_age} years
                      </small>
                    </span>
                  </Link>
                </td>
                <td>
                  <StatusBadge status={p.priority} />
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>
                  {Math.max(
                    0,
                    Math.round((now - new Date(p.arrival_time)) / 60000),
                  )}{" "}
                  min
                </td>
                <td>
                  <Link className="text-link" to={"/patients/" + p.patient_id}>
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!patients.length && (
          <Empty
            title="The queue is clear"
            description="New waiting cases will appear here."
          />
        )}
      </div>
    </Panel>
  );
}
