import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, BedDouble, Stethoscope } from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { request } from "../services/api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  Panel,
  DataState,
  Empty,
  SearchInput,
  Pagination,
  Modal,
  Field,
} from "./UI";
import StatusBadge from "./StatusBadge";
const configs = {
  patients: {
    singular: "patient",
    title: "Patients",
    description: "Patient records, connected to every stage of care.",
  },
  doctors: {
    singular: "doctor",
    title: "Doctors",
    description: "A shared view of the team and their availability.",
  },
  beds: {
    singular: "bed",
    title: "Beds & capacity",
    description: "Track availability and prepare the next space for care.",
  },
};
export default function ResourceManager({ type }) {
  const cfg = configs[type],
    { can } = useAuth(),
    toast = useToast();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "",
    page = +(params.get("page") || 1),
    status = params.get("status") || "";
  const resource = useResource(
    `/${type}?search=${encodeURIComponent(search)}&page=${page}&status=${encodeURIComponent(status)}&limit=12&order=desc`,
    30000,
  );
  const [modal, setModal] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const editable =
    type === "patients"
      ? can("ADMIN", "NURSE", "RECEPTION")
      : type === "beds"
        ? can("ADMIN", "NURSE")
        : can("ADMIN");
  function filter(k, v) {
    const p = new URLSearchParams(params);
    p.set(k, v);
    if (k !== "page") p.set("page", "1");
    setParams(p, { replace: true });
  }
  function open(record) {
    setError("");
    setModal({ kind: "edit", record });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      old = modal.record;
    let body;
    if (type === "patients")
      body = {
        name: f.get("name"),
        age: +f.get("age"),
        ...(!old || old.status === "Waiting" || old.status === "Discharged"
          ? { priority: f.get("priority") }
          : {}),
      };
    if (type === "doctors")
      body = {
        name: f.get("name"),
        specialization: f.get("specialization"),
        ...(old?.status === "Busy" ? {} : { status: f.get("status") }),
      };
    if (type === "beds")
      body = {
        bedNumber: f.get("bedNumber"),
        ...(old?.status === "Occupied"
          ? {}
          : { status: f.get("status"), patientId: null }),
      };
    try {
      await request("/" + type + (old ? "/" + old.id : ""), {
        method: old ? "PUT" : "POST",
        body,
      });
      toast(`${cfg.singular} ${old ? "updated" : "created"} successfully`);
      setModal(null);
      resource.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await request(`/${type}/${modal.record.id}`, { method: "DELETE" });
      setModal(null);
      toast("Record deleted");
      resource.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader title={cfg.title} description={cfg.description}>
        {editable && (
          <button className="btn primary" onClick={() => open(null)}>
            <Plus size={17} />
            Add {cfg.singular}
          </button>
        )}
      </PageHeader>
      <Panel
        title={type === "beds" ? "Department beds" : `${cfg.title} directory`}
        description={`${resource.pagination?.total ?? "—"} records`}
      >
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(v) => filter("search", v)}
            placeholder={`Search ${type}…`}
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => filter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {(type === "patients"
              ? [
                  "Waiting",
                  "Assigned",
                  "In Treatment",
                  "Completed",
                  "Discharged",
                ]
              : type === "doctors"
                ? ["Available", "Busy", "Off Duty"]
                : ["Available", "Occupied", "Cleaning"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <DataState resource={resource}>
          {resource.data?.length ? (
            <>
              {type === "beds" ? (
                <div className="bed-grid">
                  {resource.data.map((r) => (
                    <div
                      className={`bed-card ${r.status.toLowerCase()}`}
                      key={r.id}
                    >
                      <div className="spread">
                        <BedDouble size={25} />
                        <StatusBadge status={r.status} />
                      </div>
                      <h3>{r.bed_number}</h3>
                      <p>{r.patient_name || "No patient assigned"}</p>
                      {editable && (
                        <button className="text-link" onClick={() => open(r)}>
                          Manage bed <Pencil size={13} />
                        </button>
                      )}
                      {can("ADMIN") && r.status !== "Occupied" && (
                        <button
                          className="icon-btn bed-delete"
                          aria-label={`Delete ${r.bed_number}`}
                          onClick={() => {
                            setError("");
                            setModal({ kind: "delete", record: r });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          {cfg.singular === "doctor"
                            ? "Team member"
                            : "Patient"}
                        </th>
                        <th>{type === "doctors" ? "Specialization" : "Age"}</th>
                        {type === "patients" && <th>Priority</th>}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="patient-name">
                              <span className="avatar pale">
                                {type === "doctors" ? (
                                  <Stethoscope size={18} />
                                ) : (
                                  String(r.id).padStart(2, "0").slice(-2)
                                )}
                              </span>
                              <span>
                                {type === "patients" ? (
                                  <Link to={"/patients/" + r.id}>{r.name}</Link>
                                ) : (
                                  r.name
                                )}
                                <small>
                                  {type === "patients" ? "CF-" : "DR-"}
                                  {String(r.id).padStart(4, "0")}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td>
                            {type === "doctors"
                              ? r.specialization
                              : `${r.age} years`}
                          </td>
                          {type === "patients" && (
                            <td>
                              <StatusBadge status={r.priority} />
                            </td>
                          )}
                          <td>
                            <StatusBadge status={r.status} />
                          </td>
                          <td>
                            <div className="row-actions">
                              {type === "patients" && (
                                <Link
                                  className="text-link"
                                  to={"/patients/" + r.id}
                                >
                                  View
                                </Link>
                              )}
                              {editable && (
                                <button
                                  className="icon-btn"
                                  title="Edit record"
                                  aria-label={`Edit ${r.name}`}
                                  onClick={() => open(r)}
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                              {can("ADMIN") && (
                                <button
                                  className="icon-btn"
                                  title="Delete unused record"
                                  aria-label={`Delete ${r.name}`}
                                  onClick={() => {
                                    setError("");
                                    setModal({ kind: "delete", record: r });
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                pagination={resource.pagination}
                onPage={(v) => filter("page", v)}
              />
            </>
          ) : (
            <Empty />
          )}
        </DataState>
      </Panel>
      {modal && (
        <Modal
          title={
            modal.kind === "delete"
              ? `Delete ${cfg.singular}?`
              : `${modal.record ? "Edit" : "Add"} ${cfg.singular}`
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {modal.kind === "delete" ? (
            <div className="form-body">
              <p>
                This permanently deletes the record. Records with case history
                or active assignments are protected.
              </p>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button className="btn" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button className="btn danger" disabled={busy} onClick={remove}>
                  {busy ? "Deleting…" : "Delete record"}
                </button>
              </div>
            </div>
          ) : (
            <form className="form-body" onSubmit={submit}>
              {type !== "beds" && (
                <Field
                  label="Name"
                  name="name"
                  defaultValue={modal.record?.name}
                  required
                  maxLength={120}
                />
              )}{" "}
              {type === "patients" && (
                <>
                  <Field
                    label="Age"
                    name="age"
                    type="number"
                    min={0}
                    max={120}
                    defaultValue={modal.record?.age}
                    required
                  />
                  <Field label="Priority">
                    <select
                      name="priority"
                      defaultValue={modal.record?.priority || "Stable"}
                      disabled={
                        modal.record &&
                        !["Waiting", "Discharged"].includes(modal.record.status)
                      }
                    >
                      {["Stable", "Urgent", "Critical"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  {modal.record && (
                    <p className="muted">
                      For patients with an active case, review priority in
                      Emergency Operations or Decision Support.
                    </p>
                  )}
                </>
              )}
              {type === "doctors" && (
                <Field
                  label="Specialization"
                  name="specialization"
                  required
                  defaultValue={modal.record?.specialization}
                />
              )}{" "}
              {type === "beds" && (
                <Field
                  label="Bed number"
                  name="bedNumber"
                  defaultValue={modal.record?.bed_number}
                  required
                  maxLength={40}
                />
              )}{" "}
              {type !== "patients" && (
                <Field label="Status">
                  <select
                    name="status"
                    disabled={["Busy", "Occupied"].includes(
                      modal.record?.status,
                    )}
                    defaultValue={modal.record?.status || "Available"}
                  >
                    {[
                      ...new Set([
                        "Available",
                        type === "beds" ? "Cleaning" : "Off Duty",
                        ...(modal.record ? [modal.record.status] : []),
                      ]),
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="btn primary" disabled={busy}>
                  {busy ? "Saving…" : "Save record"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
