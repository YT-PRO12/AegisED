import useClock from "../hooks/useClock";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Clock3,
  Stethoscope,
  BedDouble,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import useResource from "../hooks/useResource";
import { request } from "../services/api";
import {
  PageHeader,
  Panel,
  DataState,
  Empty,
  SearchInput,
  Pagination,
  Modal,
  Field,
} from "../components/UI";
import StatusBadge from "../components/StatusBadge";
function Intake({ onClose, onDone }) {
  const [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const patients = useResource(
    "/patients?limit=50&search=" + encodeURIComponent(search),
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await request("/emergency-cases", {
        method: "POST",
        body: {
          patientId: +f.get("patientId"),
          symptoms: f.get("symptoms"),
          priority: f.get("priority"),
        },
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="New emergency case" onClose={onClose}>
      <form className="form-body" onSubmit={submit}>
        <p className="muted">
          Register a new patient in the Patients directory first.
        </p>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Find registered patient…"
        />
        <DataState resource={patients}>
          <Field label="Patient">
            <select name="patientId" required defaultValue="">
              <option value="" disabled>
                Select a patient
              </option>
              {patients.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.age} years
                </option>
              ))}
            </select>
          </Field>
        </DataState>
        <Field label="Reported symptoms">
          <textarea
            name="symptoms"
            placeholder="Use synthetic scenario details only"
            required
            maxLength={2000}
            rows={3}
          />
        </Field>
        <Field label="Human-assigned priority">
          <select name="priority">
            {["Stable", "Urgent", "Critical"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? "Creating…" : "Create case"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Assignment({ item, type, onClose, onDone }) {
  const resources = useResource(
      `/${type === "doctor" ? "doctors" : "beds"}?status=Available&limit=100&order=asc`,
    ),
    recommend = useResource(`/emergency-cases/${item.id}/recommendations`);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const selected = +new FormData(e.currentTarget).get("resource");
    try {
      await request(`/emergency-cases/${item.id}/assign-${type}`, {
        method: "POST",
        body: { [type + "Id"]: selected },
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const recommendation =
    recommend.data?.[type === "doctor" ? "doctors" : "beds"]?.[0];
  return (
    <Modal title={`Assign ${type} · ${item.patient_name}`} onClose={onClose}>
      <form className="form-body" onSubmit={submit}>
        {recommendation && (
          <div className="info-box">
            <strong>
              Operational suggestion:{" "}
              {recommendation.name || recommendation.bed_number}
            </strong>
            <p>{recommendation.reason}</p>
            <small>Rule-based suggestion. You choose the resource.</small>
          </div>
        )}
        <DataState resource={resources}>
          <Field label={`Available ${type}`}>
            <select name="resource" required defaultValue="">
              <option value="" disabled>
                Choose a {type}
              </option>
              {resources.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ? `${r.name} · ${r.specialization}` : r.bed_number}
                </option>
              ))}
            </select>
          </Field>
          {resources.data?.length === 0 && (
            <p>No available resources. Please check capacity.</p>
          )}
        </DataState>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={busy || !resources.data?.length}
          >
            {busy ? "Assigning…" : "Confirm assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function EditCase({ item, onClose, onDone }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Update case details" onClose={onClose}>
      <form
        className="form-body"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            await request("/emergency-cases/" + item.id, {
              method: "PUT",
              body: {
                symptoms: f.get("symptoms"),
                priority: f.get("priority"),
                recommendation: f.get("recommendation"),
              },
            });
            onDone();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Reported symptoms">
          <textarea
            name="symptoms"
            required
            maxLength={2000}
            defaultValue={item.symptoms}
          />
        </Field>
        <Field label="Human-assigned priority">
          <select name="priority" defaultValue={item.priority}>
            {["Stable", "Urgent", "Critical"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Operational note">
          <textarea
            name="recommendation"
            maxLength={2000}
            defaultValue={item.recommendation || ""}
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Emergency() {
  const now = useClock();
  const [params, setParams] = useSearchParams(),
    { can } = useAuth(),
    toast = useToast();
  const [search, setSearch] = useState(""),
    [priority, setPriority] = useState(""),
    [status, setStatus] = useState("Active"),
    [page, setPage] = useState(1),
    [modal, setModal] = useState(() =>
      params.has("new") ? { kind: "intake" } : null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const cases = useResource(
    `/emergency-cases?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&priority=${priority || ""}&sort=priority&limit=9&page=${page}`.replace(
      "&priority=&",
      "&",
    ),
    30000,
  );
  function close() {
    setModal(null);
    setError("");
    if (params.has("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }
  function done() {
    close();
    cases.refresh();
    toast("Emergency case updated");
  }
  async function transition() {
    setBusy(true);
    setError("");
    try {
      await request(`/emergency-cases/${modal.item.id}/${modal.action}`, {
        method: modal.action === "delete" ? "DELETE" : "POST",
      });
      done();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Emergency operations"
        description="A coordinated path from arrival to discharge."
      >
        {can("ADMIN", "NURSE", "RECEPTION") && (
          <button
            className="btn primary"
            onClick={() => setModal({ kind: "intake" })}
          >
            <Plus size={17} />
            New case
          </button>
        )}
      </PageHeader>
      <Panel
        title="Case workspace"
        description="Priority is assigned or reviewed by a human."
      >
        <div className="toolbar wrap">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search cases or patients…"
          />
          <select
            aria-label="Case status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {[
              "Active",
              "Waiting",
              "Assigned",
              "In Treatment",
              "Completed",
              "Discharged",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Case priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All priorities</option>
            {["Critical", "Urgent", "Stable"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </Panel>
      <DataState resource={cases}>
        <div className="case-grid">
          {cases.data?.map((item) => (
            <article
              className={`case-card priority-${item.priority.toLowerCase()}`}
              key={item.id}
            >
              <div className="spread">
                <span className="case-id">
                  CASE #{String(item.id).padStart(4, "0")}
                </span>
                <StatusBadge status={item.priority} />
              </div>
              <Link
                className="case-patient"
                to={"/patients/" + item.patient_id}
              >
                {item.patient_name}
              </Link>
              <p className="case-meta">
                {item.patient_age} years <span>·</span> <Clock3 size={13} />
                {Math.max(
                  0,
                  Math.round((now - new Date(item.arrival_time)) / 60000),
                )}{" "}
                min since arrival
              </p>
              <p className="symptoms">{item.symptoms}</p>
              <div className="case-resources">
                <span>
                  <Stethoscope size={15} />
                  {item.doctor_name || "Doctor unassigned"}
                </span>
                <span>
                  <BedDouble size={15} />
                  {item.bed_number || "Bed unassigned"}
                </span>
              </div>
              <div className="spread">
                <StatusBadge status={item.status} />
                {item.status !== "Discharged" &&
                  can("ADMIN", "DOCTOR", "NURSE") && (
                    <button
                      className="icon-btn"
                      aria-label={`Edit case ${item.id}`}
                      onClick={() => setModal({ kind: "edit", item })}
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  )}
              </div>
              <div className="case-actions">
                {can("ADMIN", "NURSE") && item.status === "Waiting" && (
                  <button
                    className="btn primary"
                    onClick={() =>
                      setModal({ kind: "assign", type: "doctor", item })
                    }
                  >
                    Assign doctor
                    <ArrowRight size={15} />
                  </button>
                )}
                {can("ADMIN", "NURSE") &&
                  item.status === "Assigned" &&
                  !item.bed_id && (
                    <button
                      className="btn primary"
                      onClick={() =>
                        setModal({ kind: "assign", type: "bed", item })
                      }
                    >
                      Assign bed
                      <ArrowRight size={15} />
                    </button>
                  )}
                {can("ADMIN", "DOCTOR") &&
                  ((item.status === "Assigned" && item.bed_id) ||
                    ["In Treatment", "Completed"].includes(item.status)) && (
                    <button
                      className="btn primary"
                      onClick={() =>
                        setModal({
                          kind: "transition",
                          item,
                          ...{
                            Assigned: {
                              action: "start-treatment",
                              label: "Start treatment",
                            },
                            "In Treatment": {
                              action: "complete-treatment",
                              label: "Complete treatment",
                            },
                            Completed: {
                              action: "discharge",
                              label: "Discharge patient",
                            },
                          }[item.status],
                        })
                      }
                    >
                      {item.status === "Assigned"
                        ? "Start treatment"
                        : item.status === "In Treatment"
                          ? "Complete treatment"
                          : "Discharge patient"}
                      <ArrowRight size={15} />
                    </button>
                  )}
                <Link className="text-link" to={"/patients/" + item.patient_id}>
                  Patient details
                </Link>
              </div>
            </article>
          ))}
        </div>
        {cases.data?.length === 0 && <Empty title="No cases in this view" />}
        <Pagination pagination={cases.pagination} onPage={setPage} />
      </DataState>
      {modal?.kind === "intake" && <Intake onClose={close} onDone={done} />}{" "}
      {modal?.kind === "assign" && (
        <Assignment {...modal} onClose={close} onDone={done} />
      )}{" "}
      {modal?.kind === "edit" && (
        <EditCase item={modal.item} onClose={close} onDone={done} />
      )}{" "}
      {modal?.kind === "transition" && (
        <Modal
          title={modal.label}
          onClose={() => {
            if (!busy) close();
          }}
        >
          <div className="form-body">
            <p>
              Confirm <strong>{modal.label.toLowerCase()}</strong> for{" "}
              {modal.item.patient_name}. This action is recorded in the audit
              trail.
            </p>
            {modal.action === "discharge" && (
              <p>The assigned doctor and bed will become available.</p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="btn" onClick={close} disabled={busy}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={transition}
                disabled={busy}
              >
                {busy ? "Updating…" : "Confirm action"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
